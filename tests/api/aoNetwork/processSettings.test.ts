// @vitest-environment jsdom
import fc from 'fast-check';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import {
	getAoReadTransport,
	readProcessReadPreferences,
	writeProcessReadPreferences,
} from '../../../src/api/aoNetwork';
import { DEFAULT_AO_NETWORK } from '../../../src/helpers/aoNetwork';

const first = 'a'.repeat(43);
const second = 'b'.repeat(43);
const key = (id: string) => `lunar:ao-mainnet:process-read:v1:${id}`;
const preferences = { useGlobal: false, network: { ...DEFAULT_AO_NETWORK, peers: ['http://173.255.230.49:10000'] } };
beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

it('persists separate versioned preferences for each process without changing unrelated storage', () => {
	localStorage.setItem('settings', 'global preferences');
	expect(readProcessReadPreferences(first)).toBeNull();
	expect(writeProcessReadPreferences(first, preferences)).toBe(true);
	expect(readProcessReadPreferences(first)).toEqual(preferences);
	expect(readProcessReadPreferences(second)).toBeNull();
	expect(JSON.parse(localStorage.getItem(key(first)))).toMatchObject({ version: 1, updatedAt: expect.any(Number) });
	expect(localStorage.getItem('settings')).toBe('global preferences');
	const other = { useGlobal: true, network: DEFAULT_AO_NETWORK };
	writeProcessReadPreferences(second, other);
	expect(readProcessReadPreferences(first)).toEqual(preferences);
	expect(readProcessReadPreferences(second)).toEqual(other);
});

it.each([
	'{broken',
	'{}',
	'{"version":2,"preferences":{}}',
	JSON.stringify({
		version: 1,
		preferences: { useGlobal: false, network: { ...DEFAULT_AO_NETWORK, peers: ['ftp://invalid.example'] } },
	}),
])('falls back from corrupt or invalid saved preferences: %s', (saved) => {
	localStorage.setItem(key(first), saved);
	expect(readProcessReadPreferences(first)).toBeNull();
});

it('does not throw for arbitrary persisted JSON', () => {
	fc.assert(
		fc.property(fc.jsonValue(), (value) => {
			localStorage.setItem(key(first), JSON.stringify(value));
			expect(() => readProcessReadPreferences(first)).not.toThrow();
		})
	);
});

it('rejects malformed process IDs and settings before writing', () => {
	expect(writeProcessReadPreferences('../other', preferences)).toBe(false);
	expect(writeProcessReadPreferences(first, { ...preferences, network: { ...DEFAULT_AO_NETWORK, peers: [] } })).toBe(
		false
	);
	expect(localStorage.length).toBe(0);
});

it('handles unavailable browser storage', () => {
	vi.stubGlobal('localStorage', {
		getItem: () => {
			throw new Error('blocked');
		},
		setItem: () => {
			throw new Error('quota');
		},
	});
	expect(readProcessReadPreferences(first)).toBeNull();
	expect(writeProcessReadPreferences(first, preferences)).toBe(false);
});

it('retains separate transport instances when global and process networks alternate', () => {
	const global = getAoReadTransport(DEFAULT_AO_NETWORK);
	const custom = getAoReadTransport(preferences.network);
	expect(custom).not.toBe(global);
	expect(getAoReadTransport(DEFAULT_AO_NETWORK)).toBe(global);
	expect(getAoReadTransport(preferences.network)).toBe(custom);
});
