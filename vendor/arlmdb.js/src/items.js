/**
 * Header reads: the ANS-104 fields of the item at a weave offset.
 *
 * An offset in the index is the 0-based weave position of an item's first
 * byte, so its chunk is `/chunk/(offset + 1)` and the item starts
 * `offset + 1 - chunkStart` bytes into it. The header (signature, owner,
 * target, anchor and tags) is parsed from that chunk; when it runs past the
 * chunk's end the next chunk is appended and the parse retried. Item chunks
 * go through the transport's weave reads, not the container's byte source.
 */
import { ownerAddress, sha256 } from './predicate.js';
import { base64UrlEncode, concat, contentType, parseDataItem } from './weave.js';

/** Chunks a header may span before the read is given up. */
const MAX_HEADER_CHUNKS = 4;

function truncated(error) {
	return error instanceof RangeError || /truncated|tag count/.test(error.message);
}

/** The header fields of the item at `offset`, as a GraphQL node. */
export async function readHeader(index, offset, {
	i = 0, cursor, onEvent, slot = true, size = false, resultEvents = true, details = false,
} = {}) {
	const started = performance.now();
	const off = onEvent ? index.emitter.on('*', onEvent) : () => {};
	/* What this read cost is what this read fetched. Header reads overlap,
	   so a difference of the shared counters over the read's window would
	   charge the earliest read for everyone's chunks. */
	const cost = { requests: 0, bytes: 0 };
	const fetch = async (absolute) => {
		const chunk = await index.source.fetchWeave(absolute);
		if (!chunk.hit) { cost.requests += 1; cost.bytes += chunk.bytes.length; }
		return chunk;
	};
	if (slot && resultEvents) index.emitter.emit('result:slot', { i, offset, cursor: cursor ?? `offset=${offset}` });
	try {
		const absolute = Number(offset) + 1;
		let chunk = await fetch(absolute);
		let bytes = chunk.bytes.subarray(absolute - chunk.chunkStart);
		let item;
		for (let extra = 0; ; extra++) {
			try {
				item = parseDataItem(bytes);
				break;
			} catch (error) {
				if (!truncated(error) || extra >= MAX_HEADER_CHUNKS) throw error;
				chunk = await fetch(chunk.chunkStart + chunk.bytes.length);
				bytes = concat([bytes, chunk.bytes]);
			}
		}
		const node = {
			id: base64UrlEncode(sha256(item.signature)),
			anchor: item.anchor.length ? base64UrlEncode(item.anchor) : '',
			signature: base64UrlEncode(item.signature),
			recipient: item.target.length ? base64UrlEncode(item.target) : '',
			owner: { address: ownerAddress(item.owner, item.signatureType), key: base64UrlEncode(item.owner) },
			tags: item.tags,
			contentType: contentType(item) ?? null,
			signatureType: item.signatureType,
			size: null,
		};
		/* The size is in a bundle's index, not the item's header, so it is
		   read only when the query selected it — each bundle read once, kept
		   for the session — and the reads are charged to this node. The item
		   is a direct entry of its container or nested in a sub-bundle within
		   it; either way the index records the whole item, and the data size
		   the schema names is that less the header just parsed. */
		if (size) {
			const whole = await itemSize(index, chunk.txStart, node.id, absolute, fetch);
			const headerLength = item.data.byteOffset - bytes.byteOffset;
			node.size = whole === undefined ? null : Math.max(0, whole - headerLength);
		}
		const ms = performance.now() - started;
		if (resultEvents) index.emitter.emit('result:node', {
			i,
			offset,
			node,
			ms,
			requests: cost.requests,
			bytes: cost.bytes,
		});
		return details ? { node, ms, requests: cost.requests, bytes: cost.bytes } : node;
	} catch (error) {
		if (resultEvents) index.emitter.emit('result:failed', { i, offset, error });
		throw error;
	} finally {
		off();
	}
}

/**
 * The headers of a page of offsets, in order, `concurrency` reads at a
 * time. Every slot is announced before the first read so a UI can lay the
 * page out at once; a read that fails yields `{ error }` in its slot.
 */
