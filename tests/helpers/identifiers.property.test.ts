import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { checkValidAddress, checkValidEthereumAddress, formatAddress } from '../../src/helpers/utils';

const arweaveCharacter = fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-');

describe('Arweave identifier validation', () => {
	it('accepts every 43-character base64url identifier', () => {
		fc.assert(
			fc.property(fc.array(arweaveCharacter, { minLength: 43, maxLength: 43 }), (characters) => {
				expect(checkValidAddress(characters.join(''))).toBe(true);
			})
		);
	});

	it('rejects identifiers with invalid characters or lengths', () => {
		fc.assert(
			fc.property(fc.string(), (candidate) => {
				const expected = /^[A-Za-z0-9_-]{43}$/.test(candidate);
				expect(checkValidAddress(candidate)).toBe(expected);
			})
		);
	});
});

describe('Address formatting', () => {
	it('shortens Ethereum-style hex addresses without treating them as Arweave ids', () => {
		// Mixed-case EIP-55 vector: distinct prefix/suffix and casing catch slicing or normalization regressions.
		const address = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';

		expect(checkValidAddress(address)).toBe(false);
		expect(checkValidEthereumAddress(address)).toBe(true);
		expect(formatAddress(address, false)).toBe('0x5aA...BeAed');
		expect(formatAddress(address, true)).toBe('(0x5aA...BeAed)');
	});
});
