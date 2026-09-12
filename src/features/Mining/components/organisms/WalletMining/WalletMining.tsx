import React from 'react';

import { Button } from 'components/atoms/Button';
import { Select } from 'components/atoms/Select';
import { ExplorerLink } from 'components/atoms/TxAddress';
import { BlockList } from 'components/molecules/BlockList';
import { Overview } from 'components/molecules/Overview';
import { formatNodeAmount, formatNodeRewardTotal, sumMiningRewards, toNodeBlockEdge } from 'helpers/nodeMining';
import { useLanguageProvider } from 'providers/LanguageProvider';

import type { WalletMiningState } from '../../../hooks/useWalletMining';

import * as S from './styles';

export default function WalletMining(props: { address: string; mining: WalletMiningState }) {
	const provider = useLanguageProvider();
	const language = provider.object[provider.current];
	const mining = props.mining;
	const [page, setPage] = React.useState(0);
	React.useEffect(() => setPage(0), [mining.selected, props.address]);
	if (!mining.isMiner) return null;
	const blocks = mining.history?.blocks.filter((block) => block.miner === props.address) ?? [];
	const total = sumMiningRewards(blocks);
	const pages = Math.max(1, Math.ceil(blocks.length / 25));
	const currentPage = Math.min(page, pages - 1);
	const first = mining.history?.blocks[mining.history.blocks.length - 1];
	const last = mining.history?.blocks[0];
	return (
		<S.Section aria-label={language.walletMining}>
			<Overview
				title={language.walletMining}
				action={
					mining.options.length > 1 && (
						<S.Source>
							<span>{language.walletMiningSource}</span>
							<Select
								variant={'plain'}
								options={mining.options}
								activeOption={mining.options.find((option) => option.id === mining.selected)}
								setActiveOption={(option) => mining.onSelect(option.id)}
								disabled={false}
							/>
						</S.Source>
					)
				}
				fields={[
					{
						label: language.walletMiningNode,
						value: <ExplorerLink type={'arweave-node'} value={mining.node} label={mining.node} />,
					},
					{
						label: language.nodePendingRewards,
						value:
							mining.rewards.status === 'loading'
								? `${language.loading}...`
								: mining.rewards.status === 'error'
								? '—'
								: formatNodeAmount(mining.rewards.value),
					},
					{
						label: language.walletMiningIndexedRewards,
						value: !blocks.length
							? '—'
							: total.amounts.map(({ value, denomination }) => formatNodeRewardTotal(value, denomination)).join(' + ') +
							  (total.incomplete ? ` (${language.nodeRewardsPartial})` : ''),
					},
					{ label: language.walletMiningIndexedBlocks, value: blocks.length.toLocaleString() },
					{
						label: language.nodeLastBlock,
						value: blocks[0] ? (
							<ExplorerLink type={'block'} value={blocks[0].hash} label={blocks[0].height.toLocaleString()} />
						) : (
							'—'
						),
					},
					// The indexed range describes the same reporting node, so it shares the grid.
					...(mining.history
						? [
								{ label: language.nodeIndexedBlocks, value: mining.history.blocks.length.toLocaleString() },
								{
									label: language.nodeBlockRange,
									value: `${first.height.toLocaleString()}–${last.height.toLocaleString()}`,
								},
								{ label: language.nodeStartTime, value: new Date(first.timestamp * 1000).toLocaleString() },
								{ label: language.nodeEndTime, value: new Date(last.timestamp * 1000).toLocaleString() },
						  ]
						: []),
				]}
			/>
			{mining.rewards.status === 'error' && <S.Note role={'status'}>{language.walletMiningLookupError}</S.Note>}
			{blocks.length ? (
				<BlockList
					header={language.walletMiningIndexedBlocks}
					source={{
						edges: blocks.slice(currentPage * 25, (currentPage + 1) * 25).map(toNodeBlockEdge),
						loading: false,
						onRefresh: mining.refresh,
						pagination: (showCount) => (
							<>
								<Button
									type={'alt3'}
									label={language.previous}
									disabled={currentPage === 0}
									onPress={() => setPage(currentPage - 1)}
								/>
								{showCount && <S.PageCount>{language.nodesPage(currentPage + 1, pages)}</S.PageCount>}
								<Button
									type={'alt3'}
									label={language.next}
									disabled={currentPage >= pages - 1}
									onPress={() => setPage(currentPage + 1)}
								/>
							</>
						),
					}}
				/>
			) : (
				<S.Note>
					{language.walletMiningNone}{' '}
					<Button
						type={'alt3'}
						label={language.refresh}
						disabled={mining.rewards.status === 'loading'}
						onPress={mining.refresh}
					/>
				</S.Note>
			)}
		</S.Section>
	);
}
