/**
 * Open a published ~match@1.0 index in place.
 *
 * The container is placed by its transaction: `/tx/<id>/offset` gives the
 * weave offset of its last byte and its size, `/tx/<id>/tags` the schema
 * it was built under and `/tx/<id>/data_root` the root every chunk is proved
 * against. A caller that already knows the placement passes
 * `{ start, size, dataRoot, tags }` and no transaction is read.
 *
 * Only one schema is served: rows of `key-hash:39|value-hash:40|offset:49`
 * under the `~match@1.0/` prefix with dual SHA-256 hashes. Any other
 * configuration is refused when the index is opened, not when a query runs.
 *
 * The gateway does not hold every chunk of the container, so chunk requests
 * fall back to the fleet nodes the container's `sources` tag names, on the
 * HTTP port that answers. A page read that fails inside LMDB leaves its
 * read transaction in error for good; `ready()` reopens the environment
 * over the same source (its meta pages are held, so that costs no request)
 * and every walk calls it first.
 */
import { LmdbEnv } from 'lmdb-wasm';
import { Emitter } from './events.js';
import { ChunkSource, GATEWAY, getJson, getText } from './transport.js';
import { base64UrlDecode } from './weave.js';

export const DEFAULT_INDEX = 'oWRzBr3KHhULAL-s5ULeXac1mb_WQOX5uFBRea16iRI';
const SCHEMA = 'key-hash:39|value-hash:40|offset:49';
const PREFIX = '~match@1.0/';
const NORMALIZE = { mode: 'dual-hashes', alg: 'sha-256', 'key-hash-size': '39', 'value-hash-size': '40' };
const decoder = new TextDecoder();

/** The fleet nodes a container's `sources` tag names, on the port that serves chunks. */
export function fleetSources(tags) {
	const listed = tagValue(tags, 'sources');
	if (!listed) return [];
	return listed.split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
		const host = s.replace(/^https?:\/\//, '').replace(/[:/].*$/, '');
		return `http://${host}:1984`;
	});
}

/** The value of a tag by name, or undefined. */
export function tagValue(tags, name) {
	return tags.find((t) => t.name === name)?.value;
}

/** Refuse a container whose tags declare a schema other than the one served. */
export function checkSchema(tags) {
	const schema = tagValue(tags, 'schema');
	if (schema !== SCHEMA) throw new Error(`unsupported-index-schema: ${schema ?? 'missing'} (need ${SCHEMA})`);
	const prefix = tagValue(tags, 'prefix');
	if (prefix !== PREFIX) throw new Error(`unsupported-index-prefix: ${prefix ?? 'missing'} (need ${PREFIX})`);
	const normalize = tagValue(tags, 'normalize-key') ?? '';
	const at = normalize.indexOf('normalize-key=');
	if (at < 0) throw new Error('unsupported-index-normalize-key: missing');
	const [mode, ...params] = normalize.slice(at + 'normalize-key='.length).split('&');
	const given = { mode };
	for (const param of params) {
		const eq = param.indexOf('=');
		given[param.slice(0, eq)] = param.slice(eq + 1);
	}
	for (const [key, want] of Object.entries(NORMALIZE)) {
		if (given[key] !== want) throw new Error(`unsupported-index-normalize-key: ${key}=${given[key] ?? 'missing'} (need ${want})`);
	}
}

/** The placement, tags and data root of a transaction, from the gateway. */
async function resolve(id, gateway, fetcher) {
	const [placement, rawTags, dataRoot] = await Promise.all([
		getJson(`${gateway}/tx/${id}/offset`, fetcher),
		getJson(`${gateway}/tx/${id}/tags`, fetcher),
		getText(`${gateway}/tx/${id}/data_root`, fetcher),
	]);
	const size = Number(placement.size);
	const start = Number(BigInt(placement.offset) - BigInt(placement.size) + 1n);
	const tags = rawTags.map((t) => ({
		name: decoder.decode(base64UrlDecode(t.name)),
		value: decoder.decode(base64UrlDecode(t.value)),
	}));
	return { start, size, dataRoot, tags };
}

export async function openIndex({
	id = DEFAULT_INDEX,
	start,
	size,
	dataRoot,
	tags,
	byteSource,
	gateway = GATEWAY,
	chunkSources,
	readAhead = 0,
	onEvent,
	fetcher,
} = {}) {
	const emitter = new Emitter();
	if (onEvent) emitter.on('*', onEvent);
	if (start === undefined && byteSource === undefined) {
		({ start, size, dataRoot, tags } = await resolve(id, gateway, fetcher));
	}
	checkSchema(tags);
	chunkSources ??= fleetSources(tags);
	const source = byteSource
		? null
		: new ChunkSource({ start, size, dataRoot, gateway, chunkSources, readAhead, emitter, fetcher });
	const open = () => LmdbEnv.open(byteSource ?? source.byteSource());
	let env = await open();
	if (source) source.pageSize = env.pageSize;
	let db = env.mainDb;
	const index = {
		id,
		start,
		size,
		dataRoot,
		tags,
		gateway,
		chunkSources,
		get env() { return env; },
		get db() { return db; },
		source,
		emitter,
		fetcher,
		pageSize: env.pageSize,
		rows: db.entries,
		depth: db.depth,
		stats: () => source?.stats() ?? { requests: 0, bytes: 0, hits: 0, verified: 0, networkMs: 0, verifyMs: 0, pages: 0 },
		on: (type, fn) => emitter.on(type, fn),
		ready: async () => {
			if (!source?.failed) return;
			env.close();
			env = await open();
			db = env.mainDb;
			source.failed = false;
		},
		close: () => env.close(),
	};
	emitter.emit('index:open', { id, start, size, pageSize: env.pageSize, depth: db.depth, rows: db.entries });
	return index;
}
