import React from 'react';

import { AoReadError } from 'api/aoNetwork';
import type { ArweaveSchedulePage, PeerApi } from 'api/permaweb';
import { ARWEAVE_SCHEDULE_PAGE_SIZE } from 'api/permaweb';

type ScheduleState =
	| { status: 'idle' | 'loading' }
	| { status: 'success' | 'refreshing'; data: ArweaveSchedulePage }
	| { status: 'stale'; data: ArweaveSchedulePage; error: AoReadError['code'] }
	| { status: 'error'; error: AoReadError['code'] };

export function useArweaveMessages(
	api: PeerApi | null,
	processId: string,
	isActive: boolean
): {
	state: ScheduleState;
	page: number;
	totalCount: number | null;
	onPageChange: (page: number) => void;
	refresh: () => void;
	retry: () => void;
} {
	const scope = React.useMemo(() => ({ api, processId }), [api, processId]);
	const [request, setRequest] = React.useState({
		scope,
		page: 0,
		latestSlot: undefined as number | undefined,
		revision: 0,
	});
	const currentRequest = React.useMemo(
		() => (request.scope === scope ? request : { scope, page: 0, latestSlot: undefined, revision: 0 }),
		[scope, request]
	);
	const previous = React.useRef<{ request: typeof request; data: ArweaveSchedulePage } | null>(null);
	const [result, setResult] = React.useState<{ request: typeof request; state: ScheduleState }>({
		request,
		state: { status: 'idle' },
	});

	React.useEffect(() => {
		if (!isActive || !api) return;
		if (previous.current?.request === currentRequest) {
			setResult({ request: currentRequest, state: { status: 'success', data: previous.current.data } });
			return;
		}
		const controller = new AbortController();
		const cached =
			previous.current?.request.scope === scope && previous.current.data.page === currentRequest.page
				? previous.current.data
				: null;
		setResult({
			request: currentRequest,
			state: cached ? { status: 'refreshing', data: cached } : { status: 'loading' },
		});
		void (async () => {
			try {
				const data = await api.readArweaveSchedulePage({
					processId,
					page: currentRequest.page,
					latestSlot: currentRequest.latestSlot,
					signal: controller.signal,
				});
				if (controller.signal.aborted) return;
				previous.current = { request: currentRequest, data };
				setResult({ request: currentRequest, state: { status: 'success', data } });
			} catch (error) {
				if (controller.signal.aborted) return;
				const code = error instanceof AoReadError ? error.code : 'unavailable';
				setResult({
					request: currentRequest,
					state: cached ? { status: 'stale', data: cached, error: code } : { status: 'error', error: code },
				});
			}
		})();
		return () => controller.abort();
	}, [scope, api, processId, currentRequest, isActive]);

	const state: ScheduleState = result.request === currentRequest ? result.state : { status: 'loading' };
	const latestSlot = 'data' in state ? state.data.latestSlot : currentRequest.latestSlot;
	return {
		state,
		page: currentRequest.page,
		totalCount: latestSlot === undefined ? null : latestSlot + 1,
		onPageChange: (page) => {
			if (
				latestSlot === undefined ||
				!Number.isSafeInteger(page) ||
				page < 0 ||
				page >= Math.ceil((latestSlot + 1) / ARWEAVE_SCHEDULE_PAGE_SIZE)
			)
				return;
			setRequest({ scope, page, latestSlot, revision: currentRequest.revision + 1 });
		},
		refresh: () => setRequest({ scope, page: 0, latestSlot: undefined, revision: currentRequest.revision + 1 }),
		retry: () => setRequest({ ...currentRequest, revision: currentRequest.revision + 1 }),
	};
}
