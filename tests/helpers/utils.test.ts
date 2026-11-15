import { describe, expect, it } from 'vitest';

import { formatUnits } from '../../src/helpers/utils';

describe('formatUnits', () => {
	// Real AO transfer GhW22uT3t4eOY0xV2Eku_VAmRz1VkD7wv1FTYNdAyS8.
	it('omits the decimal point when the observed transfer rounds to a whole amount', () => {
		expect(formatUnits('5000000140064', 12)).toBe('5');
	});

	it.each<[string, number, number, string]>([
		['5000000499999', 12, 6, '5'],
		['5000000500000', 12, 6, '5.000001'],
		['5999999500000', 12, 6, '6'],
		['-5000000140064', 12, 6, '-5'],
		['5100000', 6, 0, '5'],
		['5500000', 6, 0, '6'],
		['-5500000', 6, 0, '-6'],
	])('rounds %s at denomination %i and precision %i to %s', (value, decimals, precision, expected) => {
		expect(formatUnits(value, decimals, precision)).toBe(expected);
	});

	it.each<[string, number, number, string]>([
		['5000000140064', 12, 12, '5.000000140064'],
		['1234567', 6, 6, '1.234567'],
		['9999999', 6, 6, '9.999999'],
		['1', 12, 6, '0.000000000001'],
		['-1', 12, 6, '-0.000000000001'],
		['9007199254740993123456000000', 12, 12, '9,007,199,254,740,993.123456'],
	])('preserves exact digits for %s at denomination %i and precision %i', (value, decimals, precision, expected) => {
		expect(formatUnits(value, decimals, precision)).toBe(expected);
	});

	it.each<[string, number, string]>([
		['0', 12, '0'],
		['5000000000000', 12, '5'],
		['5000', 0, '5,000'],
	])('keeps whole amount %s at denomination %i as %s', (value, decimals, expected) => {
		expect(formatUnits(value, decimals)).toBe(expected);
	});
});
