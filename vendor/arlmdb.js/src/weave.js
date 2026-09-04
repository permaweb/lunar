/**
 * Arweave protocol primitives: base64url, Merkle data-path validation, and
 * ANS-104 data items.
 *
 * Ported from the reference implementations (ar_merkle.erl, ar_bundles.erl).
 * Merkle nodes are SHA-256 over the hashes of their parts; an item's id is
 * the SHA-256 of its signature, which is what binds fetched bytes to the id
 * the user asked for.
 */

const HASH_SIZE = 32;
const NOTE_SIZE = 32;
const DATA_CHUNK_SIZE = 256 * 1024;

export function base64UrlDecode(encoded) {
	const raw = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
	const out = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
	return out;
}

export function base64UrlEncode(data) {
	let raw = '';
	for (let i = 0; i < data.length; i += 8192) {
		raw += String.fromCharCode.apply(null, data.subarray(i, i + 8192));
	}
	return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sha256(data) {
	return new Uint8Array(await crypto.subtle.digest('SHA-256', data));
}

export function concat(parts) {
	const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
	let at = 0;
	for (const p of parts) {
		out.set(p, at);
		at += p.length;
	}
	return out;
}

export function equal(a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
	return true;
}

/**
 * Validate a Merkle data path against a root, returning the proven chunk
 * boundaries, or undefined if any hash or bound fails. `dest` is the target
 * offset within the transaction's data; `rightBound` is its total size.
 */
export async function validatePath(root, dest, rightBound, path) {
	if (rightBound <= 0) return undefined;
	const target = dest >= rightBound ? rightBound - 1 : dest < 0 ? 0 : dest;
	return walk(root, target, 0, rightBound, path, 0);
}

async function walk(id, dest, leftBound, rightBound, path, shift) {
	if (path.length === HASH_SIZE + NOTE_SIZE) {
		const data = path.subarray(0, HASH_SIZE);
		const endOffset = note(path.subarray(HASH_SIZE));
		if (endOffset - leftBound > DATA_CHUNK_SIZE) return undefined;
		if (rightBound - leftBound > DATA_CHUNK_SIZE) return undefined;
		if (!equal(await hashParts([data, noteBytes(endOffset)]), id)) return undefined;
		return {
			chunkId: data,
			start: shift + leftBound,
			end: shift + Math.max(Math.min(rightBound, endOffset), leftBound + 1),
		};
	}
	const rebased =
		path.length >= HASH_SIZE * 3 + NOTE_SIZE &&
		path.subarray(0, HASH_SIZE).every((b) => b === 0);
	const at = rebased ? HASH_SIZE : 0;
	if (path.length < at + HASH_SIZE * 2 + NOTE_SIZE) return undefined;
	const left = path.subarray(at, at + HASH_SIZE);
	const right = path.subarray(at + HASH_SIZE, at + HASH_SIZE * 2);
	const midpoint = note(path.subarray(at + HASH_SIZE * 2, at + HASH_SIZE * 2 + NOTE_SIZE));
	const rest = path.subarray(at + HASH_SIZE * 2 + NOTE_SIZE);
	if (!equal(await hashParts([left, right, noteBytes(midpoint)]), id)) return undefined;
	if (rebased) {
		if (dest < midpoint) {
			return walk(left, dest - leftBound, 0, Math.min(rightBound, midpoint) - leftBound, rest, shift + leftBound);
		}
		const next = Math.max(leftBound, midpoint);
		return walk(right, dest - next, 0, rightBound - next, rest, shift + next);
	}
	if (dest < midpoint) return walk(left, dest, leftBound, Math.min(rightBound, midpoint), rest, shift);
	return walk(right, dest, Math.max(leftBound, midpoint), rightBound, rest, shift);
}

/** The Merkle root a path commits to, recomputed from its first node. */
export async function extractRoot(path) {
	if (path.length === HASH_SIZE + NOTE_SIZE) {
		return hashParts([path.subarray(0, HASH_SIZE), path.subarray(HASH_SIZE)]);
	}
	const at =
		path.length >= HASH_SIZE * 3 + NOTE_SIZE && path.subarray(0, HASH_SIZE).every((b) => b === 0)
			? HASH_SIZE
			: 0;
	if (path.length < at + HASH_SIZE * 2 + NOTE_SIZE) throw new Error('invalid Merkle proof');
	return hashParts([
		path.subarray(at, at + HASH_SIZE),
		path.subarray(at + HASH_SIZE, at + HASH_SIZE * 2),
		path.subarray(at + HASH_SIZE * 2, at + HASH_SIZE * 2 + NOTE_SIZE),
	]);
}

/** The end offset the proven leaf carries, in its own tree's coordinates. */
export function extractNote(path) {
	return note(path.subarray(path.length - NOTE_SIZE));
}

async function hashParts(parts) {
	const hashed = [];
	for (const part of parts) hashed.push(await sha256(part));
	return sha256(concat(hashed));
}

function note(bytes) {
	let out = 0n;
	for (const b of bytes) out = (out << 8n) | BigInt(b);
	return Number(out);
}

function noteBytes(value) {
	const out = new Uint8Array(NOTE_SIZE);
	let rest = BigInt(value);
	for (let i = NOTE_SIZE - 1; i >= 0 && rest > 0n; i--) {
		out[i] = Number(rest & 0xffn);
		rest >>= 8n;
	}
	return out;
}

const SIGNATURE_SIZES = {
	1: { signature: 512, owner: 512 },
	2: { signature: 64, owner: 32 },
	3: { signature: 65, owner: 65 },
	4: { signature: 64, owner: 32 },
	7: { signature: 65, owner: 42 },
};

/** Parse an ANS-104 data item from its wire bytes. */
export function parseDataItem(bytes) {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const signatureType = view.getUint16(0, true);
	const sizes = SIGNATURE_SIZES[signatureType];
	if (!sizes) throw new Error(`unsupported signature type ${signatureType}`);
	let at = 2;
	const signature = bytes.subarray(at, (at += sizes.signature));
	const owner = bytes.subarray(at, (at += sizes.owner));
	const [target, afterTarget] = optionalField(bytes, at);
	const [anchor, afterAnchor] = optionalField(bytes, afterTarget);
	at = afterAnchor;
	const tagCount = Number(view.getBigUint64(at, true));
	const tagByteLength = Number(view.getBigUint64(at + 8, true));
	at += 16;
	const tagBytes = bytes.subarray(at, at + tagByteLength);
	const tags = decodeTags(tagBytes, tagCount);
	at += tagByteLength;
	return { signatureType, signature, owner, target, anchor, tags, data: bytes.subarray(at) };
}

/** The item's id: base64url of sha256(signature). */
export async function dataItemId(item) {
	return base64UrlEncode(await sha256(item.signature));
}

export function contentType(item) {
	return item.tags.find((t) => t.name.toLowerCase() === 'content-type')?.value;
}

function optionalField(bytes, at) {
	if (bytes[at] === 0) return [new Uint8Array(0), at + 1];
	return [bytes.subarray(at + 1, at + 33), at + 33];
}

function decodeTags(bytes, expected) {
	if (expected === 0 && bytes.length === 0) return [];
	const tags = [];
	const decoder = new TextDecoder();
	let at = 0;
	while (true) {
		const [blockCount, afterCount] = zigzag(bytes, at);
		at = afterCount;
		if (blockCount === 0) break;
		let remaining = blockCount;
		if (remaining < 0) {
			remaining = -remaining;
			at = zigzag(bytes, at)[1];
		}
		for (let i = 0; i < remaining; i++) {
			const [nameLength, afterName] = zigzag(bytes, at);
			const name = decoder.decode(bytes.subarray(afterName, afterName + nameLength));
			const [valueLength, afterValue] = zigzag(bytes, afterName + nameLength);
			const value = decoder.decode(bytes.subarray(afterValue, afterValue + valueLength));
			at = afterValue + valueLength;
			tags.push({ name, value });
		}
	}
	if (tags.length !== expected) throw new Error('tag count mismatch');
	return tags;
}

function zigzag(bytes, at) {
	let shift = 0n;
	let value = 0n;
	let index = at;
	while (true) {
		const byte = bytes[index];
		if (byte === undefined) throw new Error('truncated tags');
		index += 1;
		value |= BigInt(byte & 0x7f) << shift;
		if ((byte & 0x80) === 0) break;
		shift += 7n;
	}
	return [Number((value >> 1n) ^ -(value & 1n)), index];
}
