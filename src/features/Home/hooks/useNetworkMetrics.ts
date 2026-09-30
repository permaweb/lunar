import React from 'react';

import { getMetricsSnapshot, readMetricsSnapshot } from 'api/networkMetrics';

import type { NetworkMetricsSnapshot } from 'helpers/types';

export type MetricsState =
	| { status: 'loading'; snapshot: null }
	| { status: 'success'; snapshot: NetworkMetricsSnapshot }
	| { status: 'error'; snapshot: null };

export function useNetworkMetrics() {
	const [state, setState] = React.useState<MetricsState>(() => {
		const snapshot = readMetricsSnapshot();
		return snapshot ? { status: 'success', snapshot } : { status: 'loading', snapshot: null };
	});
	const [attempt, setAttempt] = React.useState(0);
	React.useEffect(() => {
		let cancelled = false;
		getMetricsSnapshot().then(
			(snapshot) => {
				if (!cancelled) setState({ status: 'success', snapshot });
			},
			() => {
				if (!cancelled) setState({ status: 'error', snapshot: null });
			}
		);
		return () => {
			cancelled = true;
		};
	}, [attempt]);
	function handleRetry() {
		setState({ status: 'loading', snapshot: null });
		setAttempt((value) => value + 1);
	}
	return { ...state, onRetry: handleRetry };
}
