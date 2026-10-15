import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { readAoBalance } from '../../src/api/balances';
import { getTransactions } from '../../src/api/blocks';
import { searchTxById } from '../../src/helpers/search';

vi.mock('api/balances', () => ({ readAoBalance: vi.fn() }));
vi.mock('api/blocks', () => ({ getTransactions: vi.fn() }));

const txId = 'a'.repeat(43);
const transaction = {
	cursor: null,
	node: {
		id: txId,
		tags: [],
		owner: { address: 'b'.repeat(43) },
		block: { height: 2000000, timestamp: 1750000000 },
	},
};

beforeEach(() => {
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
	vi.mocked(readAoBalance).mockResolvedValue('0');
	vi.mocked(getTransactions).mockResolvedValue({
		transactions: { pageInfo: { hasNextPage: false }, edges: [] },
	});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	vi.clearAllMocks();
});

describe('transaction GraphQL lookup', () => {
	it('looks up the transaction on the configured endpoint only, without a per-query gateway', async () => {
		const getGQLData = vi.fn().mockResolvedValue({ data: [transaction] });

		expect(await searchTxById({ txId, getGQLData })).toMatchObject(transaction);
		expect(getGQLData.mock.calls).toEqual([[{ id: [txId] }]]);
	});

	it('checks wallet activity after the transaction lookup is empty', async () => {
		const getGQLData = vi
			.fn()
			.mockResolvedValueOnce({ data: [] })
			.mockResolvedValueOnce({ data: [transaction] });

		expect(await searchTxById({ txId, getGQLData })).toMatchObject({
			node: { id: txId, tags: [{ name: 'Type', value: 'Wallet' }] },
		});
		expect(getGQLData.mock.calls).toEqual([[{ id: [txId] }], [{ owners: [txId] }]]);
	});

	it('returns null when neither a transaction nor wallet activity exists', async () => {
		const getGQLData = vi.fn().mockResolvedValue({ data: [] });

		expect(await searchTxById({ txId, getGQLData })).toBeNull();
		expect(getGQLData.mock.calls).toEqual([[{ id: [txId] }], [{ owners: [txId] }]]);
		expect(readAoBalance).toHaveBeenCalledWith(txId);
	});

	it('recognizes a wallet from an incoming AO credit notice with no outgoing activity or balance', async () => {
		const recipient = '4_mDz3453UAENrhbd7-L4132qZMqilcNgYYUj9f-FWg';
		const getGQLData = vi.fn().mockResolvedValue({ data: [] });
		vi.mocked(getTransactions).mockResolvedValueOnce({
			transactions: {
				pageInfo: { hasNextPage: false },
				edges: [
					{
						cursor: 'credit-notice',
						node: {
							id: 'PlXlxvy4dQ1Rp1JJ_g1OtCUYAT4Kk5I9m8WIxwQ9CWE',
							recipient,
							tags: [{ name: 'Action', value: 'Credit-Notice' }],
						},
					},
				],
			},
		});

		expect(await searchTxById({ txId: recipient, getGQLData })).toMatchObject({
			node: { id: recipient, tags: [{ name: 'Type', value: 'Wallet' }] },
		});
		expect(getTransactions).toHaveBeenCalledWith({ first: 1, recipients: [recipient], includeCount: false });
	});

	it('recognizes an AO transfer recipient when no direct credit notice is indexed', async () => {
		const recipient = '4_mDz3453UAENrhbd7-L4132qZMqilcNgYYUj9f-FWg';
		const getGQLData = vi.fn().mockResolvedValue({ data: [] });
		vi.mocked(getTransactions).mockResolvedValueOnce({
			transactions: { pageInfo: { hasNextPage: false }, edges: [] },
		});
		vi.mocked(getTransactions).mockResolvedValueOnce({
			transactions: {
				pageInfo: { hasNextPage: false },
				edges: [
					{
						cursor: 'transfer',
						node: {
							id: 'MlKv6WB8KFGVXCXIzKMTw-Y7R9P7dKNkqpCW-QB8__Q',
							tags: [
								{ name: 'Action', value: 'Transfer' },
								{ name: 'Recipient', value: recipient },
							],
						},
					},
				],
			},
		});

		expect(await searchTxById({ txId: recipient, getGQLData })).toMatchObject({
			node: { id: recipient, tags: [{ name: 'Type', value: 'Wallet' }] },
		});
		expect(getTransactions).toHaveBeenLastCalledWith({
			first: 1,
			includeCount: false,
			tags: [
				{ name: 'Data-Protocol', values: ['ao'] },
				{ name: 'Type', values: ['Message'] },
				{ name: 'Action', values: ['Transfer'] },
				{ name: 'Recipient', values: [recipient] },
			],
		});
	});

	it('surfaces an endpoint failure without retrying another gateway', async () => {
		const getGQLData = vi.fn().mockRejectedValue(new Error('Gateway unavailable'));

		await expect(searchTxById({ txId, getGQLData })).rejects.toThrow('Gateway unavailable');
		expect(getGQLData.mock.calls).toEqual([[{ id: [txId] }]]);
	});
});

it('opens an Ethereum AO account without transaction or AR balance probes', async () => {
	const address = '0xEe38888888888888888888888888888888888888';
	const getGQLData = vi.fn();
	const response = await searchTxById({ txId: address, getGQLData, readProcess: vi.fn() });
	expect(response.node.id).toBe(address);
	expect(response.node.tags).toEqual([{ name: 'Type', value: 'Wallet' }]);
	expect(getGQLData).not.toHaveBeenCalled();
	expect(fetch).not.toHaveBeenCalled();
});
