import { afterEach, describe, expect, it, vi } from 'vitest';

import { getLatestAddressSnapshot } from '../../src/api/addresses';
import { decodeWalletListChunk } from '../../src/api/addresses/arweaveAdapter';

const WALLET_LIST_ROOT = 'A'.repeat(64);
const ADDRESS = 'B'.repeat(43);
const NEXT_CURSOR = 'C'.repeat(43);
const LAST_TRANSACTION = 'E'.repeat(43);

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('Arweave address API adapter', () => {
	it('loads the latest block wallet list and keeps precision-safe positive balances', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ height: 123 }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				})
			)
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ wallet_list: WALLET_LIST_ROOT }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				})
			)
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						wallets: [
							{ address: ADDRESS, balance: '9007199254740993000000', last_tx: LAST_TRANSACTION },
							{ address: 'D'.repeat(43), balance: '0', last_tx: '' },
							{ address: '', balance: '1', last_tx: '' },
						],
						next_cursor: NEXT_CURSOR,
					}),
					{
						status: 200,
						headers: { 'Content-Type': 'application/json' },
					}
				)
			);
		vi.stubGlobal('fetch', fetchMock);

		const snapshot = await getLatestAddressSnapshot({ gateway: 'https://gateway.example/graphql' });

		expect(fetchMock).toHaveBeenNthCalledWith(1, 'https://gateway.example/info', { signal: undefined });
		expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://gateway.example/block/height/123', { signal: undefined });
		expect(fetchMock).toHaveBeenNthCalledWith(
			3,
			`https://gateway.example/wallet_list/${WALLET_LIST_ROOT}`,
			expect.objectContaining({ headers: { 'Content-Type': 'application/json' } })
		);
		expect(snapshot).toEqual({
			blockHeight: 123,
			walletListRoot: WALLET_LIST_ROOT,
			addresses: [{ address: ADDRESS, balance: '9007199254740993000000', lastTransaction: LAST_TRANSACTION }],
			nextCursor: NEXT_CURSOR,
		});
	});

	it('decodes Erlang term wallet chunks and omits non-address ledger keys', () => {
		const encoded =
			'g3QAAAACdwd3YWxsZXRzbAAAAANoAm0AAAAZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGgCbgUAACBfoBJtAAAAAGgCbQAAAABoAm4HAKGb+53FHANtAAAAAGgCbQAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgCbgYAywT7cR8BbQAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmp3C25leHRfY3Vyc29ydwRsYXN0';
		const binary = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));

		expect(decodeWalletListChunk(binary.buffer)).toEqual({
			addresses: [
				{
					address: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE',
					balance: '1234567890123',
					lastTransaction: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI',
				},
			],
			nextCursor: null,
		});
	});

	it('rejects malformed wallet list entries at the API boundary', () => {
		const malformed = new TextEncoder().encode(
			JSON.stringify({ wallets: [{ address: 'not-an-address', balance: '10' }] })
		);

		expect(() => decodeWalletListChunk(malformed.buffer)).toThrow('invalid address');
	});
});
