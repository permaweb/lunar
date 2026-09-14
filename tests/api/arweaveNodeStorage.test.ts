import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { createArweaveNodeApi } from '../../src/api/arweaveNode/relayAdapter';
import {
	getCachedNodeHistories,
	parseCachedBlocks,
	readNodeCache,
	readNodeHistory,
	readNodeInfo,
	readNodeMempool,
	saveNodeHistory,
	saveNodeMempool,
	writeNodeCache,
} from '../../src/api/arweaveNode/storage';
import { hash, NODE_INFO, NODE_URL, nodeBlock, rawBlock } from '../fixtures/arweaveNode';

beforeEach(() => vi.stubGlobal('indexedDB', new IDBFactory()));
afterEach(() => vi.unstubAllGlobals());
it('persists exact block data and isolates nodes and networks across readers', async () => {
	const blocks = [nodeBlock(100), nodeBlock(99)];
	await saveNodeHistory(NODE_URL, 'arweave.N.1', blocks);
	await saveNodeHistory(NODE_URL, 'testnet', [nodeBlock(20)]);
	expect(await readNodeHistory(NODE_URL, 'arweave.N.1')).toEqual(blocks);
	expect(await readNodeHistory(NODE_URL + '/', 'testnet')).toEqual([nodeBlock(20)]);
	expect(await readNodeHistory('http://other.node', 'arweave.N.1')).toBeNull();
	expect(await getCachedNodeHistories()).toHaveLength(2);
});
it('rejects corrupted, disconnected, duplicate or oversized persisted ranges', async () => {
	for (const invalid of [
		[nodeBlock(100), nodeBlock(98)],
		[nodeBlock(1), nodeBlock(1)],
		[{ ...nodeBlock(1), reward: 'NaN' }],
		[{ ...nodeBlock(1), miner: 'bad' }],
		Array(5001).fill(nodeBlock(1)),
	]) {
		expect(parseCachedBlocks(invalid)).toBeNull();
		await writeNodeCache('history', NODE_URL, invalid, 'mainnet');
		expect(await readNodeHistory(NODE_URL, 'mainnet')).toBeNull();
	}
});
it('restores validated info and mempool observation times without losing integer precision', async () => {
	await writeNodeCache('info', NODE_URL, NODE_INFO);
	expect(await readNodeInfo(NODE_URL)).toEqual(NODE_INFO);
	const id = 'b'.repeat(43);
	const pending = {
		ids: [id],
		added: [],
		removed: [],
		checkedAt: Date.now(),
		firstSeen: { [id]: 1234 },
		isBaseline: true,
	};
	await saveNodeMempool(NODE_URL, pending);
	expect(await readNodeMempool(NODE_URL)).toEqual(pending);
	await writeNodeCache('pending', NODE_URL, { ...pending, firstSeen: { [id]: -1 } });
	expect(await readNodeMempool(NODE_URL)).toBeNull();
});
it('bounds saved node ranges and survives unavailable storage', async () => {
	for (let i = 0; i < 34; i++) await saveNodeHistory(`http://node-${i}.example`, 'mainnet', [nodeBlock(i)]);
	expect(await getCachedNodeHistories()).toHaveLength(32);
	vi.stubGlobal('indexedDB', {
		open: () => {
			throw new Error('Storage disabled');
		},
	});
	await expect(saveNodeHistory(NODE_URL, 'mainnet', [nodeBlock(1)])).resolves.toBeUndefined();
	expect(await readNodeHistory(NODE_URL, 'mainnet')).toBeNull();
});
it('reuses block IDs and confirmed transaction details from IndexedDB in a new API instance', async () => {
	const id = 'b'.repeat(43);
	await writeNodeCache('block', NODE_URL, { ...rawBlock(100), txs: [id] }, hash(100));
	await writeNodeCache(
		'transaction',
		NODE_URL,
		{ id, quantity: '0', reward: '9007199254740993', data_size: '0', tags: [] },
		`confirmed/${id}`
	);
	const fetch = vi.fn();
	vi.stubGlobal('fetch', fetch);
	const api = createArweaveNodeApi();
	expect(await api.getBlockTransactionIds(NODE_URL, hash(100), new AbortController().signal)).toEqual([id]);
	expect(await api.getTransaction(NODE_URL, id, new AbortController().signal, 'confirmed')).toMatchObject({
		fee: '9007199254740993',
	});
	expect(fetch).not.toHaveBeenCalled();
	expect(await readNodeCache('block', NODE_URL, hash(100))).not.toBeNull();
});
