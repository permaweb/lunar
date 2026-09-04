/**
 * Block heights to weave offsets. A block's record carries the weave size
 * after it, so block N's data spans `[weave_size(N-1), weave_size(N))`.
 *
 * A gateway's full block header embeds the proof-of-access chunk and runs to
 * ~700 KB, of which a window needs only the 8-byte weave size. The fleet nodes
 * serve `block_index2/<h>/<h>`, the same weave size in ~90 bytes; the gateway
 * does not. So a window reads the fleet slice and falls back to the gateway's
 * header when no fleet node answers (a browser served over https cannot reach
 * the http fleet, so it takes the header). Records are kept for the session.
 */
import { getJson, getBytes } from './transport.js';

const blocks = new Map();

/** Whether http fleet nodes are unreachable, as from an https browser page. */
function fleetBlocked() {
	return typeof location !== 'undefined' && location.protocol === 'https:';
}

/**
 * The weave size a fleet `block_index2/<h>/<h>` entry records: a 48-byte block
 * hash, the weave size as a 16-bit-length-prefixed big-endian integer, then a
 * length-prefixed tx root.
 */
function weaveSizeFromIndex(bytes) {
	let at = 48;
	const size = (bytes[at] << 8) | bytes[at + 1];
	at += 2;
	let weave = 0n;
	for (let i = 0; i < size; i++) weave = (weave << 8n) | BigInt(bytes[at + i]);
	return weave;
}

/** The weave size after a block, from a fleet slice or the gateway header. */
async function weaveSize(gateway, fleet, height, fetcher) {
	if (!fleetBlocked()) {
		for (const node of fleet) {
			try {
				const weave = weaveSizeFromIndex(await getBytes(`${node}/block_index2/${height}/${height}`, fetcher));
				if (weave > 0n) return weave;
			} catch {
				/* try the next node, then the gateway header */
			}
		}
	}
	return BigInt((await getJson(`${gateway}/block/height/${height}`, fetcher)).weave_size);
}

/** The weave size after a block, as a bigint. */
export async function block(gateway, height, { fetcher, fleet = [] } = {}) {
	const key = `${gateway}#${height}`;
	let pending = blocks.get(key);
	if (!pending) {
		pending = weaveSize(gateway, fleet, height, fetcher).then((weaveSize) => ({ height, weaveSize }));
		pending.catch(() => blocks.delete(key));
		blocks.set(key, pending);
	}
	return pending;
}

/**
 * The offset window `[start, end)` of blocks `min..max`; an open end is 0n
 * below and null above.
 */
export async function blockWindow(gateway, { min, max } = {}, options = {}) {
	const [before, high] = await Promise.all([
		min === undefined || min === null || min <= 0 ? null : block(gateway, min - 1, options),
		max === undefined || max === null ? null : block(gateway, max, options),
	]);
	return {
		start: before ? before.weaveSize : 0n,
		end: high ? high.weaveSize : null,
	};
}
