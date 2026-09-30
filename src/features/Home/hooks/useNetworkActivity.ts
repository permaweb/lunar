import React from 'react';

import type { NetworkActivityEntry } from 'api/networkActivity';
import { getNetworkActivity } from 'api/networkActivity';

type ActivityState =
	| { status: 'loading' | 'error'; entries: null }
	| { status: 'success' | 'refreshing' | 'stale'; entries: NetworkActivityEntry[] };

export function useNetworkActivity() {
	const [state, setState] = React.useState<ActivityState>({ status: 'loading', entries: null });
	const [attempt, setAttempt] = React.useState(0);
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
	return { ...state, onRefresh: () => setAttempt((value) => value + 1) };
}