export async function readHeaders(index, offsets, { concurrency = 4, cursors = [], onEvent, signal } = {}) {
	const pool = headerPool(index, { concurrency, onEvent, signal });
	offsets.forEach((offset, i) => pool.add(offset, i, cursors[i]));
	return pool.finish();
}

/**
 * Header reads that begin the moment an offset is known.
 *
 * A page's offsets arrive one at a time from the leapfrog, and each header
 * read is a chunk fetch that need not wait for the walk to end: `add` slots
 * the result and starts the read straight away, up to `concurrency` at a
 * time, and `finish` resolves to the nodes in slot order once the walk has
 * added its last. The headers phase therefore overlaps the locate phase
 * instead of following it.
 */
export function headerPool(index, { concurrency = 4, onEvent, signal, size = false } = {}) {
	const nodes = [];
	const queue = [];
	const off = onEvent ? index.emitter.on('*', onEvent) : () => {};
	let active = 0;
	let closed = false;
	let settle;
	const done = new Promise((resolve) => { settle = resolve; });
	const pump = () => {
		while (active < concurrency && queue.length) {
			const { offset, i, cursor } = queue.shift();
			active += 1;
			readHeader(index, offset, { i, cursor, slot: false, size })
				.then((node) => { nodes[i] = node; }, (error) => { nodes[i] = { error }; })
				.finally(() => { active -= 1; pump(); });
		}
		if (closed && active === 0 && queue.length === 0) settle();
	};
	return {
		add(offset, i, cursor = `offset=${offset}`) {
			nodes[i] = undefined;
			index.emitter.emit('result:slot', { i, offset, cursor });
			if (signal?.aborted) { nodes[i] = { error: new Error('cancelled') }; return; }
			queue.push({ offset, i, cursor });
			pump();
		},
		async finish() {
			closed = true;
			pump();
			await done;
			off();
			return nodes;
		},
	};
}

/** Sub-bundles descended into before a nested size is given up. */
const MAX_BUNDLE_DEPTH = 4;

/** A 32-byte little-endian unsigned integer, as ANS-104 bundle headers write them. */
function le32(bytes, at) {
	let n = 0n;
	for (let i = 31; i >= 0; i--) n = (n << 8n) | BigInt(bytes[at + i]);
	return n;
}

/**
 * The sizes of every item in an ANS-104 bundle, by id, from the bundle's
 * own header: an item count, then a size and an id per item, each 32
 * bytes. Throws with `truncated` set when `bytes` end before the header.
 */
export function parseBundleIndex(bytes) {
	const short = (need) => Object.assign(new Error(`bundle-header-truncated:${bytes.length}<${need}`), { truncated: true, need });
	if (bytes.length < 32) throw short(32);
	const count = Number(le32(bytes, 0));
	const need = 32 + count * 64;
	if (bytes.length < need) throw short(need);
	const sizes = new Map();
	for (let i = 0; i < count; i++) {
		const at = 32 + i * 64;
		sizes.set(base64UrlEncode(bytes.subarray(at + 32, at + 64)), Number(le32(bytes, at)));
	}
	return sizes;
}

/**
 * A container's ANS-104 index, scanned lazily and memoized per weave address.
 * The header is a 32-byte count then a size and an id per item, 32 bytes
 * apiece; the data region begins where the header ends and each item's bytes
 * follow their siblings' in order. Entries are read on demand, so a lookup
 * reads header chunks only up to the entry that matches or holds its target —
 * a 21000-entry container index is never read whole to place an item a few
 * entries in. `sizes` and `ranges` hold what has been read, so items sharing a
 * container extend one scan instead of each reading the header afresh.
 */
function containerScan(index, at) {
	index.bundles ??= new Map();
	let scan = index.bundles.get(at);
	if (scan) return scan;
	scan = {
		at,
		bytes: null,
		next: at,
		count: 0,
		region: at,
		cum: at,
		i: 0,
		sizes: new Map(),
		ranges: [],
		ready: false,
		bad: false,
		tail: Promise.resolve(),
	};
	index.bundles.set(at, scan);
	return scan;
}

