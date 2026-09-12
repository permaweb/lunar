import React from 'react';

import { arweaveNodeApi, readNodeMempool, saveNodeMempool } from 'api/arweaveNode';

import { Modal } from 'components/atoms/Modal';
import { TransactionList } from 'components/molecules/TransactionList';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { useNodeResource } from '../../../hooks/useNodeResource';
import { useNodeTransactions } from '../../../hooks/useNodeTransactions';
import type { MempoolSnapshot } from '../../../model/node';
import { NODE_PAGE_SIZE, observeMempool, toNodeTransactionEdge } from '../../../model/node';
import { NodePagination } from '../../molecules/NodePagination';
import { NodeTransactionChanges } from '../../molecules/NodeTransactionChanges';

import * as S from './styles';

const EMPTY_IDS: string[] = [];

export default function NodeMempool(props: {
	node: string;
	network: string;
	isActive: boolean;
	isResolving: boolean;
	refreshRevision: number;
	showInfo: boolean;
	onCloseInfo: () => void;
}) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const previous = React.useRef<MempoolSnapshot | null>(null);
	const [page, setPage] = React.useState(0);
	const read = React.useCallback(
		async (signal: AbortSignal, onProgress: (snapshot: MempoolSnapshot) => void) => {
			if (!previous.current) {
				const cached = await readNodeMempool(props.node, props.network);
				if (signal.aborted) return cached;
				if (cached) {
					previous.current = cached;
					onProgress(cached);
				}
			}
			const ids = await arweaveNodeApi.getPending(props.node, signal);
			const next = observeMempool(previous.current, ids, Date.now());
			if (!signal.aborted) {
				previous.current = next;
				void saveNodeMempool(props.node, next, props.network);
			}
			return next;
		},
		[props.node, props.network, props.refreshRevision]
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
			{'error' in resource.state && (
				<S.Error role={'alert'}>
					{language.nodeErrors[resource.state.error]} {resource.data && language.nodeStale}
				</S.Error>
			)}
			<TransactionList
				mode={'recent'}
				header={language.nodePendingTransactions}
				count={resource.data?.ids.length}
				source={{
					loading: props.isResolving || resource.isLoading || details.isLoading,
					loadingMessage: language.nodeMempoolLoading,
					onRefresh: handleRefresh,
					timeLabel: language.nodeFirstObserved,
					pendingIds: visibleIds.filter((id) => !detailsById.get(id)?.transaction && !detailsById.get(id)?.error),
					timestamps: resource.data?.firstSeen,
					edges: visibleIds.map((id) => toNodeTransactionEdge(id, detailsById.get(id)?.transaction ?? undefined)),
					emptyMessage: language.nodeMempoolEmpty,
					pagination: (showCounter) => (
						<NodePagination
							page={currentPage}
							totalPages={totalPages}
							showCounter={showCounter}
							onPageChange={setPage}
						/>
					),
				}}
			/>
			{visibleIds.some((id) => detailsById.get(id)?.error) && (
				<S.Error role={'status'}>{language.nodeTransactionDetailsError}</S.Error>
			)}

			<S.Changes>
				<NodeTransactionChanges
					title={language.nodeAdded}
					ids={resource.data?.added ?? EMPTY_IDS}
					loading={resource.isLoading}
					isBaseline={resource.data?.isBaseline ?? true}
				/>
				<NodeTransactionChanges
					title={language.nodeRemoved}
					ids={resource.data?.removed ?? EMPTY_IDS}
					loading={resource.isLoading}
					isBaseline={resource.data?.isBaseline ?? true}
				/>
			</S.Changes>
			{props.showInfo && props.isActive && (
				<Modal type={'panel'} width={515} header={language.nodeMempoolInfo} onClose={props.onCloseInfo}>
					<S.PanelContent>
						<S.Note>{language.nodeMempoolDescription}</S.Note>
						{resource.data && (
							<>
								{' '}
								<S.Note>
									{language.nodeLastObserved(new Date(resource.data.checkedAt).toLocaleString())} ·{' '}
									{resource.data.isBaseline
										? language.nodeMempoolBaseline
										: language.nodeMempoolChanges(resource.data.added.length, resource.data.removed.length)}
								</S.Note>
							</>
						)}
					</S.PanelContent>
				</Modal>
			)}
		</S.Section>
	);
}
