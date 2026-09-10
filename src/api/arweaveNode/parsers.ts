import { checkValidAddress } from 'helpers/utils';

import type { NodeBlock, NodeInfo, NodeTransaction } from './types';
import { ArweaveNodeError } from './types';

export function record(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ArweaveNodeError('invalid-response');
	return value as Record<string, unknown>;
}
export function integer(value: unknown): string {
	if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return String(value);
	if (typeof value === 'string' && /^\d{1,100}$/.test(value)) return BigInt(value).toString();
	throw new ArweaveNodeError('invalid-response');
}
export function count(value: unknown): number {
	const result = Number(integer(value));
	if (!Number.isSafeInteger(result)) throw new ArweaveNodeError('invalid-response');
	return result;
}
export function blockHash(value: unknown): string {
	if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{64}$/.test(value)) throw new ArweaveNodeError('invalid-response');
	return value;
}
export function parseInfo(value: unknown): NodeInfo {
	const info = record(value);
	if (typeof info.network !== 'string' || !info.network || info.network.length > 256)
		throw new ArweaveNodeError('invalid-response');
	return {
		network: info.network,
		height: count(info.height),
		hash: blockHash(info.current),
		version: count(info.version),
		release: count(info.release),
		peers: count(info.peers),
		queueLength: info.queue_length == null ? null : count(info.queue_length),
		latency: info.node_state_latency == null ? null : count(info.node_state_latency),
		blocks: info.blocks == null ? null : count(info.blocks),
		gitHash: typeof info.git_hash === 'string' && /^[a-f0-9]{7,64}$/i.test(info.git_hash) ? info.git_hash : null,
	};
}
export function parseBlock(value: unknown): NodeBlock {
	const block = record(value);
	const height = count(block.height);
	if (!Array.isArray(block.txs) || block.txs.length > 100_000) throw new ArweaveNodeError('invalid-response');
	const miner = block.reward_addr;
	if (miner !== 'unclaimed' && !checkValidAddress(typeof miner === 'string' ? miner : null))
		throw new ArweaveNodeError('invalid-response');
	const timestamp = count(block.timestamp);
	if (!Number.isFinite(new Date(timestamp * 1000).getTime())) throw new ArweaveNodeError('invalid-response');
	return {
		height,
		hash: blockHash(block.indep_hash),
		previous: height === 0 ? '' : blockHash(block.previous_block),
		timestamp,
		miner: miner === 'unclaimed' ? null : String(miner),
		reward: block.reward == null ? null : integer(block.reward),
		denomination: count(block.denomination ?? 1),
		transactions: block.txs.length,
		dataSize: block.block_size == null ? null : integer(block.block_size),
		weaveSize: block.weave_size == null ? null : integer(block.weave_size),
	};
}
export function parsePending(value: unknown): string[] {
	if (
		!Array.isArray(value) ||
		value.length > 50_000 ||
		value.some((id) => typeof id !== 'string' || !checkValidAddress(id))
	)
		throw new ArweaveNodeError('invalid-response');
	return [...new Set<string>(value)];
}
export async function parseTransaction(value: unknown, id: string): Promise<NodeTransaction> {
	const tx = record(value);
	if (tx.id !== id || !Array.isArray(tx.tags) || tx.tags.length > 2048) throw new ArweaveNodeError('invalid-response');
	const tags = new Map<string, string>();
	const decodedTags: NodeTransaction['tags'] = [];
	for (const raw of tx.tags) {
		const tag = record(raw);
		if (typeof tag.name !== 'string' || typeof tag.value !== 'string' || tag.name.length + tag.value.length > 32_768)
			throw new ArweaveNodeError('invalid-response');
		try {
			const decode = (text: string) =>
				new TextDecoder().decode(
					Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0))
				);
			const decoded = { name: decode(tag.name), value: decode(tag.value) };
			decodedTags.push(decoded);
			tags.set(decoded.name.toLowerCase(), decoded.value);
		} catch {
			throw new ArweaveNodeError('invalid-response');
		}
	}
	let owner: string | null = null;
	if (tx.owner) {
		if (typeof tx.owner !== 'string' || tx.owner.length % 4 === 1 || !/^[A-Za-z0-9_-]{1,1024}$/.test(tx.owner))
			throw new ArweaveNodeError('invalid-response');
		const bytes = Uint8Array.from(atob(tx.owner.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0));
		const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
		owner = btoa(String.fromCharCode(...digest))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');
	}
	if (tx.target && (typeof tx.target !== 'string' || !checkValidAddress(tx.target)))
		throw new ArweaveNodeError('invalid-response');

	return {
		id,
		tags: decodedTags,
		owner,
		recipient: typeof tx.target === 'string' && tx.target ? tx.target : null,
		quantity: integer(tx.quantity),
		fee: integer(tx.reward),
		dataSize: integer(tx.data_size),
		denomination: count(tx.denomination ?? 1),
		contentType: tags.get('content-type') ?? null,
		appName: tags.get('app-name') ?? null,
	};
}
