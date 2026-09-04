import { describe, expect, it } from 'vitest';

import { isPaginationSourceCurrent } from '../../src/helpers/query';

describe('GraphQL pagination source', () => {
	it('treats existing unmarked pagination URLs as remote', () => {
		const params = new URLSearchParams('txAfter=remote-cursor&txPage=2');

		expect(isPaginationSourceCurrent(params, 'txSource', 'remote')).toBe(true);
		expect(isPaginationSourceCurrent(params, 'txSource', 'ar-lmdb')).toBe(false);
	});

	it.each(['remote', 'ar-lmdb'])('reuses pagination only for its recorded %s source', (source) => {
		const params = new URLSearchParams({ txSource: source, txAfter: 'cursor' });

		expect(isPaginationSourceCurrent(params, 'txSource', source)).toBe(true);
		expect(isPaginationSourceCurrent(params, 'txSource', source === 'remote' ? 'ar-lmdb' : 'remote')).toBe(false);
	});

	it('keeps independently scoped lists separate', () => {
		const params = new URLSearchParams('messageSource=ar-lmdb&bundleTxSource=remote');

		expect(isPaginationSourceCurrent(params, 'messageSource', 'ar-lmdb')).toBe(true);
		expect(isPaginationSourceCurrent(params, 'bundleTxSource', 'ar-lmdb')).toBe(false);
	});
});
