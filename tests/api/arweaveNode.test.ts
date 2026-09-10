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
		expect(await createArweaveNodeApi().getBlocks(NODE_URL, { height: 2, hash: hash(2) }, 10, signal())).toHaveLength(
			3
		);
		expect(fetch).toHaveBeenCalledTimes(4);
		fetch.mockClear();
		mockFetch(() => new Response('', { status: 429 }));
		await expect(
			createArweaveNodeApi().getBlocks(NODE_URL, { height: 2, hash: hash(2) }, 2, signal())
		).rejects.toMatchObject({ code: 'rate-limited' });
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
