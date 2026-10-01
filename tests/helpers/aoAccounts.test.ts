import { describe, expect, it } from 'vitest';

import { checksumEthereumAddress, checkValidAoAccount, getAoSender } from '../../src/helpers/aoAccounts';
import { isValidSearchInput } from '../../src/helpers/searchInput';
import { getTokenTransfer } from '../../src/helpers/tokens';

// secp256k1 generator: public key for private scalar 1, a standard public test vector.
const key = btoa(
	String.fromCharCode(
		...Uint8Array.from(
			'0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8'.match(
				/../g
			)!,
			(byte) => parseInt(byte, 16)
		)
	)
);
const address = '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf';
const owner = { key: key.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), address: 'a'.repeat(43) };

describe('AO accounts', () => {
	it('uses checksum casing for the reported sender even without a public key', () => {
		const expected = '0xEe38CE326436DaC443245F7416e4Ea25fD17C3E4';
		expect(checksumEthereumAddress(expected.toLowerCase())).toBe(expected);
		expect(checksumEthereumAddress(expected)).toBe(expected);
		expect(getAoSender({ owner: { address: expected.toLowerCase() } })).toBe(expected);
		expect(
			getAoSender({ owner: { address: expected.toLowerCase() }, tags: [{ name: 'From-Process', value: 'process' }] })
		).toBe('process');
	});

	it('accepts Ethereum accounts for search without accepting malformed addresses', () => {
		expect(checkValidAoAccount(address)).toBe(true);
		expect(isValidSearchInput(` ${address} `)).toBe(true);
		expect(checkValidAoAccount('a'.repeat(43))).toBe(true);
		expect(checkValidAoAccount(address.slice(0, -1))).toBe(false);
		expect(checkValidAoAccount(`0x${'g'.repeat(40)}`)).toBe(false);
	});
	it('derives the execution address and uses it for token transfers', () => {
		const transaction = {
			owner,
			recipient: 'token',
			tags: [
				{ name: 'Action', value: 'Transfer' },
				{ name: 'Recipient', value: 'recipient' },
				{ name: 'Quantity', value: '100' },
			],
		};
		expect(getAoSender(transaction)).toBe(address);
		expect(getTokenTransfer(transaction)?.from).toBe(address);
	});
	it('preserves From-Process and falls back for RSA or malformed keys', () => {
		expect(getAoSender({ owner, tags: [{ name: 'from-process', value: 'process' }] })).toBe('process');
		for (const invalidKey of ['!', btoa('rsa public key'), btoa(String.fromCharCode(4) + '\x00'.repeat(64))]) {
			expect(getAoSender({ owner: { ...owner, key: invalidKey } })).toBe(owner.address);
		}
		expect(getAoSender(null)).toBeNull();
	});
});
