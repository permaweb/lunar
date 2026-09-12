import React from 'react';

import type { NodeBlock, NodeInfo } from 'api/arweaveNode';
import { arweaveNodeApi, readNodeHistory, saveNodeHistory } from 'api/arweaveNode';

import type { ResourceState } from '../model/node';
import { mergeNodeHistory, NODE_HISTORY_LIMIT, NODE_PAGE_SIZE, nodeError } from '../model/node';

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
} {
	const saved = React.useRef<NodeBlock[]>([]);
	const [state, setState] = React.useState<ResourceState<NodeBlock[]>>({ status: 'idle' });
	const [request, setRequest] = React.useState({ mode: 'recent' as 'recent' | 'older', revision: 0 });
	const previousTip = React.useRef<string | null>(null);
	const previousInfo = React.useRef<NodeInfo | null>(null);
	const previousNode = React.useRef(node);
	const previousNetwork = React.useRef<string | null>(null);
	const completedRequest = React.useRef(-1);
	React.useEffect(() => {
		if (!isActive || !info) return;
		if (previousNode.current !== node || previousNetwork.current !== info.network) {
			saved.current = [];
			setState({ status: 'loading' });
			previousTip.current = null;
			previousInfo.current = null;
			previousNode.current = node;
			previousNetwork.current = info.network;
		}
		if (previousInfo.current === info && completedRequest.current === request.revision) return;
		const controller = new AbortController();
		let saveTimer: ReturnType<typeof setTimeout> | null = null;
		const scheduleSave = () => {
			if (saveTimer) return;
			saveTimer = setTimeout(() => {
				saveTimer = null;
				if (!controller.signal.aborted && saved.current.length) void saveNodeHistory(node, info.network, saved.current);
			}, 500);
		};
		void (async () => {
			try {
				if (!saved.current.length) {
					const cached = await readNodeHistory(node, info.network);
					if (controller.signal.aborted) return;
					if (cached) saved.current = cached;
				}
				setState(saved.current.length ? { status: 'refreshing', data: saved.current } : { status: 'loading' });
				const baseline = saved.current;
				const isNewTip = (previousTip.current ?? baseline[0]?.hash) !== info.hash;
				const oldest = baseline[baseline.length - 1];
				const isOlder =
					!isNewTip && request.mode === 'older' && completedRequest.current !== request.revision && oldest?.height > 0;
				let anchor = isOlder
					? { height: oldest.height - 1, hash: oldest.previous }
					: { height: info.height, hash: info.hash };
				// Bridge a refresh gap before replacing cached history. Every batch is parent-validated.
				const needed = isOlder
					? Math.min(NODE_PAGE_SIZE, NODE_HISTORY_LIMIT - baseline.length)
					: Math.min(
							NODE_HISTORY_LIMIT,
							Math.max(NODE_PAGE_SIZE, info.height - (baseline[0]?.height ?? info.height) + 1)
					  );
				let recent: NodeBlock[] = [];
				const publish = (progress: NodeBlock[], final = false) => {
					if (controller.signal.aborted) return;
					const combined = [...recent, ...progress];
					// Keep the previous complete range until the new branch reaches it.
					if (!isOlder && baseline.length && combined[combined.length - 1]?.height > baseline[0].height && !final)
						return;
					saved.current = isOlder ? [...baseline, ...combined] : mergeNodeHistory(baseline, combined);
					setState({ status: 'refreshing', data: saved.current });
					scheduleSave();
				};
				while (recent.length < needed && anchor.height >= 0) {
					const batchSize = Math.min(100, needed - recent.length);
					const batch = await arweaveNodeApi.getBlocks(node, anchor, batchSize, controller.signal, (blocks) =>
						publish(blocks)
					);
					if (controller.signal.aborted) return;
					if (!batch.length) break;
					publish(batch, recent.length + batch.length >= needed || batch[batch.length - 1].height === 0);
					recent = [...recent, ...batch];
					const last = batch[batch.length - 1];
					anchor = { height: last.height - 1, hash: last.previous };
					if (batch.length < Math.min(batchSize, batch[0].height + 1)) break;
				}
				previousTip.current = info.hash;
				previousInfo.current = info;
				completedRequest.current = request.revision;
				setState({ status: 'success', data: saved.current });
				await saveNodeHistory(node, info.network, saved.current);
			} catch (error) {
				if (!controller.signal.aborted) {
					setState(
						saved.current.length
							? { status: 'stale', data: saved.current, error: nodeError(error) }
							: { status: 'error', error: nodeError(error) }
					);
					if (saved.current.length) void saveNodeHistory(node, info.network, saved.current);
				}
			}
		})();
		return () => {
			controller.abort();
			if (saveTimer) clearTimeout(saveTimer);
			if (saved.current.length) void saveNodeHistory(node, info.network, saved.current);
		};
	}, [node, info, isActive, request]);
	const blocks = 'data' in state ? state.data : [];
	return {
		state,
		blocks,
		isLoading: state.status === 'loading' || state.status === 'refreshing',
		canLoadOlder: blocks.length > 0 && blocks.length < NODE_HISTORY_LIMIT && blocks[blocks.length - 1].height > 0,
		loadOlder: () => setRequest((value) => ({ mode: 'older', revision: value.revision + 1 })),
	};
}
