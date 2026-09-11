import React from 'react';

import type { NodeBlock, NodeInfo } from 'api/arweaveNode';
import { arweaveNodeApi } from 'api/arweaveNode';

import type { ResourceState } from '../model/node';
import { mergeNodeHistory, NODE_HISTORY_BATCH, NODE_HISTORY_LIMIT, NODE_PAGE_SIZE, nodeError } from '../model/node';

export function useNodeHistory(
	node: string,
	info: NodeInfo | null,
	isActive: boolean
): {
	state: ResourceState<NodeBlock[]>;
	blocks: NodeBlock[];
	isLoading: boolean;
	canLoadOlder: boolean;
	loadOlder: () => void;
	refresh: () => void;
} {
	const saved = React.useRef<NodeBlock[]>([]);
	const [state, setState] = React.useState<ResourceState<NodeBlock[]>>({ status: 'idle' });
	const [request, setRequest] = React.useState({ mode: 'recent' as 'recent' | 'older', revision: 0 });
	const previousTip = React.useRef<string | null>(null);
	const previousNetwork = React.useRef<string | null>(null);
	const completedRequest = React.useRef(-1);
	React.useEffect(() => {
		if (!isActive || !info) return;
		if (previousNetwork.current !== info.network) {
			saved.current = [];
			previousTip.current = null;
			previousNetwork.current = info.network;
		}
		if (previousTip.current === info.hash && completedRequest.current === request.revision) return;
		const controller = new AbortController();
		const isNewTip = previousTip.current !== info.hash;
		const oldest = saved.current[saved.current.length - 1];
		const isOlder = !isNewTip && request.mode === 'older' && oldest?.height > 0;
		const anchor = isOlder
			? { height: oldest.height - 1, hash: oldest.previous }
			: { height: info.height, hash: info.hash };
		const count = isOlder ? Math.min(NODE_HISTORY_BATCH, NODE_HISTORY_LIMIT - saved.current.length) : NODE_PAGE_SIZE;
		if (count <= 0) return;
		setState(saved.current.length ? { status: 'refreshing', data: saved.current } : { status: 'loading' });
		const baseline = saved.current;
		function handleProgress(blocks: NodeBlock[]) {
			if (controller.signal.aborted) return;
			saved.current = isOlder ? [...baseline, ...blocks] : mergeNodeHistory(baseline, blocks);
			setState({ status: 'refreshing', data: saved.current });
		}
		void (async () => {
			try {
				const blocks = await arweaveNodeApi.getBlocks(node, anchor, count, controller.signal, handleProgress);
				if (controller.signal.aborted) return;
				saved.current = isOlder ? [...baseline, ...blocks] : mergeNodeHistory(baseline, blocks);
				previousTip.current = info.hash;
				completedRequest.current = request.revision;
				setState({ status: 'success', data: saved.current });
			} catch (error) {
				if (!controller.signal.aborted)
					setState(
						saved.current.length
							? { status: 'stale', data: saved.current, error: nodeError(error) }
							: { status: 'error', error: nodeError(error) }
					);
			}
		})();
		return () => controller.abort();
	}, [node, info?.hash, info?.height, info?.network, isActive, request]);
	const blocks = 'data' in state ? state.data : [];
	return {
		state,
		blocks,
		isLoading: state.status === 'loading' || state.status === 'refreshing',
		canLoadOlder: blocks.length > 0 && blocks.length < NODE_HISTORY_LIMIT && blocks[blocks.length - 1].height > 0,
		loadOlder: () => setRequest((value) => ({ mode: 'older', revision: value.revision + 1 })),
		refresh: () => setRequest((value) => ({ mode: 'recent', revision: value.revision + 1 })),
	};
}
