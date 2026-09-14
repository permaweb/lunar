import React from 'react';

import type { NodeBlock } from 'api/arweaveNode';

import { Overview } from 'components/molecules/Overview';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function NodeMiningCoverage(props: { blocks: NodeBlock[] }): React.ReactElement {
	const provider = useLanguageProvider();
	const language = provider.object[provider.current];
	const first = props.blocks[props.blocks.length - 1];
	const last = props.blocks[0];
	function timestamp(block: NodeBlock | undefined) {
		return block ? new Date(block.timestamp * 1000).toLocaleString(undefined, { timeZoneName: 'short' }) : '—';
	}
	return (
		<S.Wrapper>
			<Overview
				title={language.nodeIndexedRange}
				columns={2}
				fields={[
					{ label: language.nodeIndexedBlocks, value: props.blocks.length.toLocaleString() },
					{
						label: language.nodeBlockRange,
						value: first && last ? `${first.height.toLocaleString()}–${last.height.toLocaleString()}` : '—',
					},
					{ label: language.nodeStartTime, value: timestamp(first) },
					{ label: language.nodeEndTime, value: timestamp(last) },
				]}
			/>
		</S.Wrapper>
	);
}
