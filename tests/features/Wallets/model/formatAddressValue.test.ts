import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { formatTokenUsdValue } from '../../../../src/features/Wallets/model/formatAddressValue';

describe('formatTokenUsdValue', () => {
	it('formats whole and fractional balances in USD', () => {
		expect(formatTokenUsdValue('1000000000000', 2.63, 12)).toBe('$2.63');
		expect(formatTokenUsdValue('500000000000', 2.63, 12)).toBe('$1.32');
		expect(formatTokenUsdValue('1000000000000', 2.5, 12)).toBe('$2.50');
		expect(formatTokenUsdValue('1500000000000', 2.5, 12)).toBe('$3.75');
		expect(formatTokenUsdValue('1500000', 2.5, 6)).toBe('$3.75');
	});

	it('rounds USD values to cents, including small values and dollar carry', () => {
		expect(formatTokenUsdValue('1000000', 2.63, 12)).toBe('$0.00');
		expect(formatTokenUsdValue('0', 2.63, 12)).toBe('$0.00');
		expect(formatTokenUsdValue('4999999999', 1, 12)).toBe('$0.00');
		expect(formatTokenUsdValue('5000000000', 1, 12)).toBe('$0.01');
		expect(formatTokenUsdValue('1994999999999', 1, 12)).toBe('$1.99');
		expect(formatTokenUsdValue('1995000000000', 1, 12)).toBe('$2.00');
	});

	it('preserves balances larger than Number.MAX_SAFE_INTEGER', () => {
		expect(formatTokenUsdValue('9007199254740993000000', 1, 12)).toBe('$9,007,199,254.74');
		expect(formatTokenUsdValue('9007199254740993500000000000', 1, 12)).toBe('$9,007,199,254,740,993.50');
	});

	it('handles unavailable prices, invalid balances and invalid denominations', () => {
		expect(formatTokenUsdValue('1000000000000', null, 12)).toBe('-');
		expect(formatTokenUsdValue('invalid', 2.63, 12)).toBe('-');
		for (const price of [NaN, Infinity, 0, -1]) {
			expect(formatTokenUsdValue('1000000000000', price, 12)).toBe('-');
		}
		for (const denomination of [-1, 1.5, 37]) {
			expect(formatTokenUsdValue('1000000000000', 2.63, denomination)).toBe('-');
		}
	});

	it('preserves whole-token values across denominations and large atomic balances', () => {
		fc.assert(
			fc.property(
				fc.bigInt({ min: 0n, max: 2n ** 256n }),
				fc.integer({ min: 0, max: 36 }),
				fc.integer({ min: 1, max: 1000 }),
				(tokens, denomination, price) => {
					const balance = (tokens * 10n ** BigInt(denomination)).toString();
					expect(formatTokenUsdValue(balance, price, denomination)).toBe(
						`$${(tokens * BigInt(price)).toLocaleString()}.00`
					);
				}
			)
		);
	});
});
