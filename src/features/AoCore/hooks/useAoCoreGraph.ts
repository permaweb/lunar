import React from 'react';

import { type MessageValue, readAoCoreValue } from 'api/aoCore';
import { AoReadError, getAoReadTransport } from 'api/aoNetwork';

import { useSettingsProvider } from 'providers/SettingsProvider';

import { getMessageFields, MAX_MESSAGE_EXPANSION_DEPTH } from '../model/fields';
import { type GraphEntry, MAX_GRAPH_NODES, removeGraphBranch } from '../model/graph';

export function useAoCoreGraph(value: MessageValue, rootId: string) {
	const settingsProvider = useSettingsProvider();
	const transport = React.useMemo(
		() => getAoReadTransport(settingsProvider.settings.aoNetwork),
		[settingsProvider.settings.aoNetwork]
	);
	const scope = React.useMemo(() => ({ value, rootId, transport }), [value, rootId, transport]);
	const initial = React.useMemo(
		() => ({
			scope,
			serial: 1,
			entries: [
				{
					id: 'root',
					linkId: rootId,
					ancestors: rootId ? [rootId] : [],
					depth: 0,
					isCommitmentMetadata: false,
					content: { status: 'ready', value },
				} as GraphEntry,
			],
		}),
		[scope, value, rootId]
	);
	const requests = React.useRef(new Map<string, AbortController>());
	const [snapshot, setSnapshot] = React.useState(initial);
	const current = snapshot.scope === scope ? snapshot : initial;

	React.useEffect(() => {
		const pending = requests.current;
		return () => {
			for (const controller of pending.values()) controller.abort();
			pending.clear();
		};
	}, [scope]);

	React.useEffect(() => {
		const loading = current.entries.filter((entry) => entry.content.status === 'loading');
		for (const [id, controller] of requests.current) {
			if (!loading.some((entry) => entry.id === id)) {
				controller.abort();
				requests.current.delete(id);
			}
		}
		for (const entry of loading) {
			if (requests.current.has(entry.id)) continue;
			const controller = new AbortController();
			requests.current.set(entry.id, controller);
			function receive(content: GraphEntry['content']) {
				if (controller.signal.aborted) return;
				setSnapshot((previous) =>
					previous.scope !== scope
						? previous
						: {
								...previous,
								entries: previous.entries.map((item) => (item.id === entry.id ? { ...item, content } : item)),
						  }
				);
			}
			readAoCoreValue(transport, entry.linkId, { signal: controller.signal })
				.then((result) => receive({ status: 'ready', value: result.data.value, provider: result.provider }))
				.catch((error: unknown) =>
					receive({
						status: 'error',
						code:
							error instanceof AoReadError && (error.code === 'timeout' || error.code === 'invalid-response')
								? error.code
								: 'unavailable',
					})
				);
		}
	}, [current.entries, scope, transport]);

	const handleToggle = React.useCallback(
		(id: string, key: string) => {
			setSnapshot((previous) => {
				const next = previous.scope === scope ? previous : initial;
				const child = next.entries.find((entry) => entry.parent === id && entry.fieldKey === key);
				if (child) return { ...next, entries: removeGraphBranch(next.entries, child.id) };
				const parent = next.entries.find((entry) => entry.id === id);
				if (parent?.content.status !== 'ready' || next.entries.length >= MAX_GRAPH_NODES) return next;
				const field = getMessageFields(parent.content.value).find((item) => item.key === key);
				if (!field || (!field.linkId && field.type !== 'message' && field.type !== 'list')) return next;
				const reason =
					parent.depth >= MAX_MESSAGE_EXPANSION_DEPTH
						? 'depth'
						: field.linkId && parent.ancestors.includes(field.linkId)
						? 'cycle'
						: null;
				const entry: GraphEntry = {
					id: `message-${next.serial}`,
					parent: id,
					fieldKey: key,
					linkId: field.linkId,
					ancestors: field.linkId ? [...parent.ancestors, field.linkId] : parent.ancestors,
					depth: parent.depth + 1,
					isCommitmentMetadata: parent.isCommitmentMetadata || key === 'commitments' || key === 'commitments+link',
					content: reason
						? { status: 'blocked', reason }
						: field.linkId
						? { status: 'loading' }
						: { status: 'ready', value: field.value },
				};
				return { ...next, serial: next.serial + 1, entries: [...next.entries, entry] };
			});
		},
		[scope, initial]
	);

	const handleRetry = React.useCallback(
		(id: string) => {
			setSnapshot((previous) =>
				previous.scope !== scope
					? previous
					: {
							...previous,
							entries: previous.entries.map((entry) =>
								entry.id === id && entry.content.status === 'error'
									? { ...entry, content: { status: 'loading' } }
									: entry
							),
					  }
			);
		},
		[scope]
	);

	return { entries: current.entries, scope, onToggle: handleToggle, onRetry: handleRetry };
}
