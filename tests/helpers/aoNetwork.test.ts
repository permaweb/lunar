import fc from 'fast-check';
import { expect, it } from 'vitest';

import { DEFAULT_AO_NETWORK, parseAoPeers, restoreAoNetwork } from '../../src/helpers/aoNetwork';

it('migrates old preferences without using the saved AOS node as a peer', () => {
	expect(restoreAoNetwork(undefined)).toEqual(DEFAULT_AO_NETWORK);
	expect(restoreAoNetwork({ peers: ['javascript:alert(1)'], preferPermawebOS: false })).toEqual({
		...DEFAULT_AO_NETWORK,
		preferPermawebOS: false,
	});
});
it('normalizes and deduplicates peer origins', () => {
	expect(parseAoPeers('https://alpha.example/, https://charlie.example https://alpha.example')).toEqual([
		'https://alpha.example',
		'https://charlie.example',
	]);
	expect(parseAoPeers('http://localhost:8734')).toEqual(['http://localhost:8734']);
});
it.each(['http://173.255.230.49:10000/', 'http://remote.example/', 'http://[2001:db8::1]:10000/'])(
	'accepts remote HTTP peer origins: %s',
	(peer) => {
		expect(parseAoPeers(peer)).toEqual([peer.slice(0, -1)]);
	}
);
it('preserves HTTP peer settings when restoring saved preferences', () => {
	const network = { peers: ['http://173.255.230.49:10000'], preferPermawebOS: false, fallbackToPeers: true };
	expect(restoreAoNetwork(network)).toEqual(network);
});
it('normalizes HTTP and HTTPS IP origins without changing their protocol or port', () => {
	fc.assert(
		fc.property(fc.constantFrom('http', 'https'), fc.ipV4(), fc.integer({ min: 1, max: 65535 }), (scheme, ip, port) => {
			const peer = `${scheme}://${ip}:${port}`;
			expect(parseAoPeers(`  ${peer}/, ${peer}  `)).toEqual([new URL(peer).origin]);
		})
	);
});
it.each([
	'',
	'ftp://remote.example',
	'javascript:alert(1)',
	'http://user:secret@example.com',
	'http://173.255.230.49:10000/process',
	'http://173.255.230.49:10000?token=x',
	'http://173.255.230.49:10000#path',
	'https://user:secret@example.com',
	'https://example.com/process',
	'https://example.com?token=x',
	'https://example.com#path',
	Array(9).fill('https://example.com'),
])('rejects invalid peer configuration %j', (value) => {
	expect(parseAoPeers(value)).toBeNull();
});
