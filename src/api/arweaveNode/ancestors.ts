import { blockHash, record } from './parsers';
import type { NodeAnchor } from './types';
import { ArweaveNodeError } from './types';

const INDEX_WINDOW_SIZE = 100;
const MAX_TARGET_HEIGHTS = 4096;

/** Read sparse heights without downloading the entire chain of a lagging node. */
export async function readAncestors(
	anchor: NodeAnchor,
	heights: number[],
	signal: AbortSignal,
	read: (path: string) => Promise<unknown>
): Promise<NodeAnchor[]> {
	if (
		!Number.isSafeInteger(anchor.height) ||
		anchor.height < 0 ||
		heights.length > MAX_TARGET_HEIGHTS ||
		heights.some((height) => !Number.isSafeInteger(height) || height < 0 || height > anchor.height)
	)
		throw new ArweaveNodeError('invalid-input');
	blockHash(anchor.hash);
	const targets = [...new Set([anchor.height, ...heights])].sort((a, b) => b - a);
	const blocks: NodeAnchor[] = [];
	async function range(low: number, high: number): Promise<NodeAnchor[]> {
		if (signal.aborted) throw new ArweaveNodeError('cancelled');
		const value = await read(`/block_index/${low}/${high}`);
		if (signal.aborted) throw new ArweaveNodeError('cancelled');
		if (!Array.isArray(value) || value.length !== high - low + 1) throw new ArweaveNodeError('invalid-response');
		const result = value.map((entry, index) => ({
			height: high - index,
			hash: blockHash(typeof entry === 'string' ? entry : record(entry).hash),
		}));
		if (new Set(result.map((block) => block.hash)).size !== result.length)
			throw new ArweaveNodeError('invalid-response');
		return result;
	}
	let windows = 0;
	for (let index = 0; index < targets.length; ) {
		const high = targets[index++];
		let low = high;
		while (index < targets.length && high - targets[index] < INDEX_WINDOW_SIZE) low = targets[index++];
		const entries = await range(low, high);
		if (windows++ === 0 && entries[0].hash !== anchor.hash) throw new ArweaveNodeError('chain-changed');
		blocks.push(...entries);
	}
	// The range endpoint returns the node's canonical index, newest first. Recheck
	// the anchor after sparse reads so a reorg cannot become a false fork result.
	// https://github.com/ArweaveTeam/arweave/blob/master/apps/arweave/src/ar_http_iface_middleware.erl
	if (windows > 1 && (await range(anchor.height, anchor.height))[0].hash !== anchor.hash)
		throw new ArweaveNodeError('chain-changed');
	return blocks;
}
