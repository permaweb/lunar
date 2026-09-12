import React from 'react';

import { Button } from 'components/atoms/Button';
import { FormField } from 'components/atoms/FormField';
import { Icon } from 'components/atoms/Icon';
import { Modal } from 'components/atoms/Modal';
import { ExplorerLink } from 'components/atoms/TxAddress';
import { AddressList } from 'features/Addresses';
import { ASSETS } from 'helpers/config';
import { formatNodeRewardTotal } from 'helpers/nodeMining';
import { useLanguageProvider } from 'providers/LanguageProvider';

import type { useNodeHistory } from '../../../hooks/useNodeHistory';
import { getIndexedMiners, NODE_HISTORY_LIMIT, NODE_PAGE_SIZE } from '../../../model/node';
import { NodeBalance } from '../../molecules/NodeBalance';
import { NodeBlockList } from '../../molecules/NodeBlockList';
import { NodeMiningCoverage } from '../../molecules/NodeMiningCoverage';
import { NodePagination } from '../../molecules/NodePagination';

import * as S from './styles';

export default function NodeMiners(props: {
	node: string;
	history: ReturnType<typeof useNodeHistory>;
	isActive: boolean;
	isResolving: boolean;
	refreshRevision: number;
	showInfo: boolean;
	onCloseInfo: () => void;
	onRefresh: () => void;
}) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const minerBlocksId = React.useId();
	const [query, setQuery] = React.useState('');
	const [draftQuery, setDraftQuery] = React.useState('');
	const [showFilters, setShowFilters] = React.useState(false);
	const [page, setPage] = React.useState(0);
	const [expandedMiners, setExpandedMiners] = React.useState<Set<string>>(() => new Set());
	const miners = React.useMemo(() => getIndexedMiners(props.history.blocks), [props.history.blocks]);
	const minersByAddress = new Map(miners.map((miner) => [miner.address, miner]));
	const matches = React.useMemo(() => miners.filter((miner) => miner.address.includes(query.trim())), [miners, query]);
	const totalPages = Math.max(1, Math.ceil(matches.length / NODE_PAGE_SIZE));
	const currentPage = Math.min(page, totalPages - 1);
	function handlePageChange(next: number) {
		if (next >= totalPages && (props.history.isLoading || props.isResolving)) return;
		setPage(next);
		if (next > currentPage && props.history.canLoadOlder && !props.history.isLoading && !props.isResolving)
			props.history.loadOlder();
	}
	function handleToggleMiner(address: string) {
		setExpandedMiners((previous) => {
			const next = new Set(previous);
			if (next.has(address)) next.delete(address);
			else next.add(address);
			return next;
		});
	}
	return (
		<S.Section>
			<NodeMiningCoverage blocks={props.history.blocks} />
			{'error' in props.history.state && (
				<S.Actions>
					<S.Error role={'alert'}>
						{language.nodeErrors[props.history.state.error]} {props.history.blocks.length > 0 && language.nodeStale}
					</S.Error>
					<Button
						type={'primary'}
						label={language.nodeRetry}
						onPress={props.onRefresh}
						disabled={props.history.isLoading}
					/>
				</S.Actions>
			)}

			<AddressList
				header={language.nodeIndexedMiners}
				count={matches.length}
				actions={
					<>
						<Button
							type={'alt3'}
							label={language.filter}
							icon={ASSETS.filter}
							iconLeftAlign
							active={!!query || showFilters}
							onPress={() => {
								setDraftQuery(query);
								setShowFilters(true);
							}}
						/>
						<S.Divider />
					</>
				}
				source={{
					renderRowDetails: (address) =>
						expandedMiners.has(address) ? (
							<S.MinerBlocks
								id={`${minerBlocksId}-${address}`}
								role={'region'}
								aria-label={language.nodeViewMinerBlocks(address)}
							>
								<NodeBlockList
									embedded
									blocks={minersByAddress.get(address)?.blocks ?? []}
									isLoading={props.isResolving || props.history.isLoading}
									onRefresh={props.onRefresh}
								/>
							</S.MinerBlocks>
						) : null,
					addresses: matches
						.slice(currentPage * NODE_PAGE_SIZE, (currentPage + 1) * NODE_PAGE_SIZE)
						.map((miner) => miner.address),
					loading: props.isResolving || props.history.isLoading,
					onRefresh: props.onRefresh,
					emptyMessage:
						props.isResolving || props.history.isLoading
							? language.nodeBlocksLoading
							: query
							? language.nodeNoMinersMatch
							: language.nodeMinersEmpty,
					columns: [
						{
							label: language.balance,
							render: (address) => (
								<NodeBalance
									key={address}
									address={address}
									node={props.node}
									isActive={props.isActive}
									balanceRevision={props.refreshRevision}
								/>
							),
						},
						{
							label: language.nodePendingRewards,
							render: (address) => (
								<NodeBalance
									key={address}
									address={address}
									node={props.node}
									kind={'pending-rewards'}
									isActive={props.isActive}
									balanceRevision={props.refreshRevision}
								/>
							),
						},
						{
							label: language.nodeSummedRewards,
							render: (address) => {
								const rewards = minersByAddress.get(address)?.rewards;
								return (
									<p title={language.nodeRewardsDescription}>
										{rewards?.amounts.length
											? rewards.amounts
													.map(({ value, denomination }) => formatNodeRewardTotal(value, denomination))
													.join(' + ')
											: '—'}
										{rewards?.incomplete ? ` (${language.nodeRewardsPartial})` : ''}
									</p>
								);
							},
						},
						{
							label: language.nodeBlocksMined,
							render: (address) => (
								<S.BlockCount
									aria-label={
										expandedMiners.has(address)
											? language.nodeHideMinerBlocks(address)
											: language.nodeViewMinerBlocks(address)
									}
									aria-expanded={expandedMiners.has(address)}
									aria-controls={expandedMiners.has(address) ? `${minerBlocksId}-${address}` : undefined}
									onClick={() => handleToggleMiner(address)}
								>
									{minersByAddress.get(address)?.count.toLocaleString()}
									<Icon src={ASSETS.arrow} size={15} />
								</S.BlockCount>
							),
						},
						{
							label: language.nodeLastBlock,
							render: (address) => {
								const block = minersByAddress.get(address)?.last;
								return block ? (
									<span title={new Date(block.timestamp * 1000).toLocaleString()}>
										<ExplorerLink value={block.hash} label={block.height.toLocaleString()} type={'block'} />
									</span>
								) : (
									'—'
								);
							},
						},
					],
					pagination: (showCounter) => (
						<NodePagination
							page={currentPage}
							totalPages={totalPages}
							showCounter={showCounter}
							hasMore={props.history.canLoadOlder}
							loading={props.history.isLoading || props.isResolving}
							onPageChange={handlePageChange}
						/>
					),
				}}
			/>
			{props.showInfo && props.isActive && (
				<Modal type={'panel'} width={515} header={language.nodeMiningInfo} onClose={props.onCloseInfo}>
					<S.PanelContent>
						{' '}
						<S.Note>{language.nodeMiningDescription}</S.Note>
						<S.Note>{language.nodeRewardsDescription}</S.Note>
						<S.Note>{language.nodePendingRewardsDescription}</S.Note>
						{!!props.history.blocks.length && (
							<S.Note>
								{language.nodeMiningCoverage(
									props.history.blocks.length,
									props.history.blocks[props.history.blocks.length - 1].height.toLocaleString(),
									props.history.blocks[0].height.toLocaleString()
								)}
							</S.Note>
						)}
						{props.history.blocks.length >= NODE_HISTORY_LIMIT && (
							<S.Note>{language.nodeMiningLimit(NODE_HISTORY_LIMIT)}</S.Note>
						)}
					</S.PanelContent>
				</Modal>
			)}
			{showFilters && props.isActive && (
				<Modal type={'panel'} width={515} header={language.nodeMinerFilters} onClose={() => setShowFilters(false)}>
					<S.PanelContent
						as={'form'}
						onSubmit={(event) => {
							event.preventDefault();
							setQuery(draftQuery.trim());
							setPage(0);
							setShowFilters(false);
						}}
					>
						<FormField
							label={language.nodeFindMiner}
							value={draftQuery}
							onChange={(event) => setDraftQuery(event.target.value)}
							invalid={{ status: false, message: null }}
							disabled={false}
							hideErrorMessage
							autoFocus
						/>
						<Button
							type={'primary'}
							label={language.clear}
							disabled={!draftQuery}
							onPress={() => setDraftQuery('')}
							fullWidth
							height={40}
						/>
						<Button type={'alt1'} label={language.applyFilters} formSubmit onPress={() => {}} fullWidth height={42.5} />
					</S.PanelContent>
				</Modal>
			)}
		</S.Section>
	);
}
