// A small database with a one-address US range to exercise inclusive boundaries.
export const countryRanges = [
	{ end: 0x08080807, code: 'ZZ' },
	{ end: 0x08080808, code: 'US' },
	{ end: 0x7fffffff, code: 'DE' },
	{ end: 0xffffffff, code: 'CA' },
];

export function countryDatabaseFixture(): ArrayBuffer {
	const countries = ['ZZ', 'US', 'DE', 'CA'];
	const bytes = new ArrayBuffer(10 + countries.length * 2 + countryRanges.length * 5);
	const view = new DataView(bytes);
	view.setUint32(0, 0x4c4e4331);
	view.setUint16(4, countries.length, true);
	view.setUint32(6, countryRanges.length, true);
	countries.forEach((code, index) => {
		view.setUint8(10 + index * 2, code.charCodeAt(0));
		view.setUint8(11 + index * 2, code.charCodeAt(1));
	});
	countryRanges.forEach(({ end, code }, index) => {
		view.setUint32(18 + index * 5, end, true);
		view.setUint8(22 + index * 5, countries.indexOf(code));
	});
	return bytes;
}
