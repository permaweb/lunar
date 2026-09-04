/**
 * Chunk transport: fetch 256 KiB weave chunks, prove each one against the
 * container's data root, keep them for the session, and serve LMDB one page
 * per read.
 *
 * Chunk requests are numbered in the order they are issued. The container's
 * chunk `index` is its 256 KiB chunk number from the container's first byte;
 * a chunk read for an item outside the container carries `index: null` and
 * its absolute weave offset instead. The chunk API is 1-based (container
 * byte i is weave byte `start + i`), so a chunk's first byte is at
 * `absolute_end_offset - length + 1`.
 *
 * lmdb-wasm is built with one page per chunk, so every `read` the byte
 * source receives is exactly one page LMDB asked for, in the order it asked;
 * `page:read` reports each with the kind its header flags declare. After a
 * leaf page, the next `readAhead` chunks in the walk direction are requested
 * — off unless asked for: measured over five cold queries, sixteen such
 * chunks were fetched and one was ever read, since a page of results sits
 * in one leaf far more often than not —
 * before LMDB asks for them.
 */
import { base64UrlDecode, equal, extractNote, extractRoot, sha256, validatePath } from './weave.js';

export const CHUNK_SIZE = 256 * 1024;
export const GATEWAY = 'https://arweave.net';
const PAGE_HEADER = 24;
const P_BRANCH = 0x01;
const P_LEAF = 0x02;
const P_META = 0x08;
const P_LEAF2 = 0x20;
/**
 * Item chunks held for header reads, bounded by decoded bytes. A first:100
 * page selecting data{size} reads a header chunk per item and a bundle-index
 * chunk per distinct bundle — several hundred distinct weave chunks whose two
 * uses can be far apart in the walk, so the retained set must hold a whole
 * page's working set to fetch each once. 128 MiB covers that with wide margin
 * (a chunk is at most 256 KiB) and caps a long session's memory; least-recent
 * chunks fall out first.
 */
const WEAVE_CACHE_BYTES = 128 * 1024 * 1024;
/** Attempts per source when the failure is the connection, not the answer. */
const ATTEMPTS = 2;

/** GET a JSON document from a gateway path. */
export async function getJson(url, fetcher = globalThis.fetch) {
	const response = await fetcher(url);
	if (!response.ok) throw new Error(`${url}: status ${response.status}`);
	return response.json();
}

/** GET a text document from a gateway path. */
export async function getText(url, fetcher = globalThis.fetch) {
	const response = await fetcher(url);
	if (!response.ok) throw new Error(`${url}: status ${response.status}`);
	return response.text();
}

/** GET the raw bytes at a path. */
export async function getBytes(url, fetcher = globalThis.fetch) {
	const response = await fetcher(url);
	if (!response.ok) throw new Error(`${url}: status ${response.status}`);
	return new Uint8Array(await response.arrayBuffer());
}

/** The kind a page's header flags declare. */
export function pageKind(flags) {
	if (flags & P_META) return 'meta';
	if (flags & P_LEAF2) return 'sub';
	if (flags & P_BRANCH) return 'branch';
	if (flags & P_LEAF) return 'leaf';
	return 'page';
}

export class ChunkSource {
	#cache = new Map();
	#inflight = new Map();
	/** Chunks the gateway answered a read-ahead for with a status: the miss, by chunk index. */
	#missed = new Map();
	#weave = new Map();
	/** Decoded bytes retained in #weave, held at or under WEAVE_CACHE_BYTES. */
	#weaveBytes = 0;
	/** Weave downloads in flight, each { requested, promise }, scanned by offset. */
	#weaveInflight = new Set();
	#sources;
	#dataRoot;
	#fetcher;
	#emitter;
	#requestNo = 0;
	#stats = { requests: 0, bytes: 0, hits: 0, verified: 0, networkMs: 0, verifyMs: 0, pages: 0 };
	start;
	size;
	readAhead;
	/** Pause before a source is asked again after a network-level failure. */
	retryMs = 250;
	/** Page size of the container, once the environment reports it. */
	pageSize;
	/** The walk direction read-ahead follows. */
	direction = 'asc';
	/** Set when a page read failed inside LMDB, which leaves its transaction unusable. */
	failed = false;

	constructor({ start, size, dataRoot, gateway = GATEWAY, chunkSources = [], readAhead = 0, emitter, fetcher }) {
		this.start = start;
		this.size = size;
		this.readAhead = readAhead;
		this.#dataRoot = typeof dataRoot === 'string' ? base64UrlDecode(dataRoot) : dataRoot;
		this.#sources = [gateway, ...chunkSources];
		this.#emitter = emitter;
		this.#fetcher = fetcher ?? ((url) => fetch(url));
	}

	get sources() {
		return this.#sources;
	}

