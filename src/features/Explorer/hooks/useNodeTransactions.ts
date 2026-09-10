import React from 'react';

import { arweaveNodeApi, NodeTransaction } from 'api/arweaveNode';

import { nodeError } from '../model/node';

import { useNodeResource } from './useNodeResource';

export function useNodeTransactions(node: string, ids: string[], checkedAt: number | undefined, isActive: boolean) {
	const previous = React.useRef(new Map<string, NodeTransaction>());
	const read = React.useCallback(
		async (signal: AbortSignal) => {
			const entries = await Promise.all(
				ids.map(async (id) => {
					try {
						return { id, transaction: await arweaveNodeApi.getTransaction(node, id, signal), error: null };
					} catch (error) {
						return { id, transaction: previous.current.get(id) ?? null, error: nodeError(error) };
					}
				})
			);
			if (!signal.aborted)
				previous.current = new Map(
					entries.flatMap((entry) => (entry.transaction ? [[entry.id, entry.transaction]] : []))
				);
			return entries;
		},
		[node, ids, checkedAt]
	);
	return useNodeResource(read, isActive && ids.length > 0);
}
