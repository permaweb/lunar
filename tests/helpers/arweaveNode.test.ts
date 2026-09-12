import { describe, expect, it } from 'vitest';

import { normalizeArweaveNode } from '../../src/helpers/arweaveNode';

describe('Arweave node normalization', () => {
	it.each([
		['arweave.net', 'https://arweave.net'],
		['arweave.net/', 'https://arweave.net'],
		['sfo-1.na-west-1.arweave.net', 'https://sfo-1.na-west-1.arweave.net'],
		['https://arweave.net', 'https://arweave.net'],
		['http://arweave.net', 'http://arweave.net'],
	])('reads the scheme-less gateway %s over HTTPS so it is not relayed', (input, expected) => {
		expect(normalizeArweaveNode(input)).toBe(expected);
	});

	it.each([
		['1.2.3.4', 'http://1.2.3.4'],
		['1.2.3.4:1984', 'http://1.2.3.4:1984'],
		['[2001:db8::1]:1984', 'http://[2001:db8::1]:1984'],
		['localhost', 'http://localhost'],
		['localhost:1984', 'http://localhost:1984'],
		['node.example:1984', 'http://node.example:1984'],
	])('keeps the announced peer %s on HTTP', (input, expected) => {
		expect(normalizeArweaveNode(input)).toBe(expected);
	});

	it.each(['', 'C0il3g5D1ix_2h91b7vpkmcPw4cPyudIhaj7_oNsQP8', '1999060', 'ftp://arweave.net', 'arweave.net/info'])(
		'rejects %s',
		(input) => {
			expect(normalizeArweaveNode(input)).toBeNull();
		}
	);
});
