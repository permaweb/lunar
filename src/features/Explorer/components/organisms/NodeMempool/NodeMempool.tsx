import React from 'react';

import { arweaveNodeApi } from 'api/arweaveNode';

import { Button } from 'components/atoms/Button';
import { ExplorerLink } from 'components/atoms/TxAddress';
import { TransactionList } from 'components/molecules/TransactionList';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { useNodeResource } from '../../../hooks/useNodeResource';
import { useNodeTransactions } from '../../../hooks/useNodeTransactions';
import type { MempoolSnapshot } from '../../../model/node';
import { NODE_PAGE_SIZE, observeMempool } from '../../../model/node';

import * as S from './styles';

export default function NodeMempool(props: { node: string; isActive: boolean; refreshRevision: number }) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const previous = React.useRef<MempoolSnapshot | null>(null);
	const [page, setPage] = React.useState(0);
	const read = React.useCallback(
		async (signal: AbortSignal) => {
			const ids = await arweaveNodeApi.getPending(props.node, signal);
			const next = observeMempool(previous.current, ids, Date.now());
			if (!signal.aborted) previous.current = next;
			return next;
		},
		[props.node, props.refreshRevision]
	);
	const resource = useNodeResource(read, props.isActive, true);
	const totalPages = Math.max(1, Math.ceil((resource.data?.ids.length ?? 0) / NODE_PAGE_SIZE));
	const currentPage = Math.min(page, totalPages - 1);
	const visibleIds = React.useMemo(
		() => resource.data?.ids.slice(currentPage * NODE_PAGE_SIZE, (currentPage + 1) * NODE_PAGE_SIZE) ?? [],
		[resource.data?.ids, currentPage]
	);
	const details = useNodeTransactions(props.node, visibleIds, resource.data?.checkedAt, props.isActive);
	const detailsById = new Map(details.data?.map((entry) => [entry.id, entry]) ?? []);
	function handleRefresh() {
		resource.refresh();
	}
	return (
		<S.Section>
			<S.Note>{language.nodeMempoolDescription}</S.Note>
			{'error' in resource.state && (
				<S.Error role={'alert'}>
					{language.nodeErrors[resource.state.error]} {resource.data && language.nodeStale}
				</S.Error>
			)}
			{resource.isLoading && <S.Note role={'status'}>{language.nodeMempoolLoading}</S.Note>}
			{!resource.data && (
				<Button type={'alt3'} label={language.refresh} onPress={resource.refresh} disabled={resource.isLoading} />
			)}
			{resource.data && (
				<>
					<S.Note>
						{language.nodeLastObserved(new Date(resource.data.checkedAt).toLocaleString())} ·{' '}
						{resource.data.isBaseline
							? language.nodeMempoolBaseline
							: language.nodeMempoolChanges(resource.data.added.length, resource.data.removed.length)}
					</S.Note>
					<TransactionList
						mode={'recent'}
						header={`${language.nodePendingTransactions} (${resource.data.ids.length.toLocaleString()})`}
						source={{
							loading: resource.isLoading || details.isLoading,
							onRefresh: handleRefresh,
							timeLabel: language.nodeFirstObserved,
							pendingIds: visibleIds.filter((id) => !detailsById.get(id)?.transaction && !detailsById.get(id)?.error),
							timestamps: resource.data.firstSeen,
							edges: visibleIds.map((id) => {
								const tx = detailsById.get(id)?.transaction;
								return {
									cursor: id,
									node: {
										id,
										tags: tx?.tags ?? [],
										owner: tx?.owner ? { address: tx.owner } : undefined,
										recipient: tx?.recipient ?? undefined,
										quantity: tx?.denomination === 1 ? { winston: tx.quantity } : undefined,
										fee: tx?.denomination === 1 ? { winston: tx.fee } : undefined,
										data: tx ? { size: tx.dataSize, type: tx.contentType ?? '' } : undefined,
									},
								};
							}),
							pagination: (
								<>
									<Button
										type={'alt3'}
										label={language.previous}
										disabled={currentPage === 0}
										onPress={() => setPage(currentPage - 1)}
									/>
									<S.Note>{language.nodesPage(currentPage + 1, totalPages)}</S.Note>
									<Button
										type={'alt3'}
										label={language.next}
										disabled={currentPage >= totalPages - 1}
										onPress={() => setPage(currentPage + 1)}
									/>
								</>
							),
						}}
					/>
					{visibleIds.some((id) => detailsById.get(id)?.error) && (
						<S.Error role={'status'}>{language.nodeTransactionDetailsError}</S.Error>
					)}
					{!resource.data.ids.length && <S.Note>{language.nodeMempoolEmpty}</S.Note>}

					{!resource.data.isBaseline && (
						<S.Changes>
							{[
								[language.nodeAdded, resource.data.added],
								[language.nodeRemoved, resource.data.removed],
							].map(([label, values]: [string, string[]]) => (
								<div key={label}>
									<h4>
										{label} ({values.length.toLocaleString()})
									</h4>
									{values.slice(0, NODE_PAGE_SIZE).map((id) => (
										<ExplorerLink key={id} value={id} />
									))}
									{values.length > NODE_PAGE_SIZE && <S.Note>{language.nodeChangesLimit(NODE_PAGE_SIZE)}</S.Note>}
								</div>
							))}
						</S.Changes>
					)}
				</>
			)}
		</S.Section>
	);
}
