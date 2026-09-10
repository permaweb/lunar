import React from 'react';

import type { ArweavePeer, NodeObservation } from 'api/nodes';
import { nodesApi } from 'api/nodes';

import { INITIAL_REACHABLE_NODES } from '../model/config';
import { checkInitialNodes } from '../model/initialChecks';

type ListState =
	| { status: 'loading' | 'error' }
	| {
			status: 'checking' | 'ready' | 'refreshing' | 'stale';
			peers: ArweavePeer[];
			observations: Record<string, NodeObservation>;
			checkingPeers: string[];
			updatedAt: number;
			infoEnabled: boolean;
			checksInterrupted: boolean;
			revision: number;
	  };

export function useNodesList() {
	const requestRef = React.useRef<AbortController | null>(null);
	const [state, setState] = React.useState<ListState>({ status: 'loading' });
	const handleObservation = React.useCallback((data: NodeObservation) => {
		setState((current) =>
			'peers' in current ? { ...current, observations: { ...current.observations, [data.peer]: data } } : current
		);
	}, []);
	const loadPeers = React.useCallback(
		async (refresh = false) => {
			requestRef.current?.abort();
			const controller = new AbortController();
			requestRef.current = controller;
			setState((current) =>
				'peers' in current
					? { ...current, status: 'refreshing', infoEnabled: false, checkingPeers: [] }
					: { status: 'loading' }
			);
			const capabilities = nodesApi.supportsInfo(controller.signal).catch(() => false);
			try {
				const peers = await nodesApi.getPeers(controller.signal, refresh);
				if (controller.signal.aborted) return;
				const cached = nodesApi.getCachedInfo(peers);
				const alreadyReady =
					cached.filter((data) => data.status === 'reachable').length >=
					Math.min(INITIAL_REACHABLE_NODES, peers.length);
				setState((current) => ({
					status: alreadyReady ? 'ready' : 'checking',
					peers,
					observations: Object.fromEntries(cached.map((data) => [data.peer, data])),
					checkingPeers: [],
					updatedAt: Date.now(),
					infoEnabled: false,
					checksInterrupted: false,
					revision: 'revision' in current ? current.revision + 1 : 0,
				}));
				const supported = await capabilities;
				if (controller.signal.aborted) return;
				const outcome =
					supported && !alreadyReady
						? await checkInitialNodes(
								nodesApi,
								peers,
								cached,
								controller.signal,
								handleObservation,
								(checkingPeers) => {
									if (controller.signal.aborted) return;
									setState((current) => ('peers' in current ? { ...current, checkingPeers } : current));
								}
						  )
						: 'complete';
				if (controller.signal.aborted) return;
				setState((current) =>
					'peers' in current
						? {
								...current,
								status: 'ready',
								checkingPeers: [],
								infoEnabled: supported && outcome !== 'service-unavailable',
								checksInterrupted: outcome !== 'complete' || (!supported && peers.length > 0),
						  }
						: current
				);
			} catch {
				if (!controller.signal.aborted) {
					setState((current) =>
						'peers' in current ? { ...current, status: 'stale', checkingPeers: [] } : { status: 'error' }
					);
					controller.abort();
				}
			}
		},
		[handleObservation]
	);
	React.useEffect(() => {
		loadPeers();
		return () => requestRef.current?.abort();
	}, [loadPeers]);
	return { state, refresh: () => loadPeers(true), onObservation: handleObservation };
}
