import React from 'react';

import type { ArweavePeer, NodeObservation } from 'api/nodes';
import { nodesApi } from 'api/nodes';

type InfoState = { status: 'idle' | 'loading' | 'error' } | { status: 'success'; data: NodeObservation };

export function useNodeInfo(
	peer: ArweavePeer,
	enabled: boolean,
	observation: NodeObservation | undefined,
	onObservation: (data: NodeObservation) => void
) {
	const ref = React.useRef<HTMLTableRowElement>(null);
	const [state, setState] = React.useState<InfoState>({ status: 'idle' });
	React.useEffect(() => {
		setState({ status: 'idle' });
		if (observation || !enabled || !ref.current || typeof IntersectionObserver === 'undefined') return;
		let request: AbortController | undefined;
		let finished = false;
		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries.some((entry) => entry.isIntersecting);
				if (!visible) {
					request?.abort();
					request = undefined;
					if (!finished) setState({ status: 'idle' });
					return;
				}
				if (request || finished) return;
				const controller = new AbortController();
				request = controller;
				setState({ status: 'loading' });
				nodesApi.getInfo(peer, controller.signal).then(
					(data) => {
						if (controller.signal.aborted) return;
						finished = true;
						onObservation(data);
						setState({ status: 'success', data });
					},
					() => {
						if (controller.signal.aborted) return;
						finished = true;
						setState({ status: 'error' });
					}
				);
			},
			{ rootMargin: '0px', threshold: 0 }
		);
		observer.observe(ref.current);
		return () => {
			observer.disconnect();
			request?.abort();
		};
	}, [peer.address, enabled, observation, onObservation]);
	return { ref, state };
}
