import { describe, expect, it } from 'vitest';

import { PROCESSES } from '../../src/helpers/config';
import { MessageVariantEnum } from '../../src/helpers/types';
import { getTagValue, isTransferAction, shouldHydrateAoTransferNotices } from '../../src/helpers/utils';

describe('token transfer detection', () => {
	it.each(['Transfer', 'transfer', 'TRANSFER'])('recognizes the %s action', (action) => {
		expect(isTransferAction(action)).toBe(true);
	});

	it.each([null, undefined, '', 'Transfer-Error', 'Credit-Notice', 'Eval'])('rejects %s', (action) => {
		expect(isTransferAction(action)).toBe(false);
	});

	it('recognizes a HyperBEAM L1 transfer with lowercase tags', () => {
		const tags = [
			{ name: 'action', value: 'transfer' },
			{ name: 'recipient', value: 'n6QjVXFWUMHUIgNL6E7tEAHGGbKc2jFwW4bU-LYNbDU' },
			{ name: 'quantity', value: '1000000000000' },
		];

		expect(isTransferAction(getTagValue(tags, 'Action'))).toBe(true);
		expect(getTagValue(tags, 'Recipient')).toBe('n6QjVXFWUMHUIgNL6E7tEAHGGbKc2jFwW4bU-LYNbDU');
		expect(getTagValue(tags, 'Quantity')).toBe('1000000000000');
	});

	it('hydrates legacy AO transfer notices regardless of action case', () => {
		for (const action of ['Transfer', 'transfer']) {
			expect(
				shouldHydrateAoTransferNotices({
					action: action,
					variant: MessageVariantEnum.Legacynet,
					recipient: PROCESSES.ao,
				})
			).toBe(true);
		}
	});
});
