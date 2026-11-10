import fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	getTransactionById,
	getTransactions,
	getTransactionsByBlock,
	getTransactionsByBundle,
} from '../../src/api/blocks';
import { FLAGS } from '../../src/helpers/config';
import { BUNDLE_ID, CURRENT_BUNDLE_LINKS, CURRENT_BUNDLE_LOCATION } from '../fixtures/transactionData';

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

	it('reads the current numeric AO links from loaded bundle metadata', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		const result = await getTransactionsByBundle({
			bundleId: BUNDLE_ID,
			bundleTags: Object.entries(CURRENT_BUNDLE_LINKS).map(([name, value]) => ({ name, value })),
		});
		expect(result.transactions.edges.map((edge) => edge.node.id)).toEqual(
			Object.values(CURRENT_BUNDLE_LINKS).map((link) => link.slice(3))
		);
		expect(result.transactions.count).toBe(4);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('reads numeric AO links directly from the gateway HTTP headers', async () => {
		const response = new Response(null, { headers: CURRENT_BUNDLE_LINKS });
		const fetchMock = vi.fn().mockResolvedValue(response);
		vi.stubGlobal('fetch', fetchMock);
		const result = await getTransactionsByBundle({ bundleId: 'n'.repeat(43) });
		expect(result.transactions.count).toBe(4);
		expect(response.bodyUsed).toBe(false);
		expect(fetchMock.mock.calls[0][1].headers.Accept).toBe('*/*');
	});

	it('follows the observed JSON canonical redirect and paginates its four bundle members', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ status: 302, location: CURRENT_BUNDLE_LOCATION }), {
					status: 302,
					headers: { 'content-type': 'application/json' },
				})
			)
			.mockResolvedValueOnce(jsonResponse({ ...CURRENT_BUNDLE_LINKS, reward: '3280315789', commitments: {} }));
		vi.stubGlobal('fetch', fetchMock);
		const controller = new AbortController();
		const first = await getTransactionsByBundle({ bundleId: BUNDLE_ID, first: 2, signal: controller.signal });
		expect(first.transactions.count).toBe(4);
		expect(first.transactions.edges.map((edge) => edge.node.id)).toEqual(
			Object.values(CURRENT_BUNDLE_LINKS)
				.slice(0, 2)
				.map((link) => link.slice(3))
		);
		expect(first.transactions.pageInfo.hasNextPage).toBe(true);
		expect(fetchMock.mock.calls[1][0]).toBe(
			`https://mdvu3pasjviyxllqufrcalg3itnl6n5sa6zuxrokel4lsm47r2ia.arweave.net/${BUNDLE_ID}?accept-bundle=false`
		);
		expect(fetchMock.mock.calls[1][1]).toEqual({
			signal: controller.signal,
			headers: { Accept: 'application/json' },
		});
		const last = await getTransactionsByBundle({
			bundleId: BUNDLE_ID,
			first: 2,
			after: first.transactions.edges[1].cursor,
		});
		expect(last.transactions.edges.map((edge) => edge.node.id)).toEqual(
			Object.values(CURRENT_BUNDLE_LINKS)
				.slice(2)
				.map((link) => link.slice(3))
		);
		expect(last.transactions.pageInfo.hasNextPage).toBe(false);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it.each([
		`https://example.com/${'r'.repeat(43)}`,
		`http://${'a'.repeat(52)}.arweave.net/${'r'.repeat(43)}`,
		`https://user:secret@${'a'.repeat(52)}.arweave.net/${'r'.repeat(43)}`,
		`https://${'a'.repeat(52)}.arweave.net:444/${'r'.repeat(43)}`,
		`https://${'a'.repeat(52)}.arweave.net/${'x'.repeat(43)}`,
		`https://${'a'.repeat(52)}.arweave.net/${'r'.repeat(43)}#fragment`,
	])('rejects a JSON redirect outside this bundle’s public canonical URL: %s', async (location) => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ status: 302, location }), {
				status: 302,
				headers: { 'content-type': 'application/json' },
			})
		);
		vi.stubGlobal('fetch', fetchMock);
		await expect(getTransactionsByBundle({ bundleId: 'r'.repeat(43) })).rejects.toThrow('Invalid bundle redirect');
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('bounds JSON redirects instead of following a canonical redirect loop', async () => {
		const id = 'l'.repeat(43);
		const fetchMock = vi.fn().mockImplementation(
			async () =>
				new Response(JSON.stringify({ status: 302, location: `https://${'a'.repeat(52)}.arweave.net/${id}` }), {
					status: 302,
					headers: { 'content-type': 'application/json' },
				})
		);
		vi.stubGlobal('fetch', fetchMock);
		await expect(getTransactionsByBundle({ bundleId: id })).rejects.toThrow('Invalid bundle redirect');
		expect(fetchMock).toHaveBeenCalledTimes(2);
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
						name: index % 2 ? `${index}+link` : String(index),
						value: `${index % 2 ? '' : 'ao:'}${String(index).padStart(43, '0')}`,
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
