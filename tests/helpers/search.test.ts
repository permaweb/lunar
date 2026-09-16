import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { readAoBalance } from '../../src/api/balances';
import { searchTxById } from '../../src/helpers/search';

vi.mock('api/balances', () => ({ readAoBalance: vi.fn() }));

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
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	vi.clearAllMocks();
});

describe('transaction gateway lookup', () => {
	it('returns a result from the configured gateway without querying another gateway', async () => {
		const getGQLData = vi.fn().mockResolvedValue({ data: [transaction] });

		expect(await searchTxById({ txId, getGQLData })).toMatchObject(transaction);
		expect(getGQLData.mock.calls).toEqual([[{ id: [txId] }]]);
	});

	it.each(['empty', 'error'])('goes directly to arweave.net after an %s result', async (result) => {
		const getGQLData = vi.fn();
		if (result === 'empty') getGQLData.mockResolvedValueOnce({ data: [] });
		else getGQLData.mockRejectedValueOnce(new Error('Gateway unavailable'));
		getGQLData.mockResolvedValueOnce({ data: [transaction] });

		expect(await searchTxById({ txId, getGQLData })).toMatchObject(transaction);
		expect(getGQLData.mock.calls).toEqual([[{ id: [txId] }], [{ gateway: 'https://arweave.net/graphql', id: [txId] }]]);
	});

	it('checks wallet activity after both transaction lookups are empty', async () => {
		const getGQLData = vi
			.fn()
			.mockResolvedValueOnce({ data: [] })
			.mockResolvedValueOnce({ data: [] })
			.mockResolvedValueOnce({ data: [transaction] });

		expect(await searchTxById({ txId, getGQLData })).toMatchObject({
			node: { id: txId, tags: [{ name: 'Type', value: 'Wallet' }] },
		});
		expect(getGQLData.mock.calls).toEqual([
			[{ id: [txId] }],
			[{ gateway: 'https://arweave.net/graphql', id: [txId] }],
			[{ owners: [txId] }],
		]);
	});

	it('returns null when neither a transaction nor wallet activity exists', async () => {
		const getGQLData = vi.fn().mockResolvedValue({ data: [] });

		expect(await searchTxById({ txId, getGQLData })).toBeNull();
		expect(getGQLData.mock.calls).toEqual([
			[{ id: [txId] }],
			[{ gateway: 'https://arweave.net/graphql', id: [txId] }],
			[{ owners: [txId] }],
		]);
		expect(readAoBalance).toHaveBeenCalledWith(txId);
	});

	it('surfaces gateway failure after exhausting the remaining transaction lookups', async () => {
		const getGQLData = vi.fn().mockRejectedValue(new Error('Gateway unavailable'));

		await expect(searchTxById({ txId, getGQLData })).rejects.toThrow('Gateway unavailable');
		expect(getGQLData.mock.calls).toEqual([[{ id: [txId] }], [{ gateway: 'https://arweave.net/graphql', id: [txId] }]]);
	});
});
