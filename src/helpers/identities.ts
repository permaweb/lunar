import { secp256k1 } from '@noble/curves/secp256k1.js';
import { keccak_256 } from '@noble/hashes/sha3.js';

const ARWEAVE_ID = /^[A-Za-z0-9_-]{43}$/;
const ETHEREUM_ADDRESS = /^0x[\da-f]{40}$/i;
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export const SOLANA_MAINNET = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

export type AccountIdentity = {
	identifier: string;
	address: string;
	namespace: 'arweave' | 'eip155' | 'solana';
	reference?: string;
};

export function isArweaveId(value: unknown): boolean {
	return typeof value === 'string' && ARWEAVE_ID.test(value);
}

export function isEthereumAddress(value: unknown): boolean {
	return typeof value === 'string' && ETHEREUM_ADDRESS.test(value);
}

export function checksumEthereumAddress(address: string): string {
	if (!isEthereumAddress(address)) return address;
	const hex = address.slice(2).toLowerCase();
	const hash = Array.from(keccak_256(new TextEncoder().encode(hex)), (byte) => byte.toString(16).padStart(2, '0')).join(
		''
	);
	return `0x${Array.from(hex, (char, index) => (parseInt(hash[index], 16) >= 8 ? char.toUpperCase() : char)).join('')}`;
}

export function getEthereumOwnerAddress(key: string | null | undefined): string | null {
	if (!key || !/^[A-Za-z0-9_-]+={0,2}$/.test(key)) return null;
	try {
		const bytes = Uint8Array.from(atob(key.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0));
		if (bytes.length !== 65 || bytes[0] !== 4) return null;
		secp256k1.Point.fromBytes(bytes).assertValidity();
		const hash = keccak_256(bytes.subarray(1));
		return checksumEthereumAddress(
			`0x${Array.from(hash.slice(-20), (byte) => byte.toString(16).padStart(2, '0')).join('')}`
		);
	} catch {
		return null;
	}
}

export function encodeBase58(bytes: Uint8Array): string {
	let number = 0n;
	for (const byte of bytes) number = number * 256n + BigInt(byte);
	let encoded = '';
	while (number > 0n) {
		encoded = BASE58[Number(number % 58n)] + encoded;
		number /= 58n;
	}
	for (const byte of bytes) {
		if (byte !== 0) break;
		encoded = `1${encoded}`;
	}
	return encoded;
}

function isSolanaAddress(address: string): boolean {
	if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return false;
	let number = 0n;
	for (const char of address) number = number * 58n + BigInt(BASE58.indexOf(char));
	let size = address.match(/^1*/)[0].length;
	while (number > 0n) {
		size++;
		number >>= 8n;
	}
	return size === 32;
}

/** Host-form Arweave DIDs encode case/underscores and three resource-type bits. */
function decodeArweaveAccount(identifier: string): string | null {
	const match = /^uri-did-ar-([a-z0-9-]{43})([0-9a-z]{9})$/.exec(identifier);
	if (!match) return null;
	let bits = 0n;
	for (const char of match[2]) bits = bits * 36n + BigInt(parseInt(char, 36));
	// Odd types identify messages; 5 and 7 are reserved. Account types are 0, 2, 4, 6.
	if (bits >= 1n << 46n || (bits & 1n) !== 0n) return null;
	const bitmap = bits >> 3n;
	let address = '';
	for (let index = 0; index < 43; index++) {
		const char = match[1][index];
		const isSet = (bitmap & (1n << BigInt(42 - index))) !== 0n;
		if (isSet && /\d/.test(char)) return null;
		address += isSet ? (char === '-' ? '_' : char.toUpperCase()) : char;
	}
	// A 32-byte base64url value has zero padding bits in its final character.
	return /[AEIMQUYcgkosw048]$/.test(address) ? address : null;
}

/** Parse display information without changing the identifier used by an index or ledger. */
export function parseAccountIdentity(identifier: unknown): AccountIdentity | null {
	if (typeof identifier !== 'string') return null;
	if (isArweaveId(identifier)) return { identifier, address: identifier, namespace: 'arweave' };
	if (isEthereumAddress(identifier))
		return { identifier, address: checksumEthereumAddress(identifier), namespace: 'eip155' };
	const arweave = identifier.startsWith('did:ar:') ? identifier.slice(7) : decodeArweaveAccount(identifier);
	if (isArweaveId(arweave)) return { identifier, address: arweave, namespace: 'arweave' };
	const ethereum = /^did:pkh:eip155:1:(0x[\da-fA-F]{40})$/.exec(identifier);
	if (ethereum && checksumEthereumAddress(ethereum[1]) === ethereum[1])
		return { identifier, address: ethereum[1], namespace: 'eip155', reference: '1' };
	const solana = identifier.startsWith(`did:pkh:solana:${SOLANA_MAINNET}:`)
		? identifier.slice(`did:pkh:solana:${SOLANA_MAINNET}:`.length)
		: null;
	if (solana && isSolanaAddress(solana))
		return { identifier, address: solana, namespace: 'solana', reference: SOLANA_MAINNET };
	return null;
}
