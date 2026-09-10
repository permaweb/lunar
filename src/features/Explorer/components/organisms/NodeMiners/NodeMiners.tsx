import React from 'react';

import { Button } from 'components/atoms/Button';
import { FormField } from 'components/atoms/FormField';
import { ExplorerLink } from 'components/atoms/TxAddress';
import { AddressList } from 'features/Addresses';
import { useLanguageProvider } from 'providers/LanguageProvider';

import type { useNodeHistory } from '../../../hooks/useNodeHistory';
import { getIndexedMiners, NODE_HISTORY_BATCH, NODE_HISTORY_LIMIT, NODE_PAGE_SIZE } from '../../../model/node';
import { NodeBalance } from '../../molecules/NodeBalance';

import * as S from './styles';

export default function NodeMiners(props: {
	node: string;
	history: ReturnType<typeof useNodeHistory>;
	isActive: boolean;
	refreshRevision: number;
}) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const [query, setQuery] = React.useState('');
	const [page, setPage] = React.useState(0);
	const [balanceRevision, setBalanceRevision] = React.useState(0);
	const miners = React.useMemo(() => getIndexedMiners(props.history.blocks), [props.history.blocks]);
	const matches = React.useMemo(() => miners.filter((miner) => miner.address.includes(query.trim())), [miners, query]);
	const totalPages = Math.max(1, Math.ceil(matches.length / NODE_PAGE_SIZE));
	const currentPage = Math.min(page, totalPages - 1);
	return (
		<S.Section>
			<S.Actions>
				<S.ButtonGroup>
					<Button
						type={'primary'}
						label={language.nodeIndexOlder(NODE_HISTORY_BATCH)}
						disabled={!props.history.canLoadOlder || props.history.isLoading}
						onPress={props.history.loadOlder}
					/>
				</S.ButtonGroup>
			</S.Actions>
			<S.Note>{language.nodeMiningDescription}</S.Note>
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
			{'error' in props.history.state && (
				<S.Actions>
					<S.Error role={'alert'}>
						{language.nodeErrors[props.history.state.error]} {props.history.blocks.length > 0 && language.nodeStale}
					</S.Error>
					<Button
						type={'primary'}
						label={language.nodeRetry}
						onPress={props.history.refresh}
						disabled={props.history.isLoading}
					/>
				</S.Actions>
			)}
			{props.history.isLoading && <S.Note role={'status'}>{language.nodeBlocksLoading}</S.Note>}
			<FormField
				label={language.nodeFindMiner}
				value={query}
				onChange={(event) => {
					setQuery(event.target.value);
					setPage(0);
				}}
				invalid={{ status: false, message: null }}
				disabled={false}
			/>
			<AddressList
				header={`${language.nodeIndexedMiners} (${miners.length.toLocaleString()})`}
				source={{
					addresses: matches
						.slice(currentPage * NODE_PAGE_SIZE, (currentPage + 1) * NODE_PAGE_SIZE)
						.map((miner) => miner.address),
					loading: props.history.isLoading,
					onRefresh: () => setBalanceRevision((value) => value + 1),
					emptyMessage: props.history.isLoading
						? language.loading
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
									balanceRevision={balanceRevision + props.refreshRevision}
								/>
							),
						},
						{
							label: language.nodeBlocksMined,
							render: (address) => <p>{miners.find((miner) => miner.address === address)?.count.toLocaleString()}</p>,
						},
						{
							label: language.nodeLastBlock,
							render: (address) => {
								const block = miners.find((miner) => miner.address === address)?.last;
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
		</S.Section>
	);
}
