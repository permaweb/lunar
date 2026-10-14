import React from 'react';

import type { NetworkActivityEntry } from 'api/networkActivity';
import { getNetworkActivity, getNetworkActivityBlockSizes } from 'api/networkActivity';

type ActivityState =
	| { status: 'loading'; entries: null }
	| { status: 'error'; entries: null }
	| { status: 'success' | 'refreshing' | 'stale'; entries: NetworkActivityEntry[] };

export function useNetworkActivity(
	network: NetworkActivityEntry['network'] | 'all' = 'all'
): ActivityState & { onRefresh: () => void } {
	const [state, setState] = React.useState<ActivityState>({ status: 'loading', entries: null });
	const [attempt, setAttempt] = React.useState(0);
	const [blockSizes, setBlockSizes] = React.useState<Record<string, string>>({});
	const blockIds = React.useMemo(
		() =>
			(state.entries ?? [])
				.filter((entry) => network === 'all' || entry.network === network)
				.slice(0, 20)
				.filter((entry) => entry.kind === 'block' && entry.dataSize === null)
				.map((entry) => entry.id),
		[state.entries, network]
	);
	React.useEffect(() => {
		let cancelled = false;
		let controller: AbortController;
		let refreshTimer: ReturnType<typeof setTimeout>;
		async function refresh() {
			controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 15000);
			setState((previous) =>
				previous.entries ? { status: 'refreshing', entries: previous.entries } : { status: 'loading', entries: null }
			);
			try {
				const entries = await getNetworkActivity(controller.signal);
				if (!cancelled) setState({ status: 'success', entries });
			} catch {
				if (!cancelled)
					setState((previous) =>
						previous.entries ? { status: 'stale', entries: previous.entries } : { status: 'error', entries: null }
					);
			} finally {
				clearTimeout(timeout);
				if (!cancelled) refreshTimer = setTimeout(refresh, 60000);
			}
		}
		void refresh();
		return () => {
			cancelled = true;
			controller?.abort();
			clearTimeout(refreshTimer);
		};
	}, [attempt]);
	React.useEffect(() => {
		if (!blockIds.length) return;
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 15000);
		void getNetworkActivityBlockSizes(blockIds, controller.signal)
			.then((sizes) => {
				if (!controller.signal.aborted)
					setBlockSizes((previous) =>
						Object.fromEntries(
							blockIds.flatMap((id) => {
								const size = sizes[id] ?? previous[id];
								return size === undefined ? [] : [[id, size]];
							})
						)
					);
			})
			.catch((error: unknown) => {
				if (!controller.signal.aborted) console.error('Failed to load activity block sizes:', error);
			})
			.finally(() => clearTimeout(timeout));
		return () => {
			controller.abort();
			clearTimeout(timeout);
		};
	}, [blockIds]);
	const onRefresh = () => setAttempt((value) => value + 1);
	if (state.status === 'loading' || state.status === 'error') return { ...state, onRefresh };
	return {
		...state,
		entries: state.entries.map((entry) =>
			entry.kind === 'block' ? { ...entry, dataSize: blockSizes[entry.id] ?? entry.dataSize } : entry
		),
		onRefresh,
	};
}
