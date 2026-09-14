import { afterEach, describe, expect, it, vi } from 'vitest';

import { createArweaveNodeApi } from '../../src/api/arweaveNode/relayAdapter';
import { hash, NODE_URL } from '../fixtures/arweaveNode';

const signal = () => new AbortController().signal;
const json = (body: unknown) => new Response(JSON.stringify(body));
function mockIndex(read: (low: number, high: number) => Response) {
	const calls: number[][] = [];
	vi.stubGlobal(
		'fetch',
		vi.fn((url: string) => {
			const path = new URL(new URL(url).searchParams.get('relay-path')).pathname;
			expect(path).toMatch(/^\/block_index\/\d+\/\d+$/);
			const [, , low, high] = path.split('/');
			calls.push([Number(low), Number(high)]);
			return Promise.resolve(read(Number(low), Number(high)));
		})
	);
	return calls;
}
function index(low: number, high: number) {
	return Array.from({ length: high - low + 1 }, (_, i) => ({ hash: hash(high - i) }));
}
afterEach(() => vi.unstubAllGlobals());

describe('node ancestry through the relay', () => {
	it('batches nearby heights into one anchored range and accepts native index records', async () => {
		const calls = mockIndex((low, high) => json(index(low, high)));
		const result = await createArweaveNodeApi().getAncestors(
			NODE_URL,
			{ height: 100, hash: hash(100) },
			[99, 95, 99],
			signal()
		);
		expect(calls).toEqual([[95, 100]]);
		expect(result).toHaveLength(6);
		expect(result.at(-1)).toEqual({ height: 95, hash: hash(95) });
	});
	it('compares distant tips without downloading their intervening blocks and reseals the anchor', async () => {
		const calls = mockIndex((low, high) => json(index(low, high).map((block) => block.hash)));
		const result = await createArweaveNodeApi().getAncestors(
			NODE_URL,
			{ height: 2_000_000, hash: hash(2_000_000) },
			[0, 1, 1000, 1_999_999],
			signal()
		);
		expect(calls).toEqual([
			[1_999_999, 2_000_000],
			[1000, 1000],
			[0, 1],
			[2_000_000, 2_000_000],
		]);
		expect(result.map((block) => block.height)).toEqual([2_000_000, 1_999_999, 1000, 1, 0]);
	});
	it('discards the whole comparison when a node reorganizes between sparse reads', async () => {
		let reads = 0;
		mockIndex((low, high) => json(++reads === 3 ? [hash(999)] : index(low, high)));
		await expect(
			createArweaveNodeApi().getAncestors(NODE_URL, { height: 200, hash: hash(200) }, [0], signal())
		).rejects.toMatchObject({ code: 'chain-changed' });
	});
	it.each([[], ['invalid'], [hash(100), hash(100)]])('rejects malformed or truncated indexes: %j', async (value) => {
		mockIndex(() => json(value));
		await expect(
			createArweaveNodeApi().getAncestors(NODE_URL, { height: 100, hash: hash(100) }, [99], signal())
		).rejects.toMatchObject({ code: 'invalid-response' });
	});
	it('rejects invalid target heights and cancelled requests without fetching', async () => {
		const calls = mockIndex(() => json([]));
		const api = createArweaveNodeApi();
		for (const height of [-1, 101, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
			await expect(
				api.getAncestors(NODE_URL, { height: 100, hash: hash(100) }, [height], signal())
			).rejects.toMatchObject({ code: 'invalid-input' });
		}
		const controller = new AbortController();
		controller.abort();
		await expect(
			api.getAncestors(NODE_URL, { height: 100, hash: hash(100) }, [99], controller.signal)
		).rejects.toMatchObject({ code: 'cancelled' });
		expect(calls).toEqual([]);
	});
});