/** Extend `scan.bytes` through `need` bytes from `at`; false when a chunk is empty. */
async function pull(scan, need, fetch) {
	while (scan.bytes.length < need) {
		const chunk = await fetch(scan.next);
		if (!chunk.bytes.length) return false;
		scan.bytes = concat([scan.bytes, chunk.bytes]);
		scan.next = chunk.chunkStart + chunk.bytes.length;
	}
	return true;
}

/**
 * Locate `id`, whose first byte is at weave address `addr`, in the container
 * scan: `{ size }` when it is a direct entry, `{ descend }` at the weave
 * address of the sub-item whose byte range holds `addr`, or null when the
 * container resolves to neither within the header. A size is returned only
 * against a matching 32-byte id, so a miss is null, never a wrong size.
 * Advances of the shared scan run one at a time through `scan.tail`.
 */
async function resolveIn(index, at, id, addr, fetch) {
	const scan = containerScan(index, at);
	const step = scan.tail.then(() => advance(scan, id, addr, fetch));
	scan.tail = step.catch(() => {});
	return step;
}

async function advance(scan, id, addr, fetch) {
	if (scan.bad) return null;
	if (!scan.ready) {
		const chunk = await fetch(scan.at);
		scan.bytes = chunk.bytes.subarray(scan.at - chunk.chunkStart);
		scan.next = chunk.chunkStart + chunk.bytes.length;
		if (!(await pull(scan, 32, fetch))) { scan.bad = true; return null; }
		scan.count = Number(le32(scan.bytes, 0));
		scan.region = scan.at + 32 + scan.count * 64;
		scan.cum = scan.region;
		scan.ready = true;
	}
	const known = scan.sizes.get(id);
	if (known !== undefined) return { size: known };
	/* An address the scan has already passed is a direct entry (in `sizes`
	   above) or falls in a held range; an address before the data region is in
	   no entry, so a container that is not this item's resolves after one chunk. */
	if (addr < scan.cum) {
		const held = scan.ranges.find((r) => addr >= r.start && addr < r.start + r.size);
		return held ? { descend: held.start } : null;
	}
	while (scan.i < scan.count) {
		const off = 32 + scan.i * 64;
		if (!(await pull(scan, off + 64, fetch))) { scan.bad = true; return null; }
		const size = Number(le32(scan.bytes, off));
		const entry = base64UrlEncode(scan.bytes.subarray(off + 32, off + 64));
		const start = scan.cum;
		scan.sizes.set(entry, size);
		scan.ranges.push({ start, size });
		scan.i += 1;
		scan.cum += size;
		if (entry === id) return { size };
		if (addr >= start && addr < start + size) return { descend: start };
	}
	return null;
}

/**
 * The weave address at which the item at `itemStart` carries its data: a
 * nested bundle begins where the item's own ANS-104 header ends. Undefined
 * when the header does not resolve within the chunk bound.
 */
async function subBundleStart(index, itemStart, fetch) {
	let chunk = await fetch(itemStart);
	let bytes = chunk.bytes.subarray(itemStart - chunk.chunkStart);
	for (let extra = 0; ; extra++) {
		try {
			const item = parseDataItem(bytes);
			return itemStart + item.data.byteOffset - bytes.byteOffset;
		} catch (error) {
			if (!truncated(error) || extra >= MAX_HEADER_CHUNKS) return undefined;
			chunk = await fetch(chunk.chunkStart + chunk.bytes.length);
			bytes = concat([bytes, chunk.bytes]);
		}
	}
}

/**
 * The recorded whole-item size of `id`, whose first byte is at weave address
 * `addr`, from the bundle at `txStart` or a sub-bundle nested within it. At
 * each level the id is a direct entry whose size is returned, or `addr` falls
 * in the byte range of a sub-item to descend into. Undefined when the id is
 * not found within the depth bound; a size is returned only against a matching
 * id, so a miss is null, never a wrong size.
 */
async function itemSize(index, txStart, id, addr, fetch) {
	let at = txStart;
	for (let depth = 0; depth < MAX_BUNDLE_DEPTH; depth++) {
		const found = await resolveIn(index, at, id, addr, fetch);
		if (!found) return undefined;
		if (found.size !== undefined) return found.size;
		at = await subBundleStart(index, found.descend, fetch);
		if (at === undefined) return undefined;
	}
	return undefined;
}
