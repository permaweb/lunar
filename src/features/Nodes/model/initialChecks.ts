import type { ArweavePeer, NodeObservation, NodesApi } from 'api/nodes';

import { NODE_INFO_CONCURRENCY } from 'helpers/config';

import { INITIAL_CHECK_TIMEOUT_MS, INITIAL_REACHABLE_NODES } from './config';

export async function checkInitialNodes(
	api: NodesApi,
	peers: ArweavePeer[],
	cached: NodeObservation[],
	signal: AbortSignal,
	onObservation: (data: NodeObservation) => void,
	onChecking: (peers: string[]) => void
): Promise<'complete' | 'timeout' | 'service-unavailable'> {
	let reachable = cached.filter((data) => data.status === 'reachable').length;
	const target = Math.min(INITIAL_REACHABLE_NODES, peers.length);
	if (reachable >= target || signal.aborted) return 'complete';
	const checked = new Set(cached.map((data) => data.peer));
	const candidates = peers.filter((peer) => !checked.has(peer.address));
	const controller = new AbortController();
	const cancel = () => controller.abort();
	let outcome: 'complete' | 'timeout' | 'service-unavailable' = 'complete';
	let failures = 0;
	let next = 0;
	const checkingPeers = new Set<string>();
	signal.addEventListener('abort', cancel, { once: true });
	const timer = setTimeout(() => {
		outcome = 'timeout';
		cancel();
	}, INITIAL_CHECK_TIMEOUT_MS);
	async function work() {
		while (!controller.signal.aborted && next < candidates.length && reachable < target) {
			const peer = candidates[next++];
			try {
				checkingPeers.add(peer.address);
				onChecking([...checkingPeers]);
				const data = await api.getInfo(peer, controller.signal);
				if (controller.signal.aborted) return;
				failures = 0;
				onObservation(data);
				if (data.status === 'reachable') reachable++;
				if (reachable >= target) cancel();
			} catch {
				if (controller.signal.aborted) return;
				if (++failures >= 3) {
					outcome = 'service-unavailable';
					cancel();
				}
			} finally {
				checkingPeers.delete(peer.address);
				onChecking([...checkingPeers]);
			}
		}
	}
	try {
		await Promise.all(Array.from({ length: NODE_INFO_CONCURRENCY }, work));
		return outcome;
	} finally {
		clearTimeout(timer);
		signal.removeEventListener('abort', cancel);
		cancel();
	}
}
