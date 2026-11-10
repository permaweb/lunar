import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { readAoBalance } from '../../src/api/balances';
import { getTransactions } from '../../src/api/blocks';
import { searchTxById } from '../../src/helpers/search';
import { isValidSearchInput } from '../../src/helpers/searchInput';
import { normalizeGqlResponse } from '../../src/helpers/utils';
import { ARWEAVE_ADDRESS, ARWEAVE_HOST, ETHEREUM_DID, HB_IDENTITY_WITNESSES, SOLANA_DID } from '../fixtures/identities';

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
	vi.useRealTimers();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	vi.clearAllMocks();
});

it('opens signed DID message metadata when the legacy scheduler never responds', async () => {
	vi.useFakeTimers();
	const target = 'p'.repeat(43);
	vi.stubGlobal(
		'fetch',
		vi.fn((input: string, init?: RequestInit) => {
			if (input.includes('su-router.ao-testnet.xyz'))
				return new Promise((_resolve, reject) => {
					init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
				});
			return Promise.resolve(
				new Response(null, {
					headers: {
						'signature-input': `sig=("type" "variant" "target");alg="ans104@1.0/ethereum";committer="${ETHEREUM_DID}"`,
						type: 'Message',
						variant: 'ao.TN.1',
						target,
					},
				})
			);
		})
	);
	const getGQLData = vi.fn();
	const pending = searchTxById({ txId, getGQLData });
	await vi.advanceTimersByTimeAsync(4_000);
	const response = await pending;
	expect(response.node.owner.address).toBe(ETHEREUM_DID);
	expect(response.node.recipient).toBe(target);
	expect(response.node.tags).toContainEqual({ name: 'type', value: 'Message' });
	expect(getGQLData).not.toHaveBeenCalled();
});

it('preserves known block and slot metadata when the scheduler is unavailable', async () => {
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 400 })));
	const edge = {
		...transaction,
		node: {
			...transaction.node,
			recipient: 'p'.repeat(43),
			slot: 5,
			tags: [
				{ name: 'Type', value: 'Message' },
				{ name: 'Variant', value: 'ao.TN.1' },
			],
		},
	};
	const response = await normalizeGqlResponse({ data: [edge], count: 1, nextCursor: null, previousCursor: null });
	expect(response.data[0].node).toMatchObject({ block: transaction.node.block, slot: 5 });
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

it.each([
	ETHEREUM_DID,
	ARWEAVE_HOST,
	`did:ar:${ARWEAVE_ADDRESS}`,
	SOLANA_DID,
	HB_IDENTITY_WITNESSES.ethereum.committer,
	HB_IDENTITY_WITNESSES.solana.committer,
	HB_IDENTITY_WITNESSES.solana.address,
])('opens the exact account identity %s without transaction or balance probes', async (identifier) => {
	const getGQLData = vi.fn();
	expect(isValidSearchInput(` ${identifier} `)).toBe(true);
	const response = await searchTxById({ txId: identifier, getGQLData });
	expect(response.node.id).toBe(identifier);
	expect(response.node.tags).toEqual([{ name: 'Type', value: 'Wallet' }]);
	expect(getGQLData).not.toHaveBeenCalled();
	expect(fetch).not.toHaveBeenCalled();
	expect(readAoBalance).not.toHaveBeenCalled();
});

it('retains a real legacy pushed notice whose trusted signer is reported as a host DID', async () => {
	const notice = HB_IDENTITY_WITNESSES.trustedNotice;
	const nativeRecipient = 'kRdpOYaT5pUUiNFDaUymqO1VcybZpAfNPnNdls-A134';
	vi.stubGlobal(
		'fetch',
		vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.includes('su-router.ao-testnet.xyz')) return new Response(null, { status: 404 });
			if (url.endsWith(`/${notice.fromProcess}`))
				return new Response(null, {
					headers: {
						'signature-input': `sig=("type" "variant" "authority");alg="ans104@1.0/rsa-pss-sha256";committer="${notice.processCommitter}"`,
						type: 'Process',
						variant: 'ao.TN.1',
						authority: notice.processAuthority,
					},
				});
			return new Response(null, {
				headers: {
					'signature-input': `sig=("type" "variant" "from-process" "pushed-for" "target");alg="ans104@1.0/rsa-pss-sha256";committer="${notice.committer}";field-target="${nativeRecipient}"`,
					type: 'Message',
					variant: 'ao.TN.1',
					'from-process': notice.fromProcess,
					'pushed-for': 'sBO6WjuQu9ov9yGlir2QaUr5Nc4HfKbIYdduOxy75Fs',
					target: nativeRecipient,
				},
			});
		})
	);
	const getGQLData = vi.fn();
	const response = await searchTxById({ txId: notice.id, getGQLData });
	expect(response?.node.id).toBe(notice.id);
	expect(response?.node.owner.address).toBe(notice.committer);
	expect(getGQLData).not.toHaveBeenCalled();
});

it.each(['did:web:example.com', ETHEREUM_DID.toLowerCase(), `${SOLANA_DID}/info`])(
	'rejects unsupported or malformed account input %s',
	(identifier) => expect(isValidSearchInput(identifier)).toBe(false)
);
