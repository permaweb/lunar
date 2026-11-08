import fc from 'fast-check';
import { expect, it } from 'vitest';

import { readAoLinkId, readMessageLinkId } from '../../src/helpers/aoLinks';
import { isArweaveId } from '../../src/helpers/identities';
import { LUNAR_BALANCES_LINK } from '../fixtures/aoLinks';

it('reads the current URI and historical field forms without changing the ID contract', () => {
	expect(readAoLinkId(`ao:${LUNAR_BALANCES_LINK}`)).toBe(LUNAR_BALANCES_LINK);
	expect(readMessageLinkId('balances', `ao:${LUNAR_BALANCES_LINK}`)).toBe(LUNAR_BALANCES_LINK);
	expect(readMessageLinkId('balances+link', LUNAR_BALANCES_LINK)).toBe(LUNAR_BALANCES_LINK);
	expect(readMessageLinkId('balances+link', `ao:${LUNAR_BALANCES_LINK}`)).toBe(LUNAR_BALANCES_LINK);
	expect(readMessageLinkId('balances', LUNAR_BALANCES_LINK)).toBeNull();
	expect(isArweaveId(`ao:${LUNAR_BALANCES_LINK}`)).toBe(false);
});

it.each([
	null,
	42,
	LUNAR_BALANCES_LINK,
	`AO:${LUNAR_BALANCES_LINK}`,
	` ao:${LUNAR_BALANCES_LINK}`,
	`ao:${LUNAR_BALANCES_LINK} `,
	`ao:${LUNAR_BALANCES_LINK}/path`,
	`ao:${LUNAR_BALANCES_LINK}?hint=other`,
	`ao:${LUNAR_BALANCES_LINK}=`,
	`ao:${'x'.repeat(42)}`,
	`ao:${'x'.repeat(44)}`,
	`ao:${'*'.repeat(43)}`,
])('does not turn %j into an AO resource ID', (value) => {
	expect(readAoLinkId(value)).toBeNull();
});

it('keeps syntax and commitment metadata literal, including historical linked commitment records', () => {
	for (const key of ['path', 'hashpath', 'priv', 'private-key', 'commitments']) {
		expect(readMessageLinkId(key, `ao:${LUNAR_BALANCES_LINK}`)).toBeNull();
	}
	expect(readMessageLinkId('signature', `ao:${LUNAR_BALANCES_LINK}`, true)).toBeNull();
	expect(readMessageLinkId('body+link', LUNAR_BALANCES_LINK, true)).toBeNull();
	expect(readMessageLinkId('commitments+link', LUNAR_BALANCES_LINK)).toBe(LUNAR_BALANCES_LINK);
});

it('preserves every accepted identifier while rejecting appended path syntax', () => {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'.split('');
	fc.assert(
		fc.property(fc.array(fc.constantFrom(...characters), { minLength: 43, maxLength: 43 }), (parts) => {
			const id = parts.join('');
			expect(readAoLinkId(`ao:${id}`)).toBe(id);
			expect(readAoLinkId(`ao:${id}/now`)).toBeNull();
		})
	);
});
