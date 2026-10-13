import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getTransactionIndexQuery, readTransactionIndex } from '../../src/api/graphql';
import { requestRemote } from '../../src/api/http';

vi.mock('api/http', () => ({ requestRemote: vi.fn() }));
const id = 'a'.repeat(43);
const endpoint = 'https://index.example/~query@1.0/graphql';
const indexed = { data: { transactions: { edges: [{ node: { id } }] } } };

beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.useRealTimers());

describe('transaction GraphQL availability', () => {
	it('queries the requested endpoint and ID and preserves the response for the playground', async () => {
		vi.mocked(requestRemote).mockResolvedValue(new Response(JSON.stringify(indexed)));
		const result = await readTransactionIndex({ id, endpoint });
		expect(result).toEqual({ status: 'available', response: JSON.stringify(indexed, null, 2) });
		expect(requestRemote).toHaveBeenCalledWith(
			endpoint,
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ query: getTransactionIndexQuery(id) }),
				signal: expect.any(AbortSignal),
			})
		);
		expect(getTransactionIndexQuery(id)).toContain(`transactions(ids: ["${id}"], first: 1)`);
	});

	it('reports a successful empty index result as missing', async () => {
		const empty = { data: { transactions: { edges: [] } } };
		vi.mocked(requestRemote).mockResolvedValue(new Response(JSON.stringify(empty)));
		expect(await readTransactionIndex({ id, endpoint })).toEqual({
			status: 'missing',
			response: JSON.stringify(empty, null, 2),
		});
	});

	it.each([
		null,
		{},
		{ data: null },
		{ data: { transactions: { edges: null } } },
		{ data: { transactions: { edges: [null] } } },
		{ data: { transactions: { edges: [{ node: { id: 'b'.repeat(43) } }] } } },
		{ ...indexed, errors: [{ message: 'Index failed' }] },
	])('does not classify invalid or failed GraphQL responses as missing: %j', async (payload) => {
		vi.mocked(requestRemote).mockResolvedValue(new Response(JSON.stringify(payload)));
		expect(await readTransactionIndex({ id, endpoint })).toEqual({ status: 'error', code: 'invalid-response' });
	});

	it('rejects invalid IDs without querying the endpoint', async () => {
		expect(await readTransactionIndex({ id: 'invalid', endpoint })).toEqual({ status: 'error', code: 'invalid-input' });
		expect(requestRemote).not.toHaveBeenCalled();
	});

	it('normalizes HTTP, network and invalid JSON failures', async () => {
		vi.mocked(requestRemote).mockResolvedValueOnce(new Response(null, { status: 503 }));
		expect(await readTransactionIndex({ id, endpoint })).toEqual({ status: 'error', code: 'unavailable' });
		vi.mocked(requestRemote).mockRejectedValueOnce(new TypeError('Network failure'));
		expect(await readTransactionIndex({ id, endpoint })).toEqual({ status: 'error', code: 'unavailable' });
		vi.mocked(requestRemote).mockResolvedValueOnce(new Response('invalid JSON'));
		expect(await readTransactionIndex({ id, endpoint })).toEqual({ status: 'error', code: 'invalid-response' });
	});

	it('cancels superseded lookups', async () => {
		vi.mocked(requestRemote).mockImplementation(
			(_input, init) =>
				new Promise((_resolve, reject) => {
					init.signal.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')));
				})
		);
		const controller = new AbortController();
		const pending = readTransactionIndex({ id, endpoint, signal: controller.signal });
		controller.abort();
		expect(await pending).toEqual({ status: 'error', code: 'cancelled' });
	});

	it('bounds a stalled index request', async () => {
		vi.useFakeTimers();
		vi.mocked(requestRemote).mockImplementation(
			(_input, init) =>
				new Promise((_resolve, reject) => {
					init.signal.addEventListener('abort', () => reject(new DOMException('Timed out', 'AbortError')));
				})
		);
		const pending = readTransactionIndex({ id, endpoint });
		await vi.advanceTimersByTimeAsync(15000);
		expect(await pending).toEqual({ status: 'error', code: 'timeout' });
	});
});
