import { afterEach, describe, expect, it, vi } from 'vitest';

import { getArLmdbTransactions } from '../../../src/api/graphql/transactions';

const execute = vi.hoisted(() => vi.fn());
vi.mock('../../../src/api/graphql/client', () => ({ executeGraphQL: execute }));

function page(start: number, size: number, hasNextPage: boolean, count?: number) {
	return {
		data: {
			transactions: {
				count,
				pageInfo: { hasNextPage },
				edges: Array.from({ length: size }, (_, i) => ({
					cursor: `offset=${start + i}`,
					node: { id: `tx-${start + i}`, tags: [], data: { size: '1', type: 'text/plain' } },
				})),
			},
		},
	};
}

afterEach(() => vi.clearAllMocks());

describe('AR LMDB transaction adapter', () => {
	it('fills a 100-result app page from two native pages and preserves filters/cursors', async () => {
		execute.mockResolvedValueOnce(page(1, 50, true, 120)).mockResolvedValueOnce(page(51, 50, true));
		const response = await getArLmdbTransactions({
			tags: [{ name: 'Type', values: ['Message', 'Process'] }],
			owners: ['owner'],
			recipients: ['recipient'],
			minBlock: 100,
			maxBlock: 200,
			paginator: 100,
		});
		expect(response.data).toHaveLength(100);
		expect(response.nextCursor).toBe('offset=100');
		expect(response.count).toBe(120);
		expect(execute.mock.calls[0][0].variables).toMatchObject({
			first: 50,
			after: null,
			block: { min: 100, max: 200 },
			owners: ['owner'],
			recipients: ['recipient'],
		});
		expect(execute.mock.calls[1][0].variables).toMatchObject({ first: 50, after: 'offset=50' });
	});

	it('does not present an inexact bounded count as a total', async () => {
		execute.mockResolvedValue({
			...page(1, 1, false, 1000),
			extensions: { arLmdb: { count: { value: 1000, exact: false } } },
		});
		const response = await getArLmdbTransactions({ owners: ['owner'], paginator: 1 });
		expect(response.count).toBeNull();
		expect(response.nextCursor).toBe('END');
	});

	it('propagates unsupported errors instead of an empty success', async () => {
		execute.mockResolvedValue({ errors: [{ message: 'ids are not predicates' }] });
		await expect(getArLmdbTransactions({ id: ['abc'] })).rejects.toThrow('ids are not predicates');
		expect(execute.mock.calls[0][0].variables.ids).toEqual(['abc']);
	});

	it('rejects a nonadvancing page and malformed edges', async () => {
		execute.mockResolvedValue(page(1, 0, true));
		await expect(getArLmdbTransactions({ owners: ['owner'] })).rejects.toMatchObject({ code: 'invalid-response' });
		execute.mockResolvedValue({
			data: { transactions: { pageInfo: { hasNextPage: false }, edges: [{ node: null }] } },
		});
		await expect(getArLmdbTransactions({ owners: ['owner'] })).rejects.toMatchObject({ code: 'invalid-response' });
	});
});
