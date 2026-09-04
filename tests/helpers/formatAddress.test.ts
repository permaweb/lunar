import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { checkValidAddress, formatAddress } from '../../src/helpers/utils';

const ETH_ADDRESS = '0x1234567890aBcDEF1234567890AbcDef1234aBcD';
const AR_ADDRESS = 'abcde' + 'A'.repeat(33) + 'VWXYZ';

describe('formatAddress', () => {
	it('shortens ETH addresses without changing their case', () => {
		expect(formatAddress(ETH_ADDRESS, false)).toBe('0x1234...aBcD');
		expect(formatAddress(ETH_ADDRESS, true)).toBe('(0x1234...aBcD)');
		expect(formatAddress(ETH_ADDRESS.toLowerCase(), false)).toBe('0x1234...abcd');
		expect(formatAddress(ETH_ADDRESS.toUpperCase(), false)).toBe('0X1234...ABCD');
	});

	it('preserves the existing AR address format', () => {
		expect(formatAddress(AR_ADDRESS, false)).toBe('abcde...VWXYZ');
		expect(formatAddress(AR_ADDRESS, true)).toBe('(abcde...VWXYZ)');
	});

	it.each([null, ''])('preserves empty values: %s', (address) => {
		expect(formatAddress(address, false)).toBe('');
	});

	it.each(['wallet.eth', '0x1234', '0x' + 'g'.repeat(40), '0x' + '1'.repeat(38), '1'.repeat(40)])(
		'leaves non-address labels unchanged: %s',
		(address) => {
			expect(formatAddress(address, false)).toBe(address);
			expect(formatAddress(address, true)).toBe(address);
		}
	);

	it('does not broaden Arweave-only validation to accept ETH addresses', () => {
		expect(checkValidAddress(ETH_ADDRESS)).toBe(false);
	});

	it('keeps the prefix and suffix for every 40-digit hex address', () => {
		fc.assert(
			fc.property(
				fc.array(fc.constantFrom(...'0123456789abcdefABCDEF'), { minLength: 40, maxLength: 40 }),
				(characters) => {
					const address = `0x${characters.join('')}`;
					expect(formatAddress(address, false)).toBe(`${address.slice(0, 6)}...${address.slice(-4)}`);
				}
			)
		);
	});
});
