import { afterEach, describe, expect, it, vi } from 'vitest';

import { getTransactionById, getTransactions, getTransactionsByBlock } from '../../src/api/blocks';
import { setGraphQLEndpoint } from '../../src/api/graphql';
import { DEFAULT_GRAPHQL_ENDPOINT } from '../../src/helpers/config';
import { mapTransactionForCsv } from '../../src/helpers/csv';
import { EMPTY_TRANSFER_ID, EMPTY_TRANSFER_TAGS } from '../fixtures/transactionData';

afterEach(() => {
	vi.unstubAllGlobals();
	setGraphQLEndpoint(DEFAULT_GRAPHQL_ENDPOINT);
});

function stubEmptyTransactions() {
	const fetchMock = vi.fn().mockResolvedValue({
		ok: true,
		json: vi.fn().mockResolvedValue({ data: { transactions: { pageInfo: { hasNextPage: false }, edges: [] } } }),
	} as unknown as Response);
	vi.stubGlobal('fetch', fetchMock);

	return fetchMock;
}

describe('Arweave block API adapter', () => {
	it('preserves the real lowercase transfer tags in recent, block, by-ID, and CSV results', async () => {
		const node = { id: EMPTY_TRANSFER_ID, tags: EMPTY_TRANSFER_TAGS };
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					data: { transactions: { edges: [{ node }], pageInfo: { hasNextPage: false } } },
				}),
			})
		);

		const recent = await getTransactions();
		const block = await getTransactionsByBlock({ blockHeight: 2006276 });
		const transaction = await getTransactionById({ id: EMPTY_TRANSFER_ID });

		for (const result of [recent.transactions.edges[0].node, block.transactions.edges[0].node, transaction]) {
			expect(result.tags).toEqual(EMPTY_TRANSFER_TAGS);
			expect(mapTransactionForCsv(result).tags).toEqual(EMPTY_TRANSFER_TAGS);
		}
	});

	it('keeps duplicate names, mixed casing, empty values, and original tag order', async () => {
		const tags = [
			{ name: 'SDK', value: 'first' },
			{ name: 'appName', value: '' },
			{ name: 'SDK', value: 'second' },
			{ name: 'sdk', value: 'third' },
		];
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					data: { transactions: { edges: [{ node: { id: EMPTY_TRANSFER_ID, tags } }], pageInfo: {} } },
				}),
			})
		);

		expect((await getTransactionById({ id: EMPTY_TRANSFER_ID })).tags).toEqual(tags);
	});

	it('requests the latest transactions in descending block order', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({
				data: {
					transactions: {
						pageInfo: {
							hasNextPage: true,
						},
						edges: [],
					},
				},
			}),
		} as unknown as Response);
		vi.stubGlobal('fetch', fetchMock);

		await getTransactions({ first: 20 });

		expect(fetchMock).toHaveBeenCalledOnce();
		const request = fetchMock.mock.calls[0];
		const body = JSON.parse((request[1] as RequestInit).body as string);

		expect(request[0]).toBe(DEFAULT_GRAPHQL_ENDPOINT);
		expect(body.variables).toEqual({ first: 20, after: null });
		expect(body.query).toContain('sort: HEIGHT_DESC');
	});

	it('can request recent AO messages with a transaction count', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({
				data: {
					transactions: {
						count: 12,
						pageInfo: {
							hasNextPage: false,
						},
						edges: [],
					},
				},
			}),
		} as unknown as Response);
		vi.stubGlobal('fetch', fetchMock);

		const response = await getTransactions({
			first: 50,
			typeFilter: 'message',
			includeCount: true,
		});

		const request = fetchMock.mock.calls[0];
		const body = JSON.parse((request[1] as RequestInit).body as string);

		expect(body.query).toContain('{ name: "Data-Protocol", values: ["ao"] }');
		expect(body.query).toContain('{ name: "Type", values: ["Message"] }');
		expect(body.query).toContain('count');
		expect(response.transactions.count).toBe(12);
	});

	it('queries the configured GraphQL endpoint', async () => {
		const fetchMock = stubEmptyTransactions();
		setGraphQLEndpoint('https://gateway.example/~query@1.0/graphql');

		await getTransactions({ first: 5 });

		expect(fetchMock.mock.calls[0][0]).toBe('https://gateway.example/~query@1.0/graphql');
	});

	it('queries filtered message pages without count while retaining cursors and safely escaped tag values', async () => {
		const edge = { cursor: 'next-page', node: { id: 'm'.repeat(43), tags: [] } };
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { transactions: { edges: [edge], pageInfo: { hasNextPage: true } } } }),
		});
		vi.stubGlobal('fetch', fetchMock);
		const tags = [{ name: 'action', values: ['A"B\\C'] }];
		const response = await getTransactions({
			first: 25,
			after: 'current-page',
			includeCount: false,
			tags,
			owners: ['o'.repeat(43)],
			recipients: ['p'.repeat(43)],
			minBlock: 100,
			maxBlock: 200,
		});
		const body = JSON.parse(fetchMock.mock.calls[0][1].body);
		expect(body.query).not.toMatch(/\bcount\b/);
		expect(body.query).toContain(`name: "action", values: ${JSON.stringify(tags[0].values)}`);
		expect(body.query).toContain(`owners: ${JSON.stringify(['o'.repeat(43)])}`);
		expect(body.query).toContain(`recipients: ${JSON.stringify(['p'.repeat(43)])}`);
		expect(body.query).toContain('block: { min: 100, max: 200 }');
		expect(body.variables).toEqual({ first: 25, after: 'current-page' });
		expect(response.transactions.edges).toEqual([edge]);
		expect(response.transactions.pageInfo.hasNextPage).toBe(true);
	});
});
