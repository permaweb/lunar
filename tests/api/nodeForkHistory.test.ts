import { expect, it, vi } from 'vitest';

import { readForkHistory } from '../../src/api/arweaveNode/forkHistory';
import { buildForkGraph, parseRecent } from '../../src/api/arweaveNode/forks';
import { ArweaveNodeError } from '../../src/api/arweaveNode/types';
import { hash, NODE_INFO, NODE_URL, nodeBlock } from '../fixtures/arweaveNode';

const orphan = 'z'.repeat(64);
const raw = { blocks: [], forks: [{ id: 'f'.repeat(43), height: 98, timestamp: 1700000000, blocks: [orphan] }] };
it('validates native fork ordering and never connects unknown parents by height alone', () => {
	const snapshot = parseRecent(raw);
	snapshot.blocks = [
		{ id: hash(100), height: 100 },
		{ id: hash(99), height: 99 },
		{ id: hash(98), height: 98 },
	];
	const graph = buildForkGraph(snapshot, new Map(), [], 'forks');
	expect(graph.edges).toContainEqual({ parent: `unknown:${orphan}`, child: orphan });
	expect(graph.nodes.find((node) => node.id === orphan).state).toBe('orphan');
	expect(graph.nodes.some((node) => node.id === hash(100))).toBe(true);
	for (const forks of [
		[{ ...raw.forks[0], height: 0 }],
		[{ ...raw.forks[0], blocks: [orphan, orphan] }],
		Array(101).fill(raw.forks[0]),
	])
		expect(() => parseRecent({ blocks: [], forks })).toThrow();
});
function makeApi() {
	return {
		getInfo: vi.fn().mockResolvedValue(NODE_INFO),
		getAncestors: vi.fn(async (_node, anchor, heights) => [
			anchor,
			...heights.map((height: number) => ({ height, hash: hash(height) })),
		]),
		getBlock: vi.fn(async (_node, id) =>
			id === orphan ? { ...nodeBlock(98), hash: orphan } : nodeBlock(Number(id.replace(/^a+/, '')))
		),
	};
}
it('reads only fork-height headers and retains verified canonical branches and the tip', async () => {
	const api = makeApi();
	const progress = vi.fn();
	const result = await readForkHistory(NODE_URL, new AbortController().signal, api, async () => raw, progress);
	expect(result.graph.edges).toContainEqual({ parent: hash(97), child: orphan });
	expect(result.graph.edges).toContainEqual({ parent: hash(97), child: hash(98) });
	expect(result.graph.nodes.find((node) => node.id === hash(100)).state).toBe('chain');
	expect(result.graph.nodes.find((node) => node.id === hash(98)).state).toBe('history');
	expect(api.getInfo).toHaveBeenCalledTimes(1);
	expect(api.getAncestors).toHaveBeenCalledWith(NODE_URL, NODE_INFO, [98], expect.any(AbortSignal));
	expect(api.getBlock).toHaveBeenCalledTimes(3);
	expect(progress.mock.calls.some(([data]) => data.graph.edges.some((edge) => edge.child === hash(98)))).toBe(true);
});
it('renders reported forks before /info or any headers finish', async () => {
	const api = makeApi();
	let finishInfo: (info: typeof NODE_INFO) => void;
	api.getInfo.mockImplementation(
		() =>
			new Promise((resolve) => {
				finishInfo = resolve;
			})
	);
	const progress = vi.fn();
	const result = readForkHistory(NODE_URL, new AbortController().signal, api, async () => raw, progress);
	await vi.waitFor(() => expect(progress).toHaveBeenCalled());
	expect(progress.mock.calls[0][0].graph.nodes.some((node) => node.id === orphan)).toBe(true);
	expect(api.getBlock).not.toHaveBeenCalled();
	finishInfo(NODE_INFO);
	await result;
});
it('rejects reorgs during graph reads and keeps missing roots explicitly unknown', async () => {
	const api = makeApi();
	api.getBlock.mockRejectedValue(new ArweaveNodeError('not-found', 404));
	const result = await readForkHistory(NODE_URL, new AbortController().signal, api, async () => raw);
	expect(result.graph.nodes.some((node) => node.state === 'unknown')).toBe(true);
	api.getAncestors.mockRejectedValueOnce(new ArweaveNodeError('chain-changed'));
	await expect(readForkHistory(NODE_URL, new AbortController().signal, api, async () => raw)).rejects.toMatchObject({
		code: 'chain-changed',
	});
});
it('cancels sibling work and stops publishing after a failed verification', async () => {
	const api = makeApi();
	api.getAncestors.mockRejectedValueOnce(new ArweaveNodeError('chain-changed'));
	let finishHeader: (block: ReturnType<typeof nodeBlock>) => void;
	api.getBlock.mockImplementation(
		() =>
			new Promise((resolve) => {
				finishHeader = resolve;
			})
	);
	const progress = vi.fn();
	await expect(
		readForkHistory(NODE_URL, new AbortController().signal, api, async () => raw, progress)
	).rejects.toMatchObject({ code: 'chain-changed' });
	expect(api.getBlock.mock.calls[0][2].aborted).toBe(true);
	const count = progress.mock.calls.length;
	finishHeader({ ...nodeBlock(98), hash: orphan });
	await Promise.resolve();
	expect(progress).toHaveBeenCalledTimes(count);
});
