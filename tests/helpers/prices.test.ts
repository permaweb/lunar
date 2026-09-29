import { expect, it } from 'vitest';

import { formatPriceChange } from '../../src/helpers/prices';

it.each([
	[2.44, '+2.44%'],
	[-1.25, '-1.25%'],
	[0, '0.00%'],
	[-0.001, '0.00%'],
	[-0.005, '-0.01%'],
	[null, null],
	[NaN, null],
	[Infinity, null],
] as const)('formats %s as %s while distinguishing unavailable movements from zero', (value, expected) => {
	expect(formatPriceChange(value)).toBe(expected);
});
