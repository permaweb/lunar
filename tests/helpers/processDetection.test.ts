import { describe, expect, it } from 'vitest';

import { MessageVariantEnum } from '../../src/helpers/types';
import { getAoVariantFromTags, getTransactionTypeFromTags } from '../../src/helpers/utils';

describe('AO process detection', () => {
	it.each(['device', 'Device', 'DEVICE'])('recognizes %s: process@1.0 without a Variant or Type tag', (name) => {
		const tags = [
			{ name, value: 'process@1.0' },
			{ name: 'scheduler-device', value: 'arweave-scheduler@1.0' },
		];
		expect(getAoVariantFromTags(tags)).toBe(MessageVariantEnum.Mainnet);
		expect(getTransactionTypeFromTags(tags)).toBe('process');
	});

	it.each([MessageVariantEnum.Mainnet, MessageVariantEnum.Legacynet])(
		'preserves the explicit %s variant',
		(variant) => {
			const tags = [{ name: 'variant', value: variant }];
			expect(getAoVariantFromTags(tags)).toBe(variant);
			expect(getAoVariantFromTags([...tags, { name: 'device', value: 'process@1.0' }])).toBe(variant);
		}
	);

	it('does not infer mainnet from an unrelated device, scheduler, or process type', () => {
		for (const tags of [
			undefined,
			[],
			[{ name: 'Type', value: 'Process' }],
			[{ name: 'device', value: 'token@1.0' }],
			[{ name: 'scheduler-device', value: 'arweave-scheduler@1.0' }],
			[
				{ name: 'Variant', value: 'future-network' },
				{ name: 'device', value: 'process@1.0' },
			],
		]) {
			expect(getAoVariantFromTags(tags)).toBeUndefined();
		}
		expect(getTransactionTypeFromTags([{ name: 'device', value: 'token@1.0' }])).toBe('transaction');
	});

	it('preserves an explicit transaction type', () => {
		expect(
			getTransactionTypeFromTags([
				{ name: 'Type', value: 'Message' },
				{ name: 'device', value: 'process@1.0' },
			])
		).toBe('message');
	});
});
