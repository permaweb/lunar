import { parsePeerAddress } from './peerAddress.mjs';
import { NodesApiError } from './types';

const HEADER_BYTES = 10;
const RECORD_BYTES = 5;
const MAX_DATABASE_BYTES = 2_000_000;

// LNC1: country count (u16 LE), range count (u32 LE), two-letter country table,
// then sorted inclusive IPv4 range ends (u32 LE) and country indexes (u8).
// Ranges cover the full IPv4 space; ZZ means unknown, never a guessed location.
export function parseCountryDatabase(buffer: ArrayBuffer): { lookup: (ip: string) => string | null } {
	const invalid = () => {
		throw new NodesApiError('invalid-response');
	};
	if (buffer.byteLength < HEADER_BYTES || buffer.byteLength > MAX_DATABASE_BYTES) invalid();
	const data = new DataView(buffer);
	if (data.getUint32(0) !== 0x4c4e4331) invalid();
	const countryCount = data.getUint16(4, true);
	const rangeCount = data.getUint32(6, true);
	const recordsOffset = HEADER_BYTES + countryCount * 2;
	if (
		!countryCount ||
		countryCount > 256 ||
		!rangeCount ||
		recordsOffset + rangeCount * RECORD_BYTES !== buffer.byteLength
	)
		invalid();
	const countries: string[] = [];
	for (let i = 0; i < countryCount; i++) {
		const code = String.fromCharCode(data.getUint8(HEADER_BYTES + i * 2), data.getUint8(HEADER_BYTES + i * 2 + 1));
		if (!/^[A-Z]{2}$/.test(code) || countries.includes(code)) invalid();
		countries.push(code);
	}
	let previousEnd = -1;
	for (let i = 0; i < rangeCount; i++) {
		const offset = recordsOffset + i * RECORD_BYTES;
		const end = data.getUint32(offset, true);
		if (end <= previousEnd || data.getUint8(offset + 4) >= countryCount) invalid();
		previousEnd = end;
	}
	if (previousEnd !== 0xffffffff) invalid();
	return {
		lookup: (ip) => {
			if (!parsePeerAddress(`${ip}:1`)) return null;
			const address = ip.split('.').reduce((value, octet) => value * 256 + Number(octet), 0);
			let low = 0;
			let high = rangeCount - 1;
			while (low < high) {
				const middle = Math.floor((low + high) / 2);
				if (data.getUint32(recordsOffset + middle * RECORD_BYTES, true) < address) low = middle + 1;
				else high = middle;
			}
			const code = countries[data.getUint8(recordsOffset + low * RECORD_BYTES + 4)];
			return code === 'ZZ' ? null : code;
		},
	};
}
