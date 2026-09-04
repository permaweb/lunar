/**
 * Predicates as the index stores them: hashing, physical keys, row decoding
 * and the owner-address derivations that name a `committer`.
 *
 * A row is 128 bits: `key-hash:39 | value-hash:40 | offset:49`. The physical
 * key is the first 80 bits, so a predicate's 79-bit prefix spans two adjacent
 * keys (the offset's top bit clear and set); the duplicate holds the offset's
 * low 48 bits. The key hash is the leading 39 bits of SHA-256 over
 * `~match@1.0/` followed by the ASCII-lowercased name; the value hash is the
 * leading 40 bits of SHA-256 over the value as given.
 */
import { base64UrlEncode } from './weave.js';

export const KEY_HASH_BITS = 39;
export const VALUE_HASH_BITS = 40;
export const OFFSET_BITS = 49;
export const KEY_BYTES = 10;
export const DUP_BYTES = 6;
/** The greatest offset a row can carry. */
export const MAX_OFFSET = (1n << BigInt(OFFSET_BITS)) - 1n;
const NAME_SPACE = '~match@1.0/';
const LOW_48 = (1n << 48n) - 1n;
const encoder = new TextEncoder();

const K = new Uint32Array([
	0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
	0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
	0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
	0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
	0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
	0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
	0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
	0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const rotr = (x, n) => (x >>> n) | (x << (32 - n));

/** SHA-256 of bytes held in memory, synchronously (FIPS 180-4). */
export function sha256(data) {
	const h = new Uint32Array([
		0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
	]);
	// One message block per 64 bytes, plus the 0x80 terminator and the
	// 8-byte length, which may need a block of their own.
	const blocks = Math.ceil((data.length + 9) / 64);
	const padded = new Uint8Array(blocks * 64);
	padded.set(data);
	padded[data.length] = 0x80;
	const view = new DataView(padded.buffer);
	view.setUint32(padded.length - 8, Math.floor((data.length * 8) / 2 ** 32));
	view.setUint32(padded.length - 4, (data.length * 8) >>> 0);

	const w = new Uint32Array(64);
	for (let block = 0; block < blocks; block++) {
		for (let i = 0; i < 16; i++) w[i] = view.getUint32(block * 64 + i * 4);
		for (let i = 16; i < 64; i++) {
			const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
			const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
			w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
		}
		let [a, b, c, d, e, f, g, hh] = h;
		for (let i = 0; i < 64; i++) {
			const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
			const ch = (e & f) ^ (~e & g);
			const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
			const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
			const maj = (a & b) ^ (a & c) ^ (b & c);
			const t2 = (S0 + maj) >>> 0;
			hh = g; g = f; f = e;
			e = (d + t1) >>> 0;
			d = c; c = b; b = a;
			a = (t1 + t2) >>> 0;
		}
		h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
		h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
	}
	const out = new Uint8Array(32);
	const outView = new DataView(out.buffer);
	for (let i = 0; i < 8; i++) outView.setUint32(i * 4, h[i]);
	return out;
}

/** The leading `bits` of a digest as a bigint. */
function leading(digest, bits) {
	let out = 0n;
	for (let i = 0; i < bits; i++) {
		out = (out << 1n) | BigInt((digest[i >> 3] >> (7 - (i & 7))) & 1);
	}
	return out;
}

/** ASCII letters lower-cased, every other byte as it is. */
export function lowerName(name) {
	return name.replace(/[A-Z]/g, (c) => c.toLowerCase());
}

/** A bigint of `bits` bits as big-endian bytes. */
function bytesOf(value, bits) {
	const out = new Uint8Array(bits >> 3);
	let rest = value;
	for (let i = out.length - 1; i >= 0; i--) {
		out[i] = Number(rest & 0xffn);
		rest >>= 8n;
	}
	return out;
}

/** The 39-bit hash that starts every physical key for `name`. */
function nameHashOf(name) {
	return leading(sha256(encoder.encode(NAME_SPACE + lowerName(name))), KEY_HASH_BITS);
}

/** The contiguous physical-key range occupied by every value of `name`. */
export function nameRange(name) {
	const nameHash = nameHashOf(name);
	const shift = BigInt(VALUE_HASH_BITS + 1);
	const next = nameHash + 1n;
	return {
		nameHash,
		lower: bytesOf(nameHash << shift, KEY_BYTES * 8),
		upper: next < (1n << BigInt(KEY_HASH_BITS))
			? bytesOf(next << shift, KEY_BYTES * 8)
			: null,
	};
}

/** The name hash and 79-bit logical predicate prefix of a physical key. */
export function decodeKey(key) {
	const bits = bigintOf(key);
	return {
		nameHash: bits >> BigInt(VALUE_HASH_BITS + 1),
		prefix: bits >> 1n,
		offsetHigh: bits & 1n,
	};
}

/**
 * The 79-bit prefix of `name=value` and the two physical keys carrying it:
 * `key0` for offsets below 2^48 and `key1` for those at or above it.
 */
export function prefixOf(name, value) {
	const keyHash = nameHashOf(name);
	const valueHash = leading(sha256(encoder.encode(value)), VALUE_HASH_BITS);
	const bits79 = (keyHash << BigInt(VALUE_HASH_BITS)) | valueHash;
	return {
		bits79,
		key0: bytesOf(bits79 << 1n, KEY_BYTES * 8),
		key1: bytesOf((bits79 << 1n) | 1n, KEY_BYTES * 8),
	};
}

/** The two physical keys of a predicate, low offset-high first. */
export function predicateKeys(name, value) {
	const { key0, key1 } = prefixOf(name, value);
	return [key0, key1];
}

/** The physical key and duplicate a row at `offset` under `bits79` has. */
export function seekOf(bits79, offset) {
	return {
		key: bytesOf((bits79 << 1n) | (offset >> 48n), KEY_BYTES * 8),
		dup: bytesOf(offset & LOW_48, DUP_BYTES * 8),
	};
}

/** Whether a physical key's first 79 bits are `bits79`. */
export function carriesPrefix(key, bits79) {
	return (bigintOf(key) >> 1n) === bits79;
}

/** The 49-bit offset a row holds: the key's low bit above the duplicate. */
export function decodeRow(key, dup) {
	return (BigInt(key[KEY_BYTES - 1] & 1) << 48n) | bigintOf(dup);
}

function bigintOf(bytes) {
	let out = 0n;
	for (const b of bytes) out = (out << 8n) | BigInt(b);
	return out;
}

/* Keccak-256, for the Ethereum form of a secp256k1 owner. */
const RC = [
	0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
	0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
	0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
	0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
	0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
	0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];
const ROT = [[0, 36, 3, 41, 18], [1, 44, 10, 45, 2], [62, 6, 43, 15, 61], [28, 55, 25, 21, 56], [27, 20, 39, 8, 14]];
const M64 = (1n << 64n) - 1n;

const rol = (v, n) => n ? ((v << BigInt(n)) | (v >> BigInt(64 - n))) & M64 : v;

function keccakF(a) {
	for (const rc of RC) {
		const c = [];
		for (let x = 0; x < 5; x++) c[x] = a[x] ^ a[x + 5] ^ a[x + 10] ^ a[x + 15] ^ a[x + 20];
		const d = [];
		for (let x = 0; x < 5; x++) d[x] = c[(x + 4) % 5] ^ rol(c[(x + 1) % 5], 1);
		a = a.map((v, i) => v ^ d[i % 5]);
		const b = new Array(25).fill(0n);
		for (let x = 0; x < 5; x++) {
			for (let y = 0; y < 5; y++) b[y + 5 * ((2 * x + 3 * y) % 5)] = rol(a[x + 5 * y], ROT[x][y]);
		}
		a = b.map((v, i) => {
			const row = 5 * Math.floor(i / 5);
			return v ^ ((~b[(i % 5 + 1) % 5 + row]) & M64 & b[(i % 5 + 2) % 5 + row]);
		});
		a[0] ^= rc;
	}
	return a;
}

/** Keccak-256 (the pre-FIPS padding Ethereum uses) of bytes in memory. */
export function keccak256(msg) {
	const rate = 136;
	let a = new Array(25).fill(0n);
	const padded = new Uint8Array(msg.length + rate - (msg.length % rate));
	padded.set(msg);
	padded[msg.length] ^= 0x01;
	padded[padded.length - 1] ^= 0x80;
	for (let off = 0; off < padded.length; off += rate) {
		for (let i = 0; i < rate / 8; i++) {
			let lane = 0n;
			for (let j = 7; j >= 0; j--) lane = (lane << 8n) | BigInt(padded[off + 8 * i + j]);
			a[i] ^= lane;
		}
		a = keccakF(a);
	}
	const out = new Uint8Array(32);
	for (let i = 0; i < 4; i++) {
		let lane = a[i];
		for (let j = 0; j < 8; j++) {
			out[8 * i + j] = Number(lane & 0xffn);
			lane >>= 8n;
		}
	}
	return out;
}

const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

/** The EIP-55 checksummed form of a 20-byte address. */
export function eip55(addr20) {
	const h = hex(addr20);
	const k = hex(keccak256(encoder.encode(h)));
	let out = '0x';
	for (let i = 0; i < h.length; i++) out += parseInt(k[i], 16) >= 8 ? h[i].toUpperCase() : h[i];
	return out;
}

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function base58Encode(raw) {
	let n = bigintOf(raw);
	let out = '';
	while (n > 0n) {
		out = B58[Number(n % 58n)] + out;
		n /= 58n;
	}
	let zeros = 0;
	while (zeros < raw.length && raw[zeros] === 0) zeros++;
	return '1'.repeat(zeros) + out;
}

/**
 * The address the index files an owner under, by ANS-104 signature type:
 * RSA (1) and ed25519 (2) hash the key (base64url of its SHA-256),
 * secp256k1 (3) and typed Ethereum (7) take the EIP-55 form of the keccak
 * of the owner past its first byte (the uncompressed point for 3; for 7 the
 * 41 bytes after the first of its 42, as hb_keccak:key_to_ethereum_address
 * derives it in the indexer), and Solana (4) writes the key in base58.
 */
export function ownerAddress(ownerKey, signatureType) {
	switch (signatureType) {
		case 3:
			if (ownerKey.length !== 65 || ownerKey[0] !== 4) throw new Error('not an uncompressed secp256k1 key');
			return eip55(keccak256(ownerKey.subarray(1)).subarray(12));
		case 7:
			if (ownerKey.length !== 42) throw new Error('not a typed-ethereum owner');
			return eip55(keccak256(ownerKey.subarray(1)).subarray(12));
		case 4:
			return base58Encode(ownerKey);
		default:
			return base64UrlEncode(sha256(ownerKey));
	}
}
