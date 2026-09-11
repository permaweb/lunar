import React from 'react';

import type { ResourceState } from '../model/node';
import { NODE_REFRESH_MS, nodeError } from '../model/node';

export function useNodeResource<T>(
	read: (signal: AbortSignal, onProgress: (data: T) => void) => Promise<T>,
	isActive: boolean,
	shouldPoll = false
): {
	state: ResourceState<T>;
	data: T | null;
	isLoading: boolean;
	refresh: () => void;
} {
	const latest = React.useRef<T | null>(null);
	const [state, setState] = React.useState<ResourceState<T>>({ status: 'idle' });
	const [revision, setRevision] = React.useState(0);
	React.useEffect(() => {
		if (!isActive) {
			setState(latest.current === null ? { status: 'idle' } : { status: 'success', data: latest.current });
			return;
		}
		const controller = new AbortController();
		let running = false;
		async function run() {
			if (running || controller.signal.aborted) return;
			running = true;
			setState(latest.current === null ? { status: 'loading' } : { status: 'refreshing', data: latest.current });
			try {
				const data = await read(controller.signal, (partial) => {
					if (controller.signal.aborted) return;
					latest.current = partial;
					setState({ status: 'refreshing', data: partial });
				});
				if (!controller.signal.aborted) {
					latest.current = data;
					setState({ status: 'success', data });
				}
			} catch (error) {
				if (!controller.signal.aborted)
					setState(
						latest.current === null
							? { status: 'error', error: nodeError(error) }
							: { status: 'stale', data: latest.current, error: nodeError(error) }
					);
			} finally {
				running = false;
			}
		}
		void run();
		const timer = shouldPoll
			? setInterval(() => {
					if (!document.hidden) void run();
			  }, NODE_REFRESH_MS)
			: null;
		return () => {
			controller.abort();
			if (timer) clearInterval(timer);
		};
	}, [read, isActive, shouldPoll, revision]);
	return {
		state,
		data: 'data' in state ? state.data : null,
		isLoading: state.status === 'loading' || state.status === 'refreshing',
		refresh: React.useCallback(() => setRevision((value) => value + 1), []),
	};
}
