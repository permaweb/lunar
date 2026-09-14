import type { ForkComparison, ForkGraph, RecentSnapshot } from './forks';
import { buildForkGraph, matchingForkComparisons, parseRecent } from './forks';
import { record } from './parsers';
import type { ArweaveNodeApi, NodeBlock } from './types';
import { ArweaveNodeError } from './types';

export type NodeForkHistory = { graph: ForkGraph; blocks: NodeBlock[]; forksAvailable: boolean; checkedAt: number };

export async function readForkHistory(
	node: string,
	signal: AbortSignal,
	api: Pick<ArweaveNodeApi, 'getInfo' | 'getAncestors' | 'getBlock'>,
	readRecent: (signal: AbortSignal) => Promise<unknown>,
	onProgress?: (history: NodeForkHistory) => void
): Promise<NodeForkHistory> {
	const controller = new AbortController();
	const cancel = () => controller.abort();
	signal.addEventListener('abort', cancel, { once: true });
	if (signal.aborted) cancel();
	const active = controller.signal;
	let recent: RecentSnapshot;
	const headers = new Map<string, NodeBlock>();
	const parents = new Map<string, string>();
	const comparisons: ForkComparison[] = [];
	function snapshot(): NodeForkHistory {
		return {
			graph: buildForkGraph(recent, parents, matchingForkComparisons(recent, parents, comparisons), 'forks'),
			blocks: [...headers.values()],
			forksAvailable: recent.forksAvailable,
			checkedAt: Date.now(),
		};
	}
	function publish() {
		if (!active.aborted) onProgress?.(snapshot());
	}
	async function optionalHeader(read: () => Promise<void>) {
		try {
			await read();
		} catch (error) {
			if (!(error instanceof ArweaveNodeError) || !['not-found', 'unavailable', 'timeout'].includes(error.code))
				throw error;
			// Missing headers stay unknown; equal heights alone never establish ancestry.
		}
	}
	async function work<T>(items: T[], read: (item: T) => Promise<void>) {
		let next = 0;
		await Promise.all(
			Array.from({ length: Math.min(2, items.length) }, async () => {
				while (next < items.length && !active.aborted) {
					await optionalHeader(() => read(items[next++]));
					publish();
				}
			})
		);
	}
	try {
		if (active.aborted) throw new ArweaveNodeError('cancelled');
		// Render reported forks immediately, independently of /info and block headers.
		const [, info] = await Promise.all([
			readRecent(active).then((value) => {
				recent = parseRecent({ ...record(value), blocks: [] });
				publish();
			}),
			api.getInfo(node, active),
		]);
		recent.blocks = [{ id: info.hash, height: info.height }];
		publish();
		const heights = [...new Set(recent.forks.flatMap((fork) => fork.blocks.map((_, i) => fork.height + i)))].filter(
			(height) => height <= info.height
		);
		await Promise.all([
			work(recent.forks, async (fork) => {
				const root = await api.getBlock(node, fork.blocks[0], active);
				if (root.height !== fork.height || root.hash !== fork.blocks[0]) throw new ArweaveNodeError('invalid-response');
				parents.set(root.hash, root.previous);
				headers.set(root.hash, root);
			}),
			(async () => {
				// Resolve just the fork heights against a verified canonical index. Fetch by
				// immutable hash so a new tip cannot mix branches during progressive reads.
				const anchors = await api.getAncestors(node, info, heights, active);
				const targets = new Set([info.height, ...heights]);
				await work(
					anchors.filter((anchor) => targets.has(anchor.height)),
					async (anchor) => {
						const block = await api.getBlock(node, anchor.hash, active);
						if (block.height !== anchor.height || block.hash !== anchor.hash)
							throw new ArweaveNodeError('invalid-response');
						headers.set(block.hash, block);
						comparisons.push({ id: block.hash, height: block.height, parent: block.previous });
					}
				);
			})(),
		]);
		if (active.aborted) throw new ArweaveNodeError('cancelled');
		// Advancing tips are fine; an actual reorg of our anchor is not.
		await api.getAncestors(node, info, [], active);
		return snapshot();
	} finally {
		signal.removeEventListener('abort', cancel);
		cancel();
	}
}
