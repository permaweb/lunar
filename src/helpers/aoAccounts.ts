import { secp256k1 } from '@noble/curves/secp256k1.js';
import { keccak_256 } from '@noble/hashes/sha3.js';

import type { TagType } from './types';
import { checkValidAddress, checkValidEthereumAddress, getTagValue } from './utils';

export function checkValidAoAccount(address: string | null) {
	return checkValidAddress(address) || checkValidEthereumAddress(address);
}

export function checksumEthereumAddress(address: string): string {
	if (!checkValidEthereumAddress(address)) return address;
	const hex = address.slice(2).toLowerCase();
	const checksum = Array.from(keccak_256(new TextEncoder().encode(hex)), (byte) =>
		byte.toString(16).padStart(2, '0')
	).join('');
	return `0x${Array.from(hex, (char, index) => (parseInt(checksum[index], 16) >= 8 ? char.toUpperCase() : char)).join(
		''
	)}`;
}

// ANS-104 Ethereum owners are uncompressed secp256k1 public keys encoded as base64url.
export function getEthereumOwnerAddress(key: string | null | undefined): string | null {
	if (!key || !/^[A-Za-z0-9_-]+={0,2}$/.test(key)) return null;
	try {
		const decoded = atob(key.replace(/-/g, '+').replace(/_/g, '/'));
		const bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
		if (bytes.length !== 65 || bytes[0] !== 4) return null;
		secp256k1.Point.fromBytes(bytes).assertValidity();
		const hash = keccak_256(bytes.subarray(1));
		const address = Array.from(hash.slice(-20), (byte) => byte.toString(16).padStart(2, '0')).join('');
		return checksumEthereumAddress(`0x${address}`);
	} catch {
		return null;
	}
}

export function getAoSender(
	transaction:
		| {
				owner?: { address?: string | null; key?: string | null } | null;
				tags?: TagType[] | null;
		  }
		| null
		| undefined
): string | null {
	return (
		getTagValue(transaction?.tags ?? [], 'From-Process') ??
		getEthereumOwnerAddress(transaction?.owner?.key) ??
		(transaction?.owner?.address ? checksumEthereumAddress(transaction.owner.address) : null) ??
		null
	);
}
