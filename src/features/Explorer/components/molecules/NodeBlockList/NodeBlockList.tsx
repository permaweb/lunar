import React from 'react';

import type { NodeBlock } from 'api/arweaveNode';

import { BlockList } from 'components/molecules/BlockList';
import { toNodeBlockEdge } from 'helpers/nodeMining';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { NODE_PAGE_SIZE } from '../../../model/node';
import { NodePagination } from '../NodePagination';

import * as S from './styles';

export default function NodeBlockList(props: {
	blocks: NodeBlock[];
	header?: string;
	embedded?: boolean;
	isLoading: boolean;
	canLoadOlder?: boolean;
	onLoadOlder?: () => void;
	onRefresh: () => void;
}) {
	const provider = useLanguageProvider();
	const language = provider.object[provider.current];
	// Keep an older page at its chosen height when a new tip arrives.
	const [topHeight, setTopHeight] = React.useState<number | null>(null);
	const index = topHeight === null ? 0 : props.blocks.findIndex((block) => block.height <= topHeight);
	const offset = index < 0 ? Math.max(0, props.blocks.length - NODE_PAGE_SIZE) : index;
	const page = Math.floor(offset / NODE_PAGE_SIZE);
	const rows = props.embedded ? props.blocks : props.blocks.slice(offset, offset + NODE_PAGE_SIZE);
	function handlePageChange(next: number) {
		if (next > page && offset + NODE_PAGE_SIZE >= props.blocks.length && props.isLoading) return;
		if (next < page) {
			const previous = Math.max(0, offset - NODE_PAGE_SIZE);
			setTopHeight(next > 0 && previous ? props.blocks[previous].height : null);
		} else if (rows.length) {
			setTopHeight(rows[rows.length - 1].height - 1);
			if (props.canLoadOlder && !props.isLoading) props.onLoadOlder?.();
		}
	}
	return (
		<S.Wrapper>
			<BlockList
				embedded={props.embedded}
				header={props.header ?? (topHeight === null ? language.nodeRecentBlocks : language.nodeBlockHistory)}
				source={{
					loading: props.isLoading,
					loadingMessage: language.nodeBlocksLoading,
					onRefresh: () => {
						setTopHeight(null);
						props.onRefresh();
					},
					edges: rows.map(toNodeBlockEdge),
					pagination: props.embedded
						? undefined
						: (showCounter) => (
								<NodePagination
									page={page}
									totalPages={Math.max(1, Math.ceil(props.blocks.length / NODE_PAGE_SIZE))}
									showCounter={showCounter}
									hasMore={props.canLoadOlder}
									loading={props.isLoading}
									onPageChange={handlePageChange}
								/>
						  ),
				}}
			/>
		</S.Wrapper>
	);
}
