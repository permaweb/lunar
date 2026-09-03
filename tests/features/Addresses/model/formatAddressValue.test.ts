import { describe, expect, it } from 'vitest';

import { formatArUsdValue } from '../../../../src/features/Addresses/model/formatAddressValue';

describe('formatArUsdValue', () => {
	it('formats whole and fractional AR balances in USD', () => {
		expect(formatArUsdValue('1000000000000', 2.63)).toBe('$2.63');
		expect(formatArUsdValue('500000000000', 2.63)).toBe('$1.315');
	});

	it('keeps useful precision for small USD values', () => {
		expect(formatArUsdValue('1000000', 2.63)).toBe('$0.00000263');
	});

	it('preserves balances larger than Number.MAX_SAFE_INTEGER', () => {
		expect(formatArUsdValue('9007199254740993000000', 1)).toBe('$9,007,199,254.740993');
	});

	it('handles unavailable prices and invalid balances', () => {
		expect(formatArUsdValue('1000000000000', null)).toBe('-');
		expect(formatArUsdValue('invalid', 2.63)).toBe('-');
	});
});
