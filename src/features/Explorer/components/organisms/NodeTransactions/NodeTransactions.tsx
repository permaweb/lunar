import React from 'react';

import { Modal } from 'components/atoms/Modal';
import { TransactionList } from 'components/molecules/TransactionList';
import { useLanguageProvider } from 'providers/LanguageProvider';

import type { useNodeHistory } from '../../../hooks/useNodeHistory';
import { useNodeTransactionIds } from '../../../hooks/useNodeTransactionIds';
import { useNodeTransactions } from '../../../hooks/useNodeTransactions';
import { getNodeTransactionPage, toNodeTransactionEdge } from '../../../model/node';
import { NodeContinueIndexing } from '../../molecules/NodeContinueIndexing';
import { NodePagination } from '../../molecules/NodePagination';

import * as S from './styles';

export default function NodeTransactions(props: {
	node: string;
	history: ReturnType<typeof useNodeHistory>;
	isActive: boolean;
	isResolving: boolean;
	refreshRevision: number;
	showInfo: boolean;
	onCloseInfo: () => void;
}) {
	const provider = useLanguageProvider();
	const language = provider.object[provider.current];
	const [page, setPage] = React.useState(0);
	const [revision, setRevision] = React.useState(0);
	const pagination = React.useMemo(
		() => getNodeTransactionPage(props.history.blocks, page),
		[props.history.blocks, page]
	);
	const ids = useNodeTransactionIds(props.node, pagination.segments, revision + props.refreshRevision, props.isActive);
	const visibleIds = React.useMemo(() => ids.data?.entries.map(({ id }) => id) ?? [], [ids.data?.entries]);
	const details = useNodeTransactions(props.node, visibleIds, ids.data?.checkedAt, props.isActive, 'confirmed');
	const detailsById = new Map(details.data?.map((entry) => [entry.id, entry]) ?? []);
	const blocksByHash = new Map(pagination.segments.map(({ block }) => [block.hash, block]));
	function handleRefresh() {
		setRevision((value) => value + 1);
		props.history.refresh();
	}
	return (
		<S.Section>
			<TransactionList
				mode={'recent'}
				header={language.nodeConfirmedTransactions}
				count={pagination.count}
				source={{
					loading: props.isResolving || props.history.isLoading || ids.isLoading || details.isLoading,
					loadingMessage: language.nodeTransactionsLoading,
					emptyMessage: language.nodeTransactionsEmpty,
					onRefresh: handleRefresh,
					actions: (
						<NodeContinueIndexing
							disabled={props.history.isLoading || !props.history.canLoadOlder}
							onPress={props.history.loadOlder}
						/>
					),
					edges:
						ids.data?.entries.map(({ id, blockHash }) =>
							toNodeTransactionEdge(id, detailsById.get(id)?.transaction ?? undefined, blocksByHash.get(blockHash))
						) ?? [],
					pendingIds: visibleIds.filter((id) => !detailsById.get(id)?.transaction && !detailsById.get(id)?.error),
					pagination: (showCounter) => (
						<NodePagination
							page={pagination.currentPage}
							totalPages={pagination.totalPages}
							showCounter={showCounter}
							onPageChange={setPage}
						/>
					),
				}}
			/>
			{'error' in props.history.state && (
				<S.Error role={'alert'}>{language.nodeErrors[props.history.state.error]}</S.Error>
			)}
			{'error' in ids.state && <S.Error role={'alert'}>{language.nodeErrors[ids.state.error]}</S.Error>}
			{visibleIds.some((id) => detailsById.get(id)?.error) && (
				<S.Error role={'status'}>{language.nodeTransactionDetailsError}</S.Error>
			)}
			{props.showInfo && props.isActive && (
				<Modal type={'panel'} width={515} header={language.nodeTransactionsInfo} onClose={props.onCloseInfo}>
					<S.PanelContent>
						<S.Note>{language.nodeTransactionsDescription}</S.Note>
						{!!props.history.blocks.length && (
							<S.Note>
								{language.nodeMiningCoverage(
									props.history.blocks.length,
									props.history.blocks[props.history.blocks.length - 1].height.toLocaleString(),
									props.history.blocks[0].height.toLocaleString()
								)}
							</S.Note>
						)}
					</S.PanelContent>
				</Modal>
			)}
		</S.Section>
	);
}
