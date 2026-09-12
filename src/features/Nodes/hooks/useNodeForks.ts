import React from 'react';

import type { NodeInfo } from 'api/arweaveNode';
import { arweaveNodeApi } from 'api/arweaveNode';
import type { ArweavePeer, NodeObservation } from 'api/nodes';
import { nodesApi } from 'api/nodes';

import { FORK_CHECK_CONCURRENCY, FORK_CHECK_TIMEOUT_MS, FORK_TIP_SOURCE_ATTEMPTS } from '../model/config';
import type { ForkAncestry } from '../model/forks';
import { getForkTips } from '../model/forks';

type Snapshot = {
	peers: ArweavePeer[];
	infos: Record<string, NodeInfo>;
	observations: Record<string, NodeObservation>;
	ancestry: ForkAncestry;
	checkingPeers: string[];
};
type ForkState =
	| { status: 'loading' | 'error' }
	| {
			status: 'tips' | 'ancestry' | 'ready' | 'refreshing' | 'stale';
			data: Snapshot;
	  };

async function checkInParallel<T>(
	items: T[],
	signal: AbortSignal,
	check: (item: T, signal: AbortSignal) => Promise<void>
): Promise<void> {
	const controller = new AbortController();
	const cancel = () => controller.abort();
	signal.addEventListener('abort', cancel, { once: true });
	if (signal.aborted) cancel();
	const timeout = setTimeout(cancel, FORK_CHECK_TIMEOUT_MS);
	let next = 0;
	try {
		await Promise.all(
			Array.from({ length: Math.min(items.length, FORK_CHECK_CONCURRENCY) }, async () => {
				while (next < items.length && !controller.signal.aborted) await check(items[next++], controller.signal);
			})
		);
	} finally {
		clearTimeout(timeout);
		signal.removeEventListener('abort', cancel);
		cancel();
	}
}

export function useNodeForks(): {
	state: ForkState;
	refresh: () => void;
	continueChecks: () => void;
	pause: () => void;
} {
	const request = React.useRef<AbortController | null>(null);
	const [state, setState] = React.useState<ForkState>({ status: 'loading' });
	const load = React.useCallback(async (refresh = false, previous?: Snapshot) => {
		request.current?.abort();
		const controller = new AbortController();
		request.current = controller;
		setState((current) => ('data' in current ? { ...current, status: 'refreshing' } : { status: 'loading' }));
		try {
			const peers = previous?.peers ?? (await nodesApi.getPeers(controller.signal, refresh));
			if (controller.signal.aborted) return;
			const data: Snapshot = previous
				? { ...previous, checkingPeers: [] }
				: { peers, infos: {}, observations: {}, ancestry: {}, checkingPeers: [] };
			function publish(status: 'tips' | 'ancestry' | 'ready') {
				if (!controller.signal.aborted)
					setState({
						status,
						data: {
							...data,
							checkingPeers: [...data.checkingPeers],
						},
					});
			}
			publish('tips');
			await checkInParallel(
				peers.filter((peer) => !data.observations[peer.address]),
				controller.signal,
				async (peer, signal) => {
					const started = Date.now();
					data.checkingPeers.push(peer.address);
					publish('tips');
					try {
						const info = await arweaveNodeApi.getInfo(peer.address, signal);
						if (signal.aborted) return;
						data.infos = { ...data.infos, [peer.address]: info };
						data.observations = {
							...data.observations,
							[peer.address]: {
								peer: peer.address,
								status: 'reachable',
								checkedAt: Date.now(),
								latencyMs: Date.now() - started,
								info,
							},
						};
					} catch {
						if (!signal.aborted)
							data.observations = {
								...data.observations,
								[peer.address]: {
									peer: peer.address,
									status: 'unavailable',
									checkedAt: Date.now(),
								},
							};
					} finally {
						data.checkingPeers = data.checkingPeers.filter((address) => address !== peer.address);
						publish('tips');
					}
				}
			);
			if (controller.signal.aborted) return;
			publish('ancestry');
			const tips = getForkTips(peers, data.infos);
			await checkInParallel(tips, controller.signal, async (tip, signal) => {
				const heights = [
					...new Set(
						tips
							.filter(
								(other) =>
									other.info.network === tip.info.network &&
									other.info.height < tip.info.height &&
									data.ancestry[tip.id]?.[other.info.height] === undefined
							)
							.map((other) => other.info.height)
					),
				];
				if (!heights.length) return;
				// Identical tips share one ancestry lookup; another peer can supply it
				// if the first peer went offline or reorganized after its /info read.
				for (const peer of tip.peers.slice(0, FORK_TIP_SOURCE_ATTEMPTS)) {
					try {
						const ancestors = await arweaveNodeApi.getAncestors(peer.address, tip.info, heights, signal);
						if (signal.aborted) return;
						data.ancestry = {
							...data.ancestry,
							[tip.id]: {
								...data.ancestry[tip.id],
								...Object.fromEntries(ancestors.map((block) => [block.height, block.hash])),
							},
						};
						publish('ancestry');
						return;
					} catch {
						if (signal.aborted) return;
						// No proof is an unknown relationship, never evidence of a fork.
					}
				}
			});
			publish('ready');
		} catch {
			if (!controller.signal.aborted)
				setState((current) => ('data' in current ? { ...current, status: 'stale' } : { status: 'error' }));
		}
	}, []);
	React.useEffect(() => {
		load();
		return () => request.current?.abort();
	}, [load]);
	return {
		state,
		pause: () => {
			request.current?.abort();
			setState((current) =>
				'data' in current && ['tips', 'ancestry', 'refreshing'].includes(current.status)
					? { status: 'ready', data: { ...current.data, checkingPeers: [] } }
					: current
			);
		},
		refresh: () => {
			void load(true);
		},
		continueChecks: () => {
			if ('data' in state) void load(false, state.data);
		},
	};
}
