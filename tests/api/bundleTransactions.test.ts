import fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	getTransactionById,
	getTransactions,
	getTransactionsByBlock,
	getTransactionsByBundle,
} from '../../src/api/blocks';
import { FLAGS } from '../../src/helpers/config';

const bundleId = 'laivGT63LsUVPqzVwDLfFj5AHE9QOCycxs8C_DWcKbs';
const firstId = 'uX2tJrIgBgDTGvSU30Q16-TVZU1J3NXpflyDtu0kA5c';
const secondId = 'R39lRKpiIOzyggzGPttRhGMmVx_5AMbkupORp-XGnR0';
const tenthId = 'B2n5XnlgQcfSgOcS2b1SqD6Ogg7RaV_-mB20UVv5Br0';
const originalFlag = FLAGS.USE_GQL_BUNDLED_IN;
const emptyConnection = { pageInfo: { hasNextPage: false }, edges: [] };
const jsonResponse = (data: unknown) =>
	new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
	FLAGS.USE_GQL_BUNDLED_IN = false;
});

afterEach(() => {
	FLAGS.USE_GQL_BUNDLED_IN = originalFlag;
	vi.unstubAllGlobals();
});

describe('bundle links', () => {
	it('uses the loaded tags in numeric order, deduplicates IDs, and pages without querying GraphQL', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		const bundleTags = [
			{ name: '10+Link', value: tenthId },
			{ name: '2+link', value: secondId },
			{ name: '1+link', value: firstId },
			{ name: '3+link', value: secondId },
			{ name: '4+link', value: '!'.repeat(43) },
			{ name: 'unrelated+link', value: 'z'.repeat(43) },
			{ name: 'Owner', value: 'a'.repeat(43) },
		];
		const first = await getTransactionsByBundle({ bundleId, bundleTags, first: 2 });
		expect(first.transactions.edges.map((edge) => edge.node.id)).toEqual([firstId, secondId]);
		expect(first.transactions.count).toBe(3);
		expect(first.transactions.pageInfo.hasNextPage).toBe(true);

		const last = await getTransactionsByBundle({
			bundleId,
			bundleTags,
			first: 2,
			after: first.transactions.edges[1].cursor,
		});
		expect(last.transactions.edges.map((edge) => edge.node.id)).toEqual([tenthId]);
		expect(last.transactions.pageInfo.hasNextPage).toBe(false);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('reads header links even when the gateway returns an HTML body', async () => {
		const response = new Response('<html>Node UI</html>', {
			headers: { 'content-type': 'text/html', '2+link': secondId, '1+link': firstId },
		});
		const fetchMock = vi.fn().mockResolvedValue(response);
		vi.stubGlobal('fetch', fetchMock);
		const controller = new AbortController();

		const result = await getTransactionsByBundle({ bundleId, signal: controller.signal });
		expect(result.transactions.edges.map((edge) => edge.node.id)).toEqual([firstId, secondId]);
		expect(response.bodyUsed).toBe(false);
		expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
	});

	it.each([{ '2+link': secondId, '1+link': firstId }, { txs: [firstId, { id: secondId }, firstId, 'invalid'] }])(
		'keeps JSON bundle responses working: %j',
		async (body) => {
			vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(body)));
			const result = await getTransactionsByBundle({
				bundleId: JSON.stringify(body).length.toString().padStart(43, '0'),
			});
			expect(result.transactions.edges.map((edge) => edge.node.id)).toEqual([firstId, secondId]);
		}
	);

	it('returns an empty page for an empty bundle', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])));
		const result = await getTransactionsByBundle({ bundleId: 'e'.repeat(43) });
		expect(result.transactions).toEqual({ count: 0, ...emptyConnection });
	});

	it('does not cache failed requests as an empty bundle', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(new Response(null, { status: 503 }))
			.mockResolvedValueOnce(jsonResponse([firstId]));
		vi.stubGlobal('fetch', fetchMock);
		const args = { bundleId: 'f'.repeat(43) };
		await expect(getTransactionsByBundle(args)).rejects.toThrow('503');
		expect((await getTransactionsByBundle(args)).transactions.count).toBe(1);
	});

	it('rejects invalid bundle IDs without issuing a request', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		await expect(getTransactionsByBundle({ bundleId: '../invalid' })).rejects.toThrow('Invalid bundle id');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('keeps all valid linked IDs in numeric order across page boundaries', async () => {
		vi.stubGlobal('fetch', vi.fn());
		await fc.assert(
			fc.asyncProperty(
				fc.uniqueArray(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 30 }),
				fc.integer({ min: 1, max: 10 }),
				async (indexes, pageSize) => {
					const bundleTags = indexes.map((index) => ({
						name: `${index}+link`,
						value: String(index).padStart(43, '0'),
					}));
					const resolved: string[] = [];
					let after: string | null = null;
					let hasNextPage = true;
					while (hasNextPage) {
						const result = await getTransactionsByBundle({ bundleId, bundleTags, first: pageSize, after });
						resolved.push(...result.transactions.edges.map((edge) => edge.node.id));
						after = result.transactions.edges.at(-1)?.cursor ?? null;
						hasNextPage = result.transactions.pageInfo.hasNextPage;
					}
					expect(resolved).toEqual([...indexes].sort((a, b) => a - b).map((index) => String(index).padStart(43, '0')));
				}
			)
		);
	});
});

describe('bundledIn capability flag', () => {
	it.each([false, true])('includes the transaction field only when enabled: %s', async (enabled) => {
		FLAGS.USE_GQL_BUNDLED_IN = enabled;
		const fetchMock = vi.fn().mockImplementation(async () => jsonResponse({ data: { transactions: emptyConnection } }));
		vi.stubGlobal('fetch', fetchMock);
		await getTransactions();
		await getTransactionsByBlock({ blockHeight: 123 });
		await getTransactionById({ id: firstId });
		for (const [, init] of fetchMock.mock.calls) {
			expect(JSON.parse(init.body).query.includes('bundledIn')).toBe(enabled);
		}
	});

	it('uses GraphQL bundle filtering and cursors when enabled', async () => {
		FLAGS.USE_GQL_BUNDLED_IN = true;
		const fetchMock = vi.fn().mockImplementation(async () => jsonResponse({ data: { transactions: emptyConnection } }));
		vi.stubGlobal('fetch', fetchMock);
		await getTransactionsByBundle({ bundleId, first: 5, after: 'gql-cursor', includeCount: false });
		const body = JSON.parse(fetchMock.mock.calls[0][1].body);
		expect(body.query).toContain('transactions(bundledIn: $bundleId');
		expect(body.query).toContain('bundledIn { id }');
		expect(body.query).not.toMatch(/\bcount\b/);
		expect(body.variables).toEqual({ bundleId: [bundleId], first: 5, after: 'gql-cursor' });
	});
});
