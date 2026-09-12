import React from 'react';

import type { NodeInfo } from 'api/arweaveNode';

import { ExternalLink } from 'components/atoms/ExternalLink';
import { ExplorerLink } from 'components/atoms/TxAddress';
import { Overview } from 'components/molecules/Overview';
import { ARWEAVE_COMMIT_URL } from 'helpers/config';
import { useLanguageProvider } from 'providers/LanguageProvider';

import type { useNodeHistory } from '../../../hooks/useNodeHistory';
import type { useNodeResource } from '../../../hooks/useNodeResource';
import { formatNodeBytes } from '../../../model/node';
import { NodeBlockList } from '../../molecules/NodeBlockList';

import * as S from './styles';

export default function NodeOverview(props: {
	info: ReturnType<typeof useNodeResource<NodeInfo>>;
	history: ReturnType<typeof useNodeHistory>;
	onRefresh: () => void;
}) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const info = props.info.data;
	const stats: [string, React.ReactNode][] = info
		? [
				[language.network, info.network],
				[language.height, info.height.toLocaleString()],
				[
					language.nodeReleaseCommit,
					<>
						<p>{`${info.release} /`}</p>
						{info.gitHash ? (
							<ExternalLink
								href={`${ARWEAVE_COMMIT_URL}${encodeURIComponent(info.gitHash)}`}
								label={info.gitHash.slice(0, 7)}
								title={info.gitHash}
							/>
						) : (
							<p>—</p>
						)}
					</>,
				],
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
				language.nodeReleaseCommit,
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
			<NodeBlockList
				blocks={props.history.blocks}
				isLoading={props.info.isLoading || props.history.isLoading}
				canLoadOlder={props.history.canLoadOlder}
				onLoadOlder={props.history.loadOlder}
				onRefresh={props.onRefresh}
			/>
		</S.Section>
	);
}
