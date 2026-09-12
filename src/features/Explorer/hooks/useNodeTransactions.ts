import React from 'react';

import type { NodeErrorCode, NodeTransaction } from 'api/arweaveNode';
import { arweaveNodeApi } from 'api/arweaveNode';

import { nodeError } from '../model/node';

import { useNodeResource } from './useNodeResource';

type TransactionEntry = { id: string; transaction: NodeTransaction | null; error: NodeErrorCode | null };

export function useNodeTransactions(
	node: string,
	ids: string[],
	checkedAt: number | undefined,
	isActive: boolean,
	state: 'pending' | 'confirmed' = 'pending'
) {
	const previous = React.useRef(new Map<string, NodeTransaction>());
	const read = React.useCallback(
		async (signal: AbortSignal, onProgress: (entries: TransactionEntry[]) => void) => {
			const completed = new Map<string, TransactionEntry>();
			for (const id of ids) {
				const transaction = previous.current.get(`${node}/${id}`);
				if (transaction) completed.set(id, { id, transaction, error: null });
			}
			const publish = () => onProgress(ids.flatMap((id) => (completed.has(id) ? [completed.get(id)!] : [])));
			publish();
			const entries = await Promise.all(
				ids.map(async (id) => {
					const key = `${node}/${id}`;
					const cached = previous.current.get(key);
					// Confirmed transaction contents are immutable; retry missing metadata only.
					if (state === 'confirmed' && cached) return { id, transaction: cached, error: null };
					let entry: TransactionEntry;
					try {
						entry = { id, transaction: await arweaveNodeApi.getTransaction(node, id, signal, state), error: null };
					} catch (error) {
						entry = { id, transaction: cached ?? null, error: nodeError(error) };
					}
					if (!signal.aborted) {
						completed.set(id, entry);
						if (entry.transaction) previous.current.set(key, entry.transaction);
						publish();
					}
					return entry;
				})
			);
			if (!signal.aborted)
				previous.current = new Map(
					entries.flatMap((entry) => (entry.transaction ? [[`${node}/${entry.id}`, entry.transaction]] : []))
				);
			return entries;
		},
		[node, ids, checkedAt, state]
	);
	return useNodeResource(read, isActive && ids.length > 0);
}
