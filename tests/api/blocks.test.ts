import { afterEach, describe, expect, it, vi } from 'vitest';

import { getTransactions } from '../../src/api/blocks';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('Arweave block API adapter', () => {
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

		await getTransactions({ first: 20, gateway: 'https://gateway.example' });

		expect(fetchMock).toHaveBeenCalledOnce();
		const request = fetchMock.mock.calls[0];
		const body = JSON.parse((request[1] as RequestInit).body as string);

		expect(request[0]).toBe('https://gateway.example/graphql');
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
			gateway: 'https://gateway.example',
		});

		const request = fetchMock.mock.calls[0];
		const body = JSON.parse((request[1] as RequestInit).body as string);

		expect(body.query).toContain('{ name: "Data-Protocol", values: ["ao"] }');
		expect(body.query).toContain('{ name: "Type", values: ["Message"] }');
		expect(body.query).toContain('count');
		expect(response.transactions.count).toBe(12);
	});
});
