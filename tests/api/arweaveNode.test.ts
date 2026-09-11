import { afterEach, describe, expect, it, vi } from 'vitest';

import { parseBlock, parseInfo, parsePending, parseTransaction } from '../../src/api/arweaveNode/parsers';
import { createArweaveNodeApi } from '../../src/api/arweaveNode/relayAdapter';
import { hash, MINER_ADDRESS, NODE_URL, rawBlock } from '../fixtures/arweaveNode';

afterEach(() => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
});
const signal = () => new AbortController().signal;
function mockFetch(read: (path: string) => Response | Promise<Response>) {
	const mock = vi.fn((url: string) => read(new URL(new URL(url).searchParams.get('relay-path')).pathname));
	vi.stubGlobal('fetch', mock);
	return mock;
}
const json = (value: unknown) => new Response(JSON.stringify(value));

describe('Arweave node relay', () => {
	it('reads confirmed metadata directly from the selected node transaction endpoint', async () => {
		const id = 'b'.repeat(43);
		const fetch = mockFetch(() => json({ id, quantity: '0', reward: '9007199254740993', data_size: '10', tags: [] }));
		expect(await createArweaveNodeApi().getTransaction(NODE_URL, id, signal(), 'confirmed')).toMatchObject({
			id,
			fee: '9007199254740993',
		});
		expect(new URL(fetch.mock.calls[0][0]).searchParams.get('relay-path')).toBe(`${NODE_URL}/tx/${id}`);
	});
	it('reuses a bounded, node-specific block ID cache and rejects malformed IDs', async () => {
		const ids = ['b'.repeat(43), 'c'.repeat(43)];
		const fetch = mockFetch((path) =>
			json({ ...rawBlock(Number(path.split('/').pop().replace(/^a+/, ''))), txs: [ids[0], { id: ids[1] }] })
		);
		const api = createArweaveNodeApi();
		const first = await api.getBlockTransactionIds(NODE_URL, hash(100), signal());
		expect(first).toEqual(ids);
		first.pop();
		expect(await api.getBlockTransactionIds(NODE_URL, hash(100), signal())).toEqual(ids);
		expect(fetch).toHaveBeenCalledTimes(1);
		await api.getBlockTransactionIds('http://another.node:1984', hash(100), signal());
		expect(fetch).toHaveBeenCalledTimes(2);
		for (let height = 99; height >= 84; height--) await api.getBlockTransactionIds(NODE_URL, hash(height), signal());
		await api.getBlockTransactionIds(NODE_URL, hash(100), signal());
		expect(fetch).toHaveBeenCalledTimes(19);
		for (const txs of [['invalid'], [ids[0], ids[0]], [null]]) {
			expect(() => parseBlock({ ...rawBlock(1), txs })).toThrow();
		}
		const aborted = new AbortController();
		aborted.abort();
		await expect(api.getBlockTransactionIds(NODE_URL, hash(100), aborted.signal)).rejects.toMatchObject({
			code: 'cancelled',
		});
	});
	it('uses the HTTPS relay with an encoded target and omitted credentials, preserving balance precision', async () => {
		const fetch = mockFetch(() => new Response('900719925474099312345678'));
		const balance = await createArweaveNodeApi().getBalance(NODE_URL, MINER_ADDRESS, signal());
		expect(balance).toBe('900719925474099312345678');
		const url = new URL(fetch.mock.calls[0][0]);
		expect(url.origin + url.pathname).toBe('https://arweave.net/~relay@1.0/call');
		expect(url.searchParams.get('relay-path')).toBe(`${NODE_URL}/wallet/${MINER_ADDRESS}/balance`);
		expect(url.searchParams.get('relay-method')).toBe('GET');
		expect(fetch).toHaveBeenCalledWith(url.href, expect.objectContaining({ credentials: 'omit', cache: 'no-store' }));
	});
	it('indexes a linked descending range with at most four requests in flight', async () => {
		let active = 0;
		let maximum = 0;
		mockFetch(async (path) => {
			active++;
			maximum = Math.max(maximum, active);
			await new Promise((resolve) => setTimeout(resolve, 1));
			active--;
			return path.startsWith('/block_index')
				? json(Array.from({ length: 8 }, (_, i) => hash(100 - i)))
				: json(rawBlock(Number(path.split('/').pop().replace(/^a+/, ''))));
		});
		const blocks = await createArweaveNodeApi().getBlocks(NODE_URL, { height: 100, hash: hash(100) }, 8, signal());
		expect(blocks.map((block) => block.height)).toEqual([100, 99, 98, 97, 96, 95, 94, 93]);
		expect(blocks[0].reward).toBe('12345678901234567');
		expect(maximum).toBeLessThanOrEqual(4);
	});
	it('falls back to linked hashes only when the range endpoint is absent', async () => {
		const fetch = mockFetch((path) =>
			path.startsWith('/block_index')
				? new Response('', { status: 404 })
				: json(rawBlock(Number(path.split('/').pop().replace(/^a+/, ''))))
		);
		const onProgress = vi.fn();
		expect(
			await createArweaveNodeApi().getBlocks(NODE_URL, { height: 2, hash: hash(2) }, 10, signal(), onProgress)
		).toHaveLength(3);
		expect(onProgress.mock.calls.map(([blocks]) => blocks.map((block) => block.height))).toEqual([
			[2],
			[2, 1],
			[2, 1, 0],
		]);
		expect(fetch).toHaveBeenCalledTimes(4);
		fetch.mockClear();
		mockFetch(() => new Response('', { status: 429 }));
		await expect(
			createArweaveNodeApi().getBlocks(NODE_URL, { height: 2, hash: hash(2) }, 2, signal())
		).rejects.toMatchObject({ code: 'rate-limited' });
	});
	it('publishes verified prefixes as out-of-order blocks arrive without waiting for the full page', async () => {
		const pending = new Map<number, (value: Response) => void>();
		mockFetch((path) =>
			path.startsWith('/block_index')
				? json([hash(100), hash(99), hash(98), hash(97)])
				: new Promise((resolve) => pending.set(Number(path.split('/').pop().replace(/^a+/, '')), resolve))
		);
		const onProgress = vi.fn();
		const result = createArweaveNodeApi().getBlocks(
			NODE_URL,
			{ height: 100, hash: hash(100) },
			4,
			signal(),
			onProgress
		);
		await vi.waitFor(() => expect(pending.size).toBe(4));
		pending.get(99)(json(rawBlock(99)));
		pending.get(100)(json(rawBlock(100)));
		await vi.waitFor(() => expect(onProgress).toHaveBeenCalled());
		expect(onProgress.mock.lastCall[0].map((block) => block.height)).toEqual([100, 99]);
		const firstSnapshot = onProgress.mock.lastCall[0];
		pending.get(97)(json(rawBlock(97)));
		pending.get(98)(json(rawBlock(98)));
		expect((await result).map((block) => block.height)).toEqual([100, 99, 98, 97]);
		expect(firstSnapshot).toHaveLength(2);
		expect(onProgress.mock.lastCall[0]).toHaveLength(4);
	});
	it('retains only verified progress and cancels remaining reads when a block breaks the chain', async () => {
		const pending = new Map<number, { resolve: (value: Response) => void; signal: AbortSignal }>();
		vi.stubGlobal(
			'fetch',
			vi.fn((url: string, options: RequestInit) => {
				const path = new URL(new URL(url).searchParams.get('relay-path')).pathname;
				if (path.startsWith('/block_index')) return Promise.resolve(json([hash(100), hash(99), hash(98)]));
				return new Promise((resolve, reject) => {
					pending.set(Number(path.split('/').pop().replace(/^a+/, '')), { resolve, signal: options.signal });
					options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
				});
			})
		);
		const onProgress = vi.fn();
		const result = createArweaveNodeApi()
			.getBlocks(NODE_URL, { height: 100, hash: hash(100) }, 3, signal(), onProgress)
			.catch((error) => error);
		await vi.waitFor(() => expect(pending.size).toBe(3));
		pending.get(100).resolve(json({ ...rawBlock(100), previous_block: hash(50) }));
		await vi.waitFor(() => expect(onProgress).toHaveBeenCalledTimes(1));
		pending.get(99).resolve(json(rawBlock(99)));
		expect(await result).toMatchObject({ code: 'chain-changed' });
		expect(pending.get(98).signal.aborted).toBe(true);
		expect(onProgress).toHaveBeenCalledTimes(1);
		expect(onProgress.mock.lastCall[0].map((block) => block.height)).toEqual([100]);
	});
	it('rejects a changed tip and inconsistent parent links', async () => {
		mockFetch(() => json([hash(101)]));
		await expect(
			createArweaveNodeApi().getBlocks(NODE_URL, { height: 100, hash: hash(100) }, 1, signal())
		).rejects.toMatchObject({ code: 'chain-changed' });
		mockFetch((path) =>
			path.startsWith('/block_index')
				? json([hash(100), hash(99)])
				: json({ ...rawBlock(path.endsWith(hash(100)) ? 100 : 99), previous_block: hash(50) })
		);
		await expect(
			createArweaveNodeApi().getBlocks(NODE_URL, { height: 100, hash: hash(100) }, 2, signal())
		).rejects.toMatchObject({ code: 'chain-changed' });
	});
	it('reads pending metadata from the native endpoint and decodes tags', async () => {
		const id = 'b'.repeat(43);
		const fetch = mockFetch(() =>
			json({
				id,
				quantity: '0',
				reward: '9007199254740993',
				data_size: '10',
				tags: [{ name: btoa('Content-Type'), value: btoa('text/plain') }],
			})
		);
		expect(await createArweaveNodeApi().getTransaction(NODE_URL, id, signal())).toMatchObject({
			id,
			fee: '9007199254740993',
			contentType: 'text/plain',
		});
		expect(new URL(fetch.mock.calls[0][0]).searchParams.get('relay-path')).toBe(`${NODE_URL}/unconfirmed_tx/${id}`);
	});
	it('maps native senders, recipients and case-sensitive tags for the shared transaction list', async () => {
		const raw = {
			id: MINER_ADDRESS,
			quantity: '9007199254740993',
			reward: '123',
			data_size: '0',
			owner: 'aGVsbG8',
			target: MINER_ADDRESS,
			tags: [{ name: btoa('App-Name'), value: btoa('Example') }],
		};
		expect(await parseTransaction(raw, MINER_ADDRESS)).toMatchObject({
			owner: 'LPJNul-wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ',
			recipient: MINER_ADDRESS,
			quantity: '9007199254740993',
			tags: [{ name: 'App-Name', value: 'Example' }],
			appName: 'Example',
		});
		await expect(parseTransaction({ ...raw, owner: 'a' }, MINER_ADDRESS)).rejects.toMatchObject({
			code: 'invalid-response',
		});
		await expect(parseTransaction({ ...raw, target: 'invalid' }, MINER_ADDRESS)).rejects.toMatchObject({
			code: 'invalid-response',
		});
	});
	it('rejects bad JSON, status failures, unsafe integers, and malformed payloads', async () => {
		mockFetch(() => new Response('<html>not a node</html>'));
		await expect(createArweaveNodeApi().getPending(NODE_URL, signal())).rejects.toMatchObject({
			code: 'invalid-response',
		});
		mockFetch(() => new Response('', { status: 503 }));
		await expect(createArweaveNodeApi().getPending(NODE_URL, signal())).rejects.toMatchObject({ code: 'unavailable' });
		expect(() => parsePending(['invalid'])).toThrow();
		expect(() => parseInfo({ height: 1 })).toThrow();
		expect(() => parseBlock({ ...rawBlock(1), reward: Number.MAX_SAFE_INTEGER + 1 })).toThrow();
	});
	it('normalizes cancellation and timeouts and cancels queued requests', async () => {
		vi.useFakeTimers();
		const fetch = vi.fn(
			(_url, options) =>
				new Promise((_resolve, reject) =>
					options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
				)
		);
		vi.stubGlobal('fetch', fetch);
		const api = createArweaveNodeApi();
		const cancelled = new AbortController();
		const promises = Array.from({ length: 4 }, () => api.getInfo(NODE_URL, signal()).catch((error) => error));
		const queued = api.getInfo(NODE_URL, cancelled.signal).catch((error) => error);
		cancelled.abort();
		expect(await queued).toMatchObject({ code: 'cancelled' });
		await vi.advanceTimersByTimeAsync(20_001);
		expect(await Promise.all(promises)).toEqual(Array(4).fill(expect.objectContaining({ code: 'timeout' })));
		expect(fetch).toHaveBeenCalledTimes(4);
	});
	it('rejects non-node input before making a request', async () => {
		const fetch = mockFetch(() => json([]));
		await expect(createArweaveNodeApi().getPending('javascript:alert(1)', signal())).rejects.toMatchObject({
			code: 'invalid-input',
		});
		expect(fetch).not.toHaveBeenCalled();
	});
});
