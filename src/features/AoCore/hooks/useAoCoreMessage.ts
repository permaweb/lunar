import React from 'react';

import { type AoCoreReadState, type AoCoreState, readAoCoreMessage, readAoCoreValue } from 'api/aoCore';
import { AoReadError, type AoReadResult, getAoReadTransport } from 'api/aoNetwork';

import { useSettingsProvider } from 'providers/SettingsProvider';

function useAoCoreRead<T>(
	id: string,
	enabled: boolean,
	revision: number,
	read: (
		transport: ReturnType<typeof getAoReadTransport>,
		id: string,
		options: { signal: AbortSignal }
	) => Promise<AoReadResult<T>>
): AoCoreReadState<T> {
	const { settings } = useSettingsProvider();
	const transport = React.useMemo(() => getAoReadTransport(settings.aoNetwork), [settings.aoNetwork]);
	const [snapshot, setSnapshot] = React.useState<{
		key: string;
		transport: typeof transport;
		state: AoCoreReadState<T>;
	}>();
	const key = `${id}:${revision}`;
	const settled =
		snapshot?.key === key &&
		snapshot.transport === transport &&
		(snapshot.state.status === 'ready' || snapshot.state.status === 'error');

	React.useEffect(() => {
		// Tab activation resumes unfinished reads; only a new scope or refresh replaces a settled result.
		if (!enabled || settled) return;
		const controller = new AbortController();
		setSnapshot({ key, transport, state: { status: 'loading' } });
		read(transport, id, { signal: controller.signal })
			.then((result) => {
				if (!controller.signal.aborted)
					setSnapshot({
						key,
						transport,
						state: { status: 'ready', result },
					});
			})
			.catch((error: unknown) => {
				if (!controller.signal.aborted)
					setSnapshot({
						key,
						transport,
						state: {
							status: 'error',
							code:
								error instanceof AoReadError && ['invalid-response', 'timeout'].includes(error.code)
									? (error.code as 'invalid-response' | 'timeout')
									: 'unavailable',
						},
					});
			});
		return () => controller.abort();
	}, [transport, id, enabled, key, read, settled]);

	return React.useMemo(
		() =>
			snapshot?.key === key && snapshot.transport === transport
				? snapshot.state
				: { status: enabled ? 'loading' : 'idle' },
		[snapshot, key, transport, enabled]
	);
}

export function useAoCoreMessage(id: string, enabled: boolean, context: boolean, revision = 0): AoCoreState {
	const state = useAoCoreRead(id, enabled, revision, readAoCoreMessage);
	return React.useMemo(() => {
		if (state.status !== 'ready' || state.result.data.evidence.length) return state;
		return context
			? { status: 'ready', result: { ...state.result, data: { ...state.result.data, evidence: ['context'] } } }
			: { status: 'unrecognized' };
	}, [state, context]);
}

export function useAoCoreValue(id: string, revision = 0) {
	return useAoCoreRead(id, true, revision, readAoCoreValue);
}
