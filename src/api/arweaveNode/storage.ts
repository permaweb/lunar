import { normalizeArweaveNode } from 'helpers/arweaveNode';

import { blockHash, count, integer, record } from './parsers';
import type { NodeBlock, NodeInfo } from './types';

const DATABASE = 'lunar-node-explorer';
const STORE = 'entries';
const LIMITS = { history: 32, info: 32, pending: 32, block: 500, transaction: 1000 };
type Kind = keyof typeof LIMITS;
type Entry = { key: string; kind: Kind; node: string; scope: string; savedAt: number; value: unknown };
export type CachedNodeHistory = { node: string; network: string; savedAt: number; blocks: NodeBlock[] };

/** Optional, bounded cache. Storage rejection must never prevent a network read. */
async function database(): Promise<IDBDatabase | null> {
	if (typeof indexedDB === 'undefined') return null;
	return new Promise((resolve) => {
		let settled = false;
		const finish = (db: IDBDatabase | null) => {
			if (settled) {
				db?.close();
				return;
			}
			settled = true;
			clearTimeout(timer);
			resolve(db);
		};
		const timer = setTimeout(() => finish(null), 1500);
		try {
			const request = indexedDB.open(DATABASE, 1);
			request.onupgradeneeded = () => {
				const store = request.result.createObjectStore(STORE, { keyPath: 'key' });
				store.createIndex('kind', 'kind');
			};
			request.onsuccess = () => finish(request.result);
			request.onerror = request.onblocked = () => finish(null);
		} catch {
			finish(null);
		}
	});
}

function key(kind: Kind, node: string, scope: string) {
	return JSON.stringify([kind, node, scope]);
}
export async function readNodeCache(kind: Kind, node: string, scope = ''): Promise<unknown | null> {
	const origin = normalizeArweaveNode(node);
	if (!origin) return null;
	const db = await database();
	if (!db) return null;
	return new Promise((resolve) => {
		try {
			const transaction = db.transaction(STORE, 'readonly');
			const request = transaction.objectStore(STORE).get(key(kind, origin, scope));
			transaction.oncomplete = () => {
				db.close();
				resolve(request.result?.value ?? null);
			};
			transaction.onerror = transaction.onabort = () => {
				db.close();
				resolve(null);
			};
		} catch {
			db.close();
			resolve(null);
		}
	});
}

export async function writeNodeCache(kind: Kind, node: string, value: unknown, scope = ''): Promise<void> {
	const origin = normalizeArweaveNode(node);
	if (!origin) return;
	// Bound individual raw responses as well as the number of retained records.
	try {
		if (JSON.stringify(value).length > 4_000_000) return;
	} catch {
		return;
	}
	const db = await database();
	if (!db) return;
	return new Promise((resolve) => {
		try {
			const transaction = db.transaction(STORE, 'readwrite');
			const store = transaction.objectStore(STORE);
			store.put({ key: key(kind, origin, scope), kind, node: origin, scope, savedAt: Date.now(), value });
			const request = store.index('kind').getAll();
			request.onsuccess = () => {
				const entries = request.result as Entry[];
				entries.sort((a, b) => b.savedAt - a.savedAt);
				let bytes = 0;
				entries.forEach((entry, index) => {
					bytes += JSON.stringify(entry.value).length;
					if (index >= LIMITS[kind] || bytes > 20_000_000) store.delete(entry.key);
				});
			};
			transaction.oncomplete =
				transaction.onerror =
				transaction.onabort =
					() => {
						db.close();
						resolve();
					};
		} catch {
			db.close();
			resolve();
		}
	});
}

