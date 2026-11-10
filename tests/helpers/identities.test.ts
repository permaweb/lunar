import fc from 'fast-check';
import { expect, it } from 'vitest';

import { encodeBase58, parseAccountIdentity, sameAccountIdentity, SOLANA_MAINNET } from '../../src/helpers/identities';
import { checkValidAddress } from '../../src/helpers/utils';
import {
	ARWEAVE_ADDRESS,
	ARWEAVE_HOST,
	ETHEREUM_ADDRESS,
	ETHEREUM_DID,
	HB_IDENTITY_WITNESSES,
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
	[HB_IDENTITY_WITNESSES.ethereum.committer, HB_IDENTITY_WITNESSES.ethereum.address, 'eip155'],
	[HB_IDENTITY_WITNESSES.solana.committer, HB_IDENTITY_WITNESSES.solana.address, 'solana'],
	[HB_IDENTITY_WITNESSES.solana.address, HB_IDENTITY_WITNESSES.solana.address, 'solana'],
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
	HB_IDENTITY_WITNESSES.ethereum.committer.toUpperCase(),
	HB_IDENTITY_WITNESSES.ethereum.committer.replace('eip155-1-', 'eip155-137-'),
	HB_IDENTITY_WITNESSES.ethereum.committer.replace('0x9340', '0x934A'),
	`${HB_IDENTITY_WITNESSES.solana.committer}/info`,
	`${HB_IDENTITY_WITNESSES.solana.committer}?hint=x`,
	HB_IDENTITY_WITNESSES.solana.committer.replace('solana-ggu', 'solana-Ggu'),
	HB_IDENTITY_WITNESSES.solana.committer.slice(0, -9) + 'zzzzzzzzz',
])('does not invent an account for %s', (identifier) => {
	expect(parseAccountIdentity(identifier)).toBeNull();
});

it('does not widen the resource-ID validator', () => {
	expect(checkValidAddress(ETHEREUM_DID)).toBe(false);
	expect(checkValidAddress(ARWEAVE_HOST)).toBe(false);
	expect(checkValidAddress(HB_IDENTITY_WITNESSES.ethereum.committer)).toBe(false);
	expect(checkValidAddress(HB_IDENTITY_WITNESSES.solana.committer)).toBe(false);
	expect(checkValidAddress(HB_IDENTITY_WITNESSES.solana.address)).toBe(false);
});

it.each([
	[HB_IDENTITY_WITNESSES.process.address, HB_IDENTITY_WITNESSES.process.committer],
	[HB_IDENTITY_WITNESSES.trustedNotice.address, HB_IDENTITY_WITNESSES.trustedNotice.committer],
	[HB_IDENTITY_WITNESSES.ethereum.address, HB_IDENTITY_WITNESSES.ethereum.committer],
	[HB_IDENTITY_WITNESSES.ethereum.address.toLowerCase(), HB_IDENTITY_WITNESSES.ethereum.committer],
	[HB_IDENTITY_WITNESSES.solana.address, HB_IDENTITY_WITNESSES.solana.committer],
	[ARWEAVE_ADDRESS, `did:ar:${ARWEAVE_ADDRESS}`],
	[ETHEREUM_ADDRESS, ETHEREUM_DID],
	[SOLANA_DID, SOLANA_DID],
])('compares account representations %s and %s without rewriting them', (left, right) => {
	expect(sameAccountIdentity(left, right)).toBe(true);
	expect(sameAccountIdentity(right, left)).toBe(true);
});

it.each([
	[null, null],
	[undefined, undefined],
	['did:web:example.com', 'did:web:example.com'],
	[HB_IDENTITY_WITNESSES.process.address.toLowerCase(), HB_IDENTITY_WITNESSES.process.committer],
	[HB_IDENTITY_WITNESSES.solana.address.toLowerCase(), HB_IDENTITY_WITNESSES.solana.committer],
	[HB_IDENTITY_WITNESSES.ethereum.address, ETHEREUM_DID],
	[`did:ar:${SOLANA_ADDRESS}`, SOLANA_DID],
	[`${HB_IDENTITY_WITNESSES.ethereum.committer}?hint=x`, HB_IDENTITY_WITNESSES.ethereum.address],
])('keeps invalid, different, and differently namespaced accounts distinct: %s / %s', (left, right) => {
	expect(sameAccountIdentity(left, right)).toBe(false);
	expect(sameAccountIdentity(right, left)).toBe(false);
});

it('keeps ambiguous 43-character input in the existing resource namespace', () => {
	expect(parseAccountIdentity(SOLANA_ADDRESS)?.namespace).toBe('arweave');
	expect(parseAccountIdentity(SOLANA_DID)?.namespace).toBe('solana');
});

it('rejects a Solana host bitmap that assigns uppercase to a digit', () => {
	const lower = HB_IDENTITY_WITNESSES.solana.address.toLowerCase();
	const digitIndex = lower.indexOf('2');
	const bitmap = (1n << BigInt(lower.length - 1 - digitIndex)).toString(36).padStart(9, '0');
	expect(parseAccountIdentity(`uri-did-pkh-solana-${lower}${bitmap}`)).toBeNull();
});

it('restores arbitrary Solana account case from a host URI', () => {
	fc.assert(
		fc.property(fc.uint8Array({ minLength: 32, maxLength: 32 }), (bytes) => {
			const address = encodeBase58(bytes);
			let bitmap = 0n;
			for (const char of address) bitmap = (bitmap << 1n) | BigInt(/[A-Z]/.test(char));
			const suffix = bitmap.toString(36).padStart(9, '0');
			const identifier = `uri-did-pkh-solana-${address.toLowerCase()}${suffix}`;
			expect(parseAccountIdentity(identifier)).toEqual({
				identifier,
				address,
				namespace: 'solana',
				reference: SOLANA_MAINNET,
			});
		})
	);
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
