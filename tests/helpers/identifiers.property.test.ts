import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { checkValidAddress } from '../../src/helpers/utils';

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
