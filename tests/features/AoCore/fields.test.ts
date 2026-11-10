import { expect, it } from 'vitest';

import { readCommitments } from '../../../src/api/aoCore';
import { getFieldCoverage, getMessageFields } from '../../../src/features/AoCore/model/fields';
import { LUNAR_BALANCES_LINK, LUNAR_LINK_HEADERS } from '../../fixtures/aoLinks';

it('recognizes the observed Lunar balance URI while retaining its received key and value', () => {
	expect(getMessageFields(LUNAR_LINK_HEADERS).find((field) => field.key === 'balances')).toEqual({
		key: 'balances',
		value: `ao:${LUNAR_BALANCES_LINK}`,
		type: 'link',
		linkId: LUNAR_BALANCES_LINK,
	});
	expect(getMessageFields([`ao:${LUNAR_BALANCES_LINK}`])[0].linkId).toBe(LUNAR_BALANCES_LINK);
});

it('leaves syntax and commitment values literal without losing historical link display', () => {
	const uri = `ao:${LUNAR_BALANCES_LINK}`;
	const fields = getMessageFields({ path: uri, hashpath: uri, commitments: uri, 'body+link': LUNAR_BALANCES_LINK });
	expect(fields.filter((field) => field.type === 'link').map((field) => field.key)).toEqual(['body+link']);
	expect(
		getMessageFields({ signature: uri, 'body+link': LUNAR_BALANCES_LINK }, true).every((field) => !field.linkId)
	).toBe(true);
});

it('counts the received field name exactly across current and historical link encodings', () => {
	const commitments = readCommitments({
		commitments: {
			current: { committed: ['balances'] },
			historical: { committed: ['balances+link'] },
		},
	});
	expect(getFieldCoverage('balances', commitments).map((entry) => entry.status)).toEqual(['listed', 'not-listed']);
	expect(getFieldCoverage('balances+link', commitments).map((entry) => entry.status)).toEqual(['not-listed', 'listed']);
});