export function parseCachedBlocks(value: unknown): NodeBlock[] | null {
	try {
		if (!Array.isArray(value) || !value.length || value.length > 5000) return null;
		const blocks = value.map((value): NodeBlock => {
			const b = record(value);
			if (b.miner !== null && (typeof b.miner !== 'string' || !/^[\w-]{43}$/.test(b.miner))) throw Error();
			const previous = b.height === 0 && b.previous === '' ? '' : blockHash(b.previous);
			const denomination = count(b.denomination);
			if (!denomination) throw Error();
			return {
				height: count(b.height),
				hash: blockHash(b.hash),
				previous,
				timestamp: count(b.timestamp),
				miner: b.miner as string | null,
				reward: b.reward === null ? null : integer(b.reward),
				denomination,
				transactions: count(b.transactions),
				dataSize: b.dataSize === null ? null : integer(b.dataSize),
				weaveSize: b.weaveSize === null ? null : integer(b.weaveSize),
			};
		});
		if (new Set(blocks.map((b) => b.hash)).size !== blocks.length) return null;
		if (blocks.some((b, i) => i > 0 && (blocks[i - 1].height !== b.height + 1 || blocks[i - 1].previous !== b.hash)))
			return null;
		return blocks;
	} catch {
		return null;
	}
}
export async function readNodeHistory(node: string, network: string) {
	return parseCachedBlocks(await readNodeCache('history', node, network));
}
export function saveNodeHistory(node: string, network: string, blocks: NodeBlock[]) {
	return writeNodeCache('history', node, blocks, network);
}
export async function readNodeInfo(node: string): Promise<NodeInfo | null> {
	try {
		const b = record(await readNodeCache('info', node));
		if (
			typeof b.network !== 'string' ||
			b.network.length > 256 ||
			(b.gitHash !== null && typeof b.gitHash !== 'string')
		)
			return null;
		return {
			network: b.network,
			height: count(b.height),
			hash: blockHash(b.hash),
			version: count(b.version),
			release: count(b.release),
			peers: count(b.peers),
			queueLength: b.queueLength === null ? null : count(b.queueLength),
			latency: b.latency === null ? null : count(b.latency),
			blocks: b.blocks === null ? null : count(b.blocks),
			gitHash: b.gitHash as string | null,
		};
	} catch {
		return null;
	}
}
export async function getCachedNodeHistories(): Promise<CachedNodeHistory[]> {
	const db = await database();
	if (!db) return [];
	return new Promise((resolve) => {
		try {
			const transaction = db.transaction(STORE, 'readonly');
			const request = transaction.objectStore(STORE).index('kind').getAll('history');
			transaction.oncomplete = () => {
				db.close();
				resolve(
					(request.result as Entry[]).flatMap((entry) => {
						const blocks = parseCachedBlocks(entry.value);
						return blocks && normalizeArweaveNode(entry.node) && typeof entry.scope === 'string'
							? [{ node: entry.node, network: entry.scope, savedAt: entry.savedAt, blocks }]
							: [];
					})
				);
			};
			transaction.onerror = transaction.onabort = () => {
				db.close();
				resolve([]);
			};
		} catch {
			db.close();
			resolve([]);
		}
	});
}

export type MempoolSnapshot = {
	ids: string[];
	firstSeen: Record<string, number>;
	checkedAt: number;
	added: string[];
	removed: string[];
	isBaseline: boolean;
};
export function parseMempoolSnapshot(value: unknown): MempoolSnapshot | null {
	if (!value || typeof value !== 'object') return null;
	const snapshot = value as Partial<MempoolSnapshot>;
	const validIds = (ids: unknown): ids is string[] =>
		Array.isArray(ids) &&
		ids.length <= 50000 &&
		ids.every((id) => typeof id === 'string' && /^[\w-]{43}$/.test(id)) &&
		new Set(ids).size === ids.length;
	if (
		!validIds(snapshot.ids) ||
		!validIds(snapshot.added) ||
		!validIds(snapshot.removed) ||
		!snapshot.firstSeen ||
		typeof snapshot.firstSeen !== 'object' ||
		typeof snapshot.isBaseline !== 'boolean' ||
		!Number.isSafeInteger(snapshot.checkedAt) ||
		snapshot.checkedAt < 0 ||
		snapshot.checkedAt > Date.now()
	)
		return null;
	const firstSeen: Record<string, number> = {};
	for (const id of snapshot.ids) {
		const time = snapshot.firstSeen[id];
		if (!Number.isSafeInteger(time) || time < 0 || time > snapshot.checkedAt) return null;
		firstSeen[id] = time;
	}
	return {
		ids: snapshot.ids,
		added: snapshot.added,
		removed: snapshot.removed,
		firstSeen,
		checkedAt: snapshot.checkedAt,
		isBaseline: snapshot.isBaseline,
	};
}

export async function readNodeMempool(node: string, network = '') {
	return parseMempoolSnapshot(await readNodeCache('pending', node, network));
}
export function saveNodeMempool(node: string, value: MempoolSnapshot, network = '') {
	return writeNodeCache('pending', node, value, network);
}
