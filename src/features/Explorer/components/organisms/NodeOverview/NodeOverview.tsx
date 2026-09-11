import React from 'react';

import type { NodeInfo } from 'api/arweaveNode';

import { ExplorerLink } from 'components/atoms/TxAddress';
import { BlockList } from 'components/molecules/BlockList';
import { Overview } from 'components/molecules/Overview';
import { useLanguageProvider } from 'providers/LanguageProvider';

import type { useNodeHistory } from '../../../hooks/useNodeHistory';
import type { useNodeResource } from '../../../hooks/useNodeResource';
import { formatNodeBytes, NODE_PAGE_SIZE } from '../../../model/node';
import { NodePagination } from '../../molecules/NodePagination';

import * as S from './styles';

export default function NodeOverview(props: {
	info: ReturnType<typeof useNodeResource<NodeInfo>>;
	history: ReturnType<typeof useNodeHistory>;
}) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const info = props.info.data;
	const stats: [string, React.ReactNode][] = info
		? [
				[language.network, info.network],
				[language.height, info.height.toLocaleString()],
				[language.nodeVersion, `${info.version} / ${info.release}`],
				[language.nodePeers, info.peers.toLocaleString()],
				[language.nodeQueue, info.queueLength?.toLocaleString() ?? '—'],
				[language.nodeStateLatency, info.latency === null ? '—' : `${info.latency.toLocaleString()} ms`],
				[language.nodeStoredBlocks, info.blocks?.toLocaleString() ?? '—'],
				[
					language.nodeCurrentBlock,
					<ExplorerLink value={info.hash} label={`${info.hash.slice(0, 8)}…${info.hash.slice(-8)}`} type={'block'} />,
				],
				[language.nodeWeaveSize, formatNodeBytes(props.history.blocks[0]?.weaveSize ?? null)],
		  ]
		: [
				language.network,
				language.height,
				language.nodeVersion,
				language.nodePeers,
				language.nodeQueue,
				language.nodeStateLatency,
				language.nodeStoredBlocks,
				language.nodeCurrentBlock,
				language.nodeWeaveSize,
		  ].map((label) => [label, props.info.isLoading ? `${language.loading}...` : '—']);
	return (
		<S.Section>
			<Overview title={language.overview} fields={stats.map(([label, value]) => ({ label, value }))} />
			{'error' in props.history.state && (
				<S.Error role={'alert'}>{language.nodeErrors[props.history.state.error]}</S.Error>
			)}
			<BlockList
				header={language.nodeRecentBlocks}
				source={{
					loading: (!info && props.info.isLoading) || props.history.isLoading,
					loadingMessage: !info ? language.nodeLoading : language.nodeBlocksLoading,
					onRefresh: props.history.refresh,
					pagination: (showCounter) => (
						<NodePagination page={0} totalPages={1} showCounter={showCounter} onPageChange={() => {}} />
					),
					edges: props.history.blocks.slice(0, NODE_PAGE_SIZE).map((block) => ({
						cursor: block.hash,
						node: {
							id: block.hash,
							height: block.height,
							timestamp: block.timestamp,
							previous: block.previous,
							transactionCount: block.transactions,
							metadata: {
								indep_hash: block.hash,
								previous_block: block.previous,
								timestamp: block.timestamp,
								reward_addr: block.miner,
								block_size: block.dataSize,
								reward: block.reward,
							},
						},
					})),
				}}
			/>
		</S.Section>
	);
}
