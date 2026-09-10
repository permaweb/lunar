import fc from 'fast-check';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { parseCountryDatabase } from '../../src/api/nodes/countryDatabase';
import metadata from '../../src/api/nodes/data/metadata.json';
import { countryDatabaseFixture, countryRanges } from '../fixtures/nodeCountries';

describe('client-side country database', () => {
	it('handles exact range boundaries, high IPv4 addresses, and unknown or invalid locations', () => {
		const db = parseCountryDatabase(countryDatabaseFixture());
		expect(db.lookup('8.8.8.7')).toBeNull();
		expect(db.lookup('8.8.8.8')).toBe('US');
		expect(db.lookup('8.8.8.9')).toBe('DE');
		expect(db.lookup('128.0.0.0')).toBe('CA');
		expect(db.lookup('223.255.255.255')).toBe('CA');
		for (const ip of ['10.0.0.1', '127.0.0.1', '192.168.1.1', '256.0.0.1', '008.8.8.8', '::1', 'not-an-ip']) {
			expect(db.lookup(ip)).toBeNull();
		}
	});
	it('agrees with an independent range scan for arbitrary public IPs', () => {
		const db = parseCountryDatabase(countryDatabaseFixture());
		fc.assert(
			fc.property(
				fc.constantFrom(8, 38, 88, 128, 168, 200),
				fc.tuple(fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 })),
				(first, rest) => {
					const address = first * 2 ** 24 + rest[0] * 2 ** 16 + rest[1] * 256 + rest[2];
					const expected = countryRanges.find(({ end }) => end >= address).code;
					expect(db.lookup([first, ...rest].join('.'))).toBe(expected === 'ZZ' ? null : expected);
				}
			)
		);
	});
	it('rejects truncated, oversized and corrupt databases', () => {
		const fixture = countryDatabaseFixture();
		for (const bytes of [new ArrayBuffer(0), fixture.slice(0, -1), new ArrayBuffer(2_000_001)]) {
			expect(() => parseCountryDatabase(bytes)).toThrowError(expect.objectContaining({ code: 'invalid-response' }));
		}
		for (const corrupt of [
			(view: DataView) => view.setUint32(0, 0),
			(view: DataView) => view.setUint16(4, 257, true),
			(view: DataView) => view.setUint32(6, 0, true),
			(view: DataView) => view.setUint8(10, 0),
			(view: DataView) => {
				view.setUint8(12, 90);
				view.setUint8(13, 90);
			},
			(view: DataView) => view.setUint8(22, 4),
			(view: DataView) => view.setUint32(23, 1, true),
			(view: DataView) => view.setUint32(33, 0xfffffffe, true),
		]) {
			const bytes = fixture.slice(0);
			corrupt(new DataView(bytes));
			expect(() => parseCountryDatabase(bytes)).toThrowError(expect.objectContaining({ code: 'invalid-response' }));
		}
	});
	it('ships a valid, budgeted snapshot matching its provenance checksum', () => {
		const bytes = readFileSync(new URL('../../src/api/nodes/data/ipv4-country.bin', import.meta.url));
		expect(bytes.length).toBe(metadata.bytes);
		expect(bytes.length).toBeLessThanOrEqual(2_000_000);
		expect(createHash('sha256').update(bytes).digest('hex')).toBe(metadata.sha256);
		const db = parseCountryDatabase(Uint8Array.from(bytes).buffer);
		expect(db.lookup('8.8.8.8')).toBe('US');
		expect(db.lookup('38.29.227.69')).toBe('US');
		expect(db.lookup('168.119.148.17')).toBe('DE');
	});
});
