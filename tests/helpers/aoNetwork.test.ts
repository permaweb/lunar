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
it.each([
	'',
	'http://remote.example',
	'https://user:secret@example.com',
	'https://example.com/process',
	'https://example.com?token=x',
	'https://example.com#path',
	Array(9).fill('https://example.com'),
])('rejects invalid peer configuration %j', (value) => {
	expect(parseAoPeers(value)).toBeNull();
});
