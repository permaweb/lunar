import { plan } from 'arlmdb.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getTransactions } from '../../../src/api/blocks';
import { setConfiguredGraphQLSource } from '../../../src/api/graphql/source';

const execute = vi.hoisted(() => vi.fn());
vi.mock('../../../src/api/graphql/client', () => ({ executeGraphQL: execute }));

afterEach(() => {
	vi.clearAllMocks();
	setConfiguredGraphQLSource('ar-lmdb');
});

describe('block explorer transaction queries in local mode', () => {
	it('uses native-compatible fields and combines 50-item pages without presenting a bounded total', async () => {
		let offset = 0;
		execute.mockImplementation(async ({ query, variables, source }) => {
			expect(source).toBe('ar-lmdb');
			expect(() => plan(query, variables)).not.toThrow();
			const first = variables.first;
			const edges = Array.from({ length: first }, (_, i) => ({
				cursor: `offset=${offset + i + 1}`,
				node: { id: `tx${offset + i + 1}`, tags: [] },
			}));
			offset += first;
			// A settings change must not mix local cursors with remote GraphQL mid-query.
			setConfiguredGraphQLSource('remote');
			return {
				data: { transactions: { count: 1000, pageInfo: { hasNextPage: true }, edges } },
				extensions: { arLmdb: { count: { exact: false, value: 1000 } } },
			};
		});
		const response = await getTransactions({ first: 100, typeFilter: 'message', includeCount: true });
		expect(response.transactions.edges).toHaveLength(100);
		expect(response.transactions.count).toBeUndefined();
		expect(execute.mock.calls[1][0].variables.after).toBe('offset=50');
	});
});
