import fc from 'fast-check';
import { expect, it } from 'vitest';

import { encodeBase58, parseAccountIdentity } from '../../src/helpers/identities';
import { checkValidAddress } from '../../src/helpers/utils';
import {
	ARWEAVE_ADDRESS,
	ARWEAVE_HOST,
	ETHEREUM_ADDRESS,
	ETHEREUM_DID,
	SOLANA_ADDRESS,
	SOLANA_DID,
	SOLANA_KEY,
} from '../fixtures/identities';

it.each([
	[ARWEAVE_ADDRESS, ARWEAVE_ADDRESS, 'arweave'],
	[`did:ar:${ARWEAVE_ADDRESS}`, ARWEAVE_ADDRESS, 'arweave'],
	[ARWEAVE_HOST, ARWEAVE_ADDRESS, 'arweave'],
	[ETHEREUM_ADDRESS, ETHEREUM_ADDRESS, 'eip155'],
	[ETHEREUM_ADDRESS.toLowerCase(), ETHEREUM_ADDRESS, 'eip155'],
	[ETHEREUM_DID, ETHEREUM_ADDRESS, 'eip155'],
	[SOLANA_DID, SOLANA_ADDRESS, 'solana'],
])('extracts %s without rewriting its identifier', (identifier, address, namespace) => {
	expect(parseAccountIdentity(identifier)).toMatchObject({ identifier, address, namespace });
});

it.each([
	null,
	undefined,
	123,
	'',
	'did:web:example.com',
	`${ETHEREUM_DID}/path`,
	`${ETHEREUM_DID}?hint=x`,
	ETHEREUM_DID.toLowerCase(),
	ETHEREUM_DID.replace('eip155:1:', 'eip155:137:'),
	ARWEAVE_HOST.toUpperCase(),
	ARWEAVE_HOST.slice(0, -1),
	ARWEAVE_HOST.slice(0, -9) + 'oxyydezgg', // Bitmap exceeds 46 bits.
	ARWEAVE_HOST.slice(0, -1) + 'h', // Type 1 is a message, not an account.
	ARWEAVE_HOST.slice(0, -1) + 'l', // Reserved type 5.
	`did:pkh:solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:${'1'.repeat(33)}`,
])('does not invent an account for %s', (identifier) => {
	expect(parseAccountIdentity(identifier)).toBeNull();
});

it('does not widen the resource-ID validator', () => {
	expect(checkValidAddress(ETHEREUM_DID)).toBe(false);
	expect(checkValidAddress(ARWEAVE_HOST)).toBe(false);
});

it('uses base58, preserving leading zero bytes for Solana public keys', () => {
	expect(encodeBase58(Buffer.from(SOLANA_KEY, 'base64url'))).toBe(SOLANA_ADDRESS);
	expect(encodeBase58(new Uint8Array(32))).toBe('1'.repeat(32));
});

it('restores arbitrary Arweave addresses and every account type from host form', () => {
	fc.assert(
		fc.property(fc.uint8Array({ minLength: 32, maxLength: 32 }), fc.constantFrom(0, 2, 4, 6), (bytes, type) => {
			const address = Buffer.from(bytes).toString('base64url');
			let bitmap = 0n;
			for (const char of address) bitmap = (bitmap << 1n) | BigInt(/[A-Z_]/.test(char));
			const lower = address.toLowerCase().replace(/_/g, '-');
			const suffix = ((bitmap << 3n) | BigInt(type)).toString(36).padStart(9, '0');
			expect(parseAccountIdentity(`uri-did-ar-${lower}${suffix}`)?.address).toBe(address);
		})
	);
});