	get chunks() {
		return Math.ceil(this.size / CHUNK_SIZE);
	}

	stats() {
		return { ...this.#stats };
	}

	clear() {
		this.#cache.clear();
		this.#weave.clear();
		this.#weaveBytes = 0;
		this.#weaveInflight.clear();
	}

	#emit(type, fields) {
		this.#emitter?.emit(type, fields);
	}

	/** The verified chunk at a container chunk index, from cache or the network. */
	async chunk(index, { readAhead = false } = {}) {
		const held = this.#cache.get(index);
		if (held) {
			this.#stats.hits += 1;
			this.#emit('chunk:hit', { index });
			return { chunk: held, hit: true };
		}
		let entry = this.#inflight.get(index);
		if (entry) {
			if (entry.readAhead && !readAhead) entry = this.#continue(index, entry.pending);
		} else if (this.#missed.has(index)) {
			if (readAhead) throw this.#missed.get(index);
			entry = this.#continue(index, Promise.reject(this.#missed.get(index)));
		} else {
			const pending = this.#fetch(index, readAhead ? this.#sources.slice(0, 1) : this.#sources, readAhead);
			if (readAhead) pending.catch((error) => { if (error.status !== undefined) this.#missed.set(index, error); });
			entry = this.#track(index, pending, readAhead);
		}
		return { chunk: await entry.pending, hit: false };
	}

	/** Register a fetch in flight so that later reads of the chunk join it. */
	#track(index, pending, readAhead) {
		const entry = { pending, readAhead };
		this.#inflight.set(index, entry);
		pending.finally(() => {
			if (this.#inflight.get(index) === entry) this.#inflight.delete(index);
		}).catch(() => {});
		return entry;
	}

	/**
	 * A walk read that joins a speculative fetch, in flight or already
	 * missed: the answer is shared when the gateway has the chunk, and the
	 * fleet is asked when it does not.
	 */
	#continue(index, speculative) {
		const fleet = this.#sources.slice(1);
		const pending = speculative.catch((error) => (fleet.length ? this.#fetch(index, fleet) : Promise.reject(error)));
		return this.#track(index, pending, false);
	}

	/**
	 * Read `length` container bytes at `byteOffset`, reporting the numbered
	 * requests that supplied them and whether every one was already held.
	 */
	async readRange(byteOffset, length) {
		const out = new Uint8Array(length);
		let done = 0;
		let cached = true;
		const requests = [];
		const chunks = [];
		while (done < length) {
			const index = Math.floor((byteOffset + done) / CHUNK_SIZE);
			const { chunk, hit } = await this.chunk(index);
			cached = cached && hit;
			if (!requests.includes(chunk.request)) requests.push(chunk.request);
			if (!chunks.includes(index)) chunks.push(index);
			const within = this.start + byteOffset + done - chunk.start;
			const take = Math.min(length - done, chunk.bytes.length - within);
			if (take <= 0) throw new Error('short chunk');
			out.set(chunk.bytes.subarray(within, within + take), done);
			done += take;
		}
		return { bytes: out, cached, requests, chunks };
	}

	/**
	 * The byte source LMDB reads the container through: one page per read,
	 * each reported as `page:read`, with read-ahead after leaf pages.
	 */
	byteSource(context = {}) {
		return {
			size: this.size,
			read: async (offset, length) => {
				const started = performance.now();
				let range;
				try {
					range = await this.readRange(offset, length);
				} catch (error) {
					this.failed = true;
					throw error;
				}
				const { bytes, cached, chunks } = range;
				const pageSize = this.pageSize ?? length;
				let kind = 'page';
				let pgno = null;
				let entries = null;
				if (bytes.length >= PAGE_HEADER) {
					const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
					pgno = Number(view.getBigUint64(0, true));
					kind = pageKind(view.getUint16(18, true));
					if (kind === 'branch' || kind === 'leaf' || kind === 'sub') {
						// LMDB 1.0 sets PAGEBASE to PAGEHDRSZ, so mp_lower is
						// the pointer-array byte count rather than a page offset.
						entries = view.getUint16(20, true) / 2;
					}
				}
				this.#stats.pages += 1;
				this.#emit('page:read', {
					...context,
					page: Math.floor(offset / pageSize),
					pgno,
					chunk: chunks[0],
					cached,
					kind,
					entries,
					bytes: length,
					ms: performance.now() - started,
				});
				if (kind === 'leaf' || kind === 'sub') this.#prefetch(chunks[chunks.length - 1]);
				return bytes;
			},
		};
	}

	/** Request the chunks beyond `index` in the walk direction, unawaited. */
	#prefetch(index) {
		const step = this.direction === 'desc' ? -1 : 1;
		for (let k = 1; k <= this.readAhead; k++) {
			const next = index + step * k;
			if (next < 0 || next >= this.chunks) break;
			if (this.#cache.has(next) || this.#inflight.has(next) || this.#missed.has(next)) continue;
			this.chunk(next, { readAhead: true }).catch(() => {});
		}
	}

	async #fetch(index, sources, readAhead = false) {
		const absolute = this.start + index * CHUNK_SIZE;
		const request = ++this.#requestNo;
		const { body, source, ms } = await this.#getChunk(absolute, index, sources, readAhead);
		const bytes = base64UrlDecode(body.chunk);
		const path = base64UrlDecode(body.data_path);
		this.#stats.bytes += bytes.length;
		this.#emit('chunk:received', { index, bytes: bytes.length, source, ms });
		// Prove these bytes belong to the container at this offset.
		const started = performance.now();
		const proof = await validatePath(this.#dataRoot, index * CHUNK_SIZE, this.size, path);
		const verified =
			proof !== undefined &&
			proof.end - proof.start === bytes.length &&
			equal(await sha256(bytes), proof.chunkId);
		const verifyMs = performance.now() - started;
		this.#stats.verifyMs += verifyMs;
		this.#emit('chunk:verified', { index, ms: verifyMs, verified });
		if (!verified) {
			const error = new Error('chunk proof failed against the container data root');
			this.#emit('chunk:failed', { index, source, error });
			throw error;
		}
		this.#stats.verified += 1;
		const chunk = { index, request, start: this.start + proof.start, bytes, verified };
		this.#cache.set(index, chunk);
		return chunk;
	}

	/**
	 * The chunk at `absolute` from the first of `sources` that has it: the
	 * gateway first, then every fleet node at once. A read-ahead is
	 * speculative and is given the gateway alone: a chunk the gateway lacks
	 * is remembered as missed and goes straight to the fleet when a walk
	 * needs it.
	 */
	async #getChunk(absolute, index, sources, readAhead) {
		const [gateway, ...fleet] = sources;
		try {
			return await this.#ask(gateway, absolute, index, readAhead);
		} catch (error) {
			if (!fleet.length) throw error;
		}
		return this.#race(fleet, absolute, index, readAhead);
	}

