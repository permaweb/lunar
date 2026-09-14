// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { arweaveNodeApi, readNodeHistory, saveNodeHistory } from '../../../src/api/arweaveNode';
import { useNodeHistory } from '../../../src/features/Explorer/hooks/useNodeHistory';
import { hash, NODE_INFO, NODE_URL, nodeBlock } from '../../fixtures/arweaveNode';

vi.mock('api/arweaveNode', async () => ({
	...(await vi.importActual('../../../src/api/arweaveNode')),
	arweaveNodeApi: { getBlocks: vi.fn() },
}));
let root: ReturnType<typeof createRoot>;
let state: ReturnType<typeof useNodeHistory>;
let container: HTMLElement;
function Harness(props: { node?: string; height?: number; network?: string }) {
	const info = React.useMemo(
		() => ({
			...NODE_INFO,
			network: props.network ?? NODE_INFO.network,
			height: props.height ?? 100,
			hash: hash(props.height ?? 100),
		}),
		[props.height, props.network]
	);
	state = useNodeHistory(props.node ?? NODE_URL, info, true);
	return <span>{state.blocks.length}</span>;
}
async function settle(until: () => boolean) {
	for (let i = 0; i < 100 && !until(); i++)
		await React.act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 5));
		});
	expect(until()).toBe(true);
}
beforeEach(() => {
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.stubGlobal('indexedDB', new IDBFactory());
	vi.resetAllMocks();
	container = document.createElement('div');
	document.body.append(container);
	root = createRoot(container);
	vi.mocked(arweaveNodeApi.getBlocks).mockImplementation(async (_node, anchor, count) =>
		Array.from({ length: Math.min(count, anchor.height + 1) }, (_, i) => nodeBlock(anchor.height - i))
	);
});
afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});
it('restores an indexed range before the network finishes, then bridges more than a page of new blocks', async () => {
	await saveNodeHistory(
		NODE_URL,
		NODE_INFO.network,
		Array.from({ length: 50 }, (_, i) => nodeBlock(100 - i))
	);
	let finish: (value: ReturnType<typeof nodeBlock>[]) => void;
	vi.mocked(arweaveNodeApi.getBlocks).mockReturnValueOnce(
		new Promise((resolve) => {
			finish = resolve;
		})
	);
	await React.act(async () => root.render(<Harness height={140} />));
	await settle(() => state.blocks.length === 50);
	expect(state.state.status).toBe('refreshing');
	expect(arweaveNodeApi.getBlocks).toHaveBeenCalledWith(
		NODE_URL,
		{ hash: hash(140), height: 140 },
		41,
		expect.any(AbortSignal),
		expect.any(Function)
	);
	await React.act(async () => finish(Array.from({ length: 41 }, (_, i) => nodeBlock(140 - i))));
	await settle(() => state.state.status === 'success');
	expect(state.blocks).toHaveLength(90);
	expect(state.blocks.at(-1).height).toBe(51);
	await settle(() => !state.isLoading);
});
it('keeps the saved range on a failed bridge and restores it after remounting', async () => {
	const cached = [nodeBlock(100), nodeBlock(99)];
	await saveNodeHistory(NODE_URL, NODE_INFO.network, cached);
	vi.mocked(arweaveNodeApi.getBlocks).mockRejectedValue(new Error('Offline'));
	await React.act(async () => root.render(<Harness height={150} />));
	await settle(() => state.state.status === 'stale');
	expect(state.blocks).toEqual(cached);
	await React.act(async () => root.unmount());
	root = createRoot(container);
	await React.act(async () => root.render(<Harness height={150} />));
	await settle(() => state.state.status === 'stale');
	expect(state.blocks).toEqual(cached);
});
it('does not reuse another node or network and persists older pages for a new reader', async () => {
	await saveNodeHistory('http://other.node', NODE_INFO.network, [nodeBlock(500)]);
	await saveNodeHistory(NODE_URL, 'other-network', [nodeBlock(400)]);
	await React.act(async () => root.render(<Harness />));
	await settle(() => state.state.status === 'success');
	expect(state.blocks).toHaveLength(25);
	await React.act(async () => state.loadOlder());
	await settle(() => state.blocks.length === 50 && !state.isLoading);
	await React.act(async () => root.unmount());
	root = createRoot(container);
	expect(await readNodeHistory(NODE_URL, NODE_INFO.network)).toHaveLength(50);
	await React.act(async () => root.render(<Harness />));
	await settle(() => state.blocks.length === 50 && !state.isLoading);
});
it('discards cached descendants after a verified reorg instead of mixing branches', async () => {
	await saveNodeHistory(
		NODE_URL,
		NODE_INFO.network,
		Array.from({ length: 50 }, (_, i) => ({
			...nodeBlock(100 - i),
			hash: String(100 - i).padStart(64, 'z'),
			previous: String(99 - i).padStart(64, 'z'),
		}))
	);
	await React.act(async () => root.render(<Harness />));
	await settle(() => state.state.status === 'success');
	expect(state.blocks).toHaveLength(25);
	expect(state.blocks.every((block) => block.hash.startsWith('a'))).toBe(true);
});
