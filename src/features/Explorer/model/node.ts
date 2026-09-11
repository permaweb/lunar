import type { NodeBlock, NodeErrorCode, NodeTransaction } from 'api/arweaveNode';
import { ArweaveNodeError } from 'api/arweaveNode';
import type { GQLEdge, TransactionNode } from 'api/blocks';

export const NODE_PAGE_SIZE = 25;
export const NODE_HISTORY_BATCH = 100;
export const NODE_HISTORY_LIMIT = 5000;
export const NODE_REFRESH_MS = 60_000;

export type ResourceState<T> =
	| { status: 'idle' | 'loading' }
	| { status: 'success' | 'refreshing'; data: T }
	| { status: 'stale'; data: T; error: NodeErrorCode }
	| { status: 'error'; error: NodeErrorCode };

export function nodeError(error: unknown): NodeErrorCode {
	return error instanceof ArweaveNodeError ? error.code : 'unavailable';
}

export function formatNodeAmount(value: string | null, denomination = 1): string {
	if (value === null) return '—';
	if (denomination > 1) return `${BigInt(value).toLocaleString()} Winston (${denomination})`;
	const amount = BigInt(value);
	const whole = (amount / 1_000_000_000_000n).toLocaleString();
	const fraction = (amount % 1_000_000_000_000n).toString().padStart(12, '0').replace(/0+$/, '');
	const separator = new Intl.NumberFormat().formatToParts(1.1).find((part) => part.type === 'decimal')?.value ?? '.';
	return `${whole}${fraction ? separator + fraction : ''} AR`;
}

export function formatNodeRewardTotal(value: string, denomination = 1): string {
	if (denomination > 1) return formatNodeAmount(value, denomination);
	// Round in Winston before formatting so large totals never lose integer precision.
	const hundredths = (BigInt(value) + 5_000_000_000n) / 10_000_000_000n;
	const whole = (hundredths / 100n).toLocaleString();
	const fraction = (hundredths % 100n).toString().padStart(2, '0');
	const separator = new Intl.NumberFormat().formatToParts(1.1).find((part) => part.type === 'decimal')?.value ?? '.';
	return `${whole}${separator}${fraction} AR`;
}

export function formatNodeBytes(value: string | null): string {
	if (value === null) return '—';
	const bytes = BigInt(value);
	for (const [unit, size] of [
		['TiB', 1024n ** 4n],
		['GiB', 1024n ** 3n],
		['MiB', 1024n ** 2n],
		['KiB', 1024n],
	] as const) {
		if (bytes >= size) return `${(Number((bytes * 10n) / size) / 10).toLocaleString()} ${unit}`;
	}
	return `${bytes.toLocaleString()} B`;
}

/** Keep older observations only if the freshly read chain links to them. */
export function mergeNodeHistory(previous: NodeBlock[], recent: NodeBlock[]): NodeBlock[] {
	if (!recent.length) return previous;
	const oldest = recent[recent.length - 1];
	const continuation = previous.findIndex(
		(block) => block.height === oldest.height - 1 && block.hash === oldest.previous
	);
	return [...recent, ...(continuation < 0 ? [] : previous.slice(continuation))].slice(0, NODE_HISTORY_LIMIT);
}

export function getIndexedMiners(blocks: NodeBlock[]): { address: string; count: number; last: NodeBlock }[] {
	const miners = new Map<string, { address: string; count: number; last: NodeBlock }>();
	for (const block of blocks) {
		if (!block.miner) continue;
		const miner = miners.get(block.miner);
		if (miner) {
			miner.count++;
			if (block.height > miner.last.height) miner.last = block;
		} else miners.set(block.miner, { address: block.miner, count: 1, last: block });
	}
	return [...miners.values()].sort(
		(a, b) => b.count - a.count || b.last.height - a.last.height || a.address.localeCompare(b.address)
	);
}

export function sumMiningRewards(blocks: NodeBlock[]) {
	const totals = new Map<number, bigint>();
	const seen = new Set<string>();
	let incomplete = false;
	for (const block of blocks) {
		if (!block.miner || seen.has(block.hash)) continue;
		seen.add(block.hash);
		if (block.reward === null) incomplete = true;
		else totals.set(block.denomination, (totals.get(block.denomination) ?? 0n) + BigInt(block.reward));
	}
	return {
		incomplete,
		amounts: [...totals]
			.sort(([a], [b]) => a - b)
			.map(([denomination, total]) => ({ denomination, value: total.toString() })),
	};
}

/** Page by transaction counts so indexing never retains every transaction ID. */
export function getNodeTransactionPage(blocks: NodeBlock[], page: number) {
	const count = blocks.reduce((total, block) => total + block.transactions, 0);
	const totalPages = Math.max(1, Math.ceil(count / NODE_PAGE_SIZE));
	const currentPage = Math.max(0, Math.min(page, totalPages - 1));
	const segments: { block: NodeBlock; offset: number; count: number }[] = [];
	let skip = currentPage * NODE_PAGE_SIZE;
	let remaining = NODE_PAGE_SIZE;
	for (const block of blocks) {
		if (skip >= block.transactions) {
			skip -= block.transactions;
			continue;
		}
		const size = Math.min(remaining, block.transactions - skip);
		segments.push({ block, offset: skip, count: size });
		remaining -= size;
		skip = 0;
		if (!remaining) break;
	}
	return { count, totalPages, currentPage, segments };
}

export function toNodeTransactionEdge(id: string, tx?: NodeTransaction, block?: NodeBlock): GQLEdge<TransactionNode> {
	return {
		cursor: id,
		node: {
			id,
			tags: tx?.tags ?? [],
			block: block ? { height: block.height, timestamp: block.timestamp } : undefined,
			owner: tx?.owner ? { address: tx.owner } : undefined,
			recipient: tx?.recipient ?? undefined,
			quantity: tx?.denomination === 1 ? { winston: tx.quantity } : undefined,
			fee: tx?.denomination === 1 ? { winston: tx.fee } : undefined,
			data: tx ? { size: tx.dataSize, type: tx.contentType ?? '' } : undefined,
		},
	};
}

export type MempoolSnapshot = {
	ids: string[];
	firstSeen: Record<string, number>;
	checkedAt: number;
	added: string[];
	removed: string[];
	isBaseline: boolean;
};
export function observeMempool(previous: MempoolSnapshot | null, ids: string[], checkedAt: number): MempoolSnapshot {
	const old = new Set(previous?.ids ?? []);
	const next = new Set(ids);
	return {
		ids,
		checkedAt,
		isBaseline: previous === null,
		firstSeen: Object.fromEntries(ids.map((id) => [id, previous?.firstSeen[id] ?? checkedAt])),
		added: previous ? ids.filter((id) => !old.has(id)) : [],
		removed: previous ? previous.ids.filter((id) => !next.has(id)) : [],
	};
}
