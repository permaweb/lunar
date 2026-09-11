import React from 'react';

import { arweaveNodeApi, ArweaveNodeError } from 'api/arweaveNode';

import type { getNodeTransactionPage } from '../model/node';

import { useNodeResource } from './useNodeResource';

type TransactionIds = { node: string; scope: string; entries: { id: string; blockHash: string }[]; checkedAt: number };

export function useNodeTransactionIds(
	node: string,
	segments: ReturnType<typeof getNodeTransactionPage>['segments'],
	revision: number,
	isActive: boolean
) {
	const previous = React.useRef<TransactionIds | null>(null);
	// A stable page identity prevents older-block progress from restarting visible reads.
	const scope = segments
		.map(({ block, offset, count }) => `${block.hash}:${block.transactions}:${offset}:${count}`)
		.join(',');
	const read = React.useCallback(
		async (signal: AbortSignal, onProgress: (data: TransactionIds) => void) => {
			const completed = new Map<number, TransactionIds['entries']>();
			const requests = scope ? scope.split(',') : [];
			if (previous.current?.node === node && previous.current.scope === scope) {
				for (const [index, request] of requests.entries()) {
					const blockHash = request.split(':')[0];
					completed.set(
						index,
						previous.current.entries.filter((entry) => entry.blockHash === blockHash)
					);
				}
			}
			const snapshot = () => ({
				node,
				scope,
				checkedAt: Date.now(),
				entries: requests.flatMap((_, index) => completed.get(index) ?? []),
			});
			const results = await Promise.allSettled(
				requests.map(async (request, index) => {
					const [blockHash, total, offset, count] = request.split(':');
					const ids = await arweaveNodeApi.getBlockTransactionIds(node, blockHash, signal);
					if (ids.length !== Number(total)) throw new ArweaveNodeError('invalid-response');
					if (signal.aborted) return;
					completed.set(
						index,
						ids.slice(Number(offset), Number(offset) + Number(count)).map((id) => ({ id, blockHash }))
					);
					const next = snapshot();
					previous.current = next;
					onProgress(next);
				})
			);
			for (const result of results) if (result.status === 'rejected') throw result.reason;
			return snapshot();
		},
		[node, scope, revision]
	);
	const resource = useNodeResource(read, isActive && segments.length > 0);
	return { ...resource, data: resource.data?.node === node && resource.data?.scope === scope ? resource.data : null };
}