	/**
	 * The gateway lacks the chunk; the fleet nodes are raced. Each is asked
	 * at once and the first to return its headers with a `200' wins: only
	 * the winner's body is downloaded, and the losers are aborted before
	 * they stream a chunk that would be thrown away. Asked in turn instead,
	 * a chunk the gateway lacks cost one round trip per node before it
	 * arrived; downloaded from every holder, it cost a full chunk per holder.
	 */
	async #race(fleet, absolute, index, readAhead) {
		const controllers = fleet.map(() => new AbortController());
		const attempts = fleet.map((source, i) =>
			this.#open(source, absolute, index, readAhead, controllers[i].signal).then((open) => ({ ...open, i })));
		let winner;
		try {
			winner = await Promise.any(attempts);
		} catch (aggregate) {
			throw aggregate.errors?.find((e) => e?.name !== 'AbortError') ?? new Error('no chunk source responded');
		}
		/* One node has answered; the rest are stopped before their bodies
		 * cross the wire. */
		controllers.forEach((controller, i) => { if (i !== winner.i) controller.abort(); });
		const body = await winner.response.json();
		const ms = performance.now() - winner.started;
		this.#stats.networkMs += ms;
		return { body, source: winner.source, ms };
	}

	/**
	 * Ask one source for `/chunk/<absolute>` and resolve at its response
	 * headers, before its body is read: a `200' is an answer to download, any
	 * other status a miss. A failure to reach the source (a reset connection,
	 * a timeout) is retried once after `retryMs`; an abort is not. The answer
	 * carries `started`, the moment the winning request went out, so the
	 * caller times the read from the request rather than from the headers.
	 */
	async #open(source, absolute, index, readAhead, signal) {
		let last;
		for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
			this.#stats.requests += 1;
			this.#emit('chunk:request', { index, absolute, source, readAhead });
			const started = performance.now();
			try {
				const response = await this.#fetcher(`${source}/chunk/${absolute}`, signal ? { signal } : undefined);
				if (!response.ok) throw Object.assign(new Error(`status ${response.status}`), { status: response.status });
				return { response, source, started };
			} catch (error) {
				if (error?.name === 'AbortError') throw error;
				this.#emit('chunk:failed', { index, source, error, readAhead });
				last = error;
				if (error.status !== undefined || attempt === ATTEMPTS) break;
				await new Promise((resolve) => setTimeout(resolve, this.retryMs));
			}
		}
		throw last;
	}

	/**
	 * Ask one source and download its body: the gateway's own path, with no
	 * one to race, so its answer is read in full. Its `ms` runs from the
	 * request to the body in hand, so `chunk:received` accounts for the whole
	 * fetch and no time falls unlabelled between the request and its receipt.
	 */
	async #ask(source, absolute, index, readAhead) {
		const { response, started } = await this.#open(source, absolute, index, readAhead);
		const body = await response.json();
		const ms = performance.now() - started;
		this.#stats.networkMs += ms;
		return { body, source, ms };
	}

	/**
	 * The chunk holding an absolute weave offset outside the container. Its
	 * bytes are bound to the proof they arrive with, but that proof's root
	 * is not known to be the item's transaction, so `verified` is false.
	 */
	/**
	 * The weave chunk holding an item at `absolute`, from the retained set or
	 * the network.
	 *
	 * A page's item headers are read concurrently, and items packed into one
	 * bundle share a 256 KiB weave chunk, so without coalescing the same
	 * chunk was downloaded once per item — most of a clustered page's bytes.
	 * A chunk's boundaries are not known before its response, and the weave is
	 * not on a single global phase: a partial mid-weave chunk shifts every
	 * chunk after it, so bundles carry different phases and no offset-only key
	 * identifies a chunk. Coalescing is therefore on the resolved range. A read
	 * whose chunk is held returns it. Otherwise any download in flight whose
	 * own offset is within a chunk of this one might cover it, so the read
	 * waits for that download and re-checks the exact retained range, looping
	 * until either a range covers it or no candidate remains. Only then does it
	 * register and start its own download. The final check and the registration
	 * run in one synchronous step, and reads waiting on the same download wake
	 * in order, so concurrent same-chunk reads collapse to a single fetch with
	 * no window in which two both decide to download.
	 */
	async fetchWeave(absolute) {
		while (true) {
			const held = this.#weaveHit(absolute);
			if (held) return held;
			let candidate;
			for (const entry of this.#weaveInflight) {
				if (Math.abs(entry.requested - absolute) < CHUNK_SIZE) { candidate = entry; break; }
			}
			if (!candidate) break;
			await candidate.promise.catch(() => null);
		}
		const entry = { requested: absolute, promise: null };
		entry.promise = this.#downloadWeave(absolute);
		this.#weaveInflight.add(entry);
		entry.promise.finally(() => this.#weaveInflight.delete(entry)).catch(() => {});
		return entry.promise;
	}

	/** The retained weave chunk covering `absolute`, counted as a hit, or null. */
	#weaveHit(absolute) {
		for (const chunk of this.#weave.values()) {
			if (absolute >= chunk.chunkStart && absolute < chunk.chunkStart + chunk.bytes.length) {
				this.#stats.hits += 1;
				this.#emit('chunk:hit', { index: null, absolute });
				/* Move to the most-recent end so a chunk re-read within a page
				   outlives the colder chunks fetched between its two uses. */
				this.#weave.delete(chunk.chunkStart);
				this.#weave.set(chunk.chunkStart, chunk);
				return { ...chunk, hit: true };
			}
		}
		return null;
	}

	/** Download, verify and retain the weave chunk holding `absolute`. */
	async #downloadWeave(absolute) {
		const request = ++this.#requestNo;
		const { body, source, ms } = await this.#getChunk(absolute, null, this.#sources, false);
		const bytes = base64UrlDecode(body.chunk);
		const path = base64UrlDecode(body.data_path);
		this.#stats.bytes += bytes.length;
		this.#emit('chunk:received', { index: null, bytes: bytes.length, source, ms });
		const started = performance.now();
		const claimed = await extractRoot(path);
		const end = extractNote(path);
		const proof = await validatePath(claimed, Math.max(0, end - 1), end, path);
		const bound =
			proof !== undefined &&
			proof.end - proof.start === bytes.length &&
			equal(await sha256(bytes), proof.chunkId);
		const verifyMs = performance.now() - started;
		this.#stats.verifyMs += verifyMs;
		this.#emit('chunk:verified', { index: null, ms: verifyMs, verified: false });
		if (!bound) {
			const error = new Error('chunk bytes do not match their proof');
			this.#emit('chunk:failed', { index: null, source, error });
			throw error;
		}
		const chunkStart = Number(body.absolute_end_offset) - bytes.length + 1;
		/* The proof's last note is this chunk's end within its transaction's
		   data, so the data's first weave address follows without a lookup. */
		const txStart = chunkStart + bytes.length - end;
		const chunk = { request, chunkStart, txStart, bytes, verified: false, hit: false };
		this.#weave.set(chunkStart, chunk);
		this.#weaveBytes += bytes.length;
		while (this.#weaveBytes > WEAVE_CACHE_BYTES && this.#weave.size > 1) {
			const oldest = this.#weave.keys().next().value;
			this.#weaveBytes -= this.#weave.get(oldest).bytes.length;
			this.#weave.delete(oldest);
		}
		return chunk;
	}
}
