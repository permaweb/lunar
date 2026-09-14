/**
 * Pure validation and graph construction for node-reported recent forks.
 * No DOM or network access. Public operations follow the data flow: parse,
 * match historical comparisons, build validated links, then focus and lay out.
 */

import { count as height, record as object } from './parsers';
import { ArweaveNodeError } from './types';
const BLOCK_ID = /^[\w-]{64}$/;
const TX_ID = /^[\w-]{43}$/;

export interface RecentBlock {
	id: string;
	height: number;
	received?: number;
}
export interface RecentFork {
	id: string;
	height: number;
	timestamp: number;
	blocks: string[];
}
export interface RecentSnapshot {
	blocks: RecentBlock[];
	forks: RecentFork[];
	forksAvailable: boolean;
}
export interface ForkComparison {
	id: string;
	height: number;
	parent: string;
}
export interface ForkNode {
	id: string;
	hash?: string;
	height: number;
	state: 'chain' | 'history' | 'orphan' | 'context' | 'unknown';
	received?: number;
	orphanedAt?: number;
	lane: number;
	row: number;
}
export interface ForkGraph {
	nodes: ForkNode[];
	edges: { parent: string; child: string }[];
	heights: number[];
	lanes: number;
}

/** Validate bounded recent history, preserving native oldest-first orphan-branch order. */
export function parseRecent(value: unknown): RecentSnapshot {
	const data = object(value);
	if (!Array.isArray(data.blocks) || data.blocks.length > 512) {
		throw new ArweaveNodeError('invalid-response');
	}
	/** Reject malformed native block identifiers before graph construction. */
	const blockID = (value: unknown): string => {
		if (typeof value !== 'string' || !BLOCK_ID.test(value)) throw new ArweaveNodeError('invalid-response');
		return value;
	};
	const blocks = data.blocks
		.map((entry) => {
			const block = object(entry);
			return {
				id: blockID(block.id),
				height: height(block.height),
				received: block.received === 'pending' ? undefined : height(block.received),
			};
		})
		.sort((a, b) => b.height - a.height);
	if (
		new Set(blocks.map((block) => block.height)).size !== blocks.length ||
		new Set(blocks.map((block) => block.id)).size !== blocks.length
	) {
		throw new ArweaveNodeError('invalid-response');
	}
	const forksAvailable = data.forks !== 'error' && data.forks !== undefined;
	if (!forksAvailable) return { blocks, forks: [], forksAvailable: false };
	if (!Array.isArray(data.forks) || data.forks.length > 100) {
		throw new ArweaveNodeError('invalid-response');
	}
	let count = blocks.length;
	const forks = data.forks
		.map((entry) => {
			const fork = object(entry);
			if (typeof fork.id !== 'string' || !TX_ID.test(fork.id) || !Array.isArray(fork.blocks) || !fork.blocks.length)
				throw new ArweaveNodeError('invalid-response');
			count += fork.blocks.length;
			if (count > 2048) throw new ArweaveNodeError('invalid-response');
			const ids = fork.blocks.map(blockID);
			if (new Set(ids).size !== ids.length) throw new ArweaveNodeError('invalid-response');
			const first = height(fork.height);
			if (first === 0) throw new ArweaveNodeError('invalid-response');
			height(first + ids.length - 1);
			return { id: fork.id, height: first, timestamp: height(fork.timestamp), blocks: ids };
		})
		.sort((a, b) => b.timestamp - a.timestamp || a.id.localeCompare(b.id));
	const snapshot = { blocks, forks, forksAvailable: true };
	// Catch inconsistent heights and parent links before requesting any headers.
	buildForkGraph(snapshot);
	return snapshot;
}

/** Accept canonical comparisons only when they extend a known fork parent or matched branch. */
export function matchingForkComparisons(
	snapshot: RecentSnapshot,
	parents: Map<string, string>,
	comparisons: ForkComparison[]
): ForkComparison[] {
	const accepted = new Map<string, ForkComparison>();
	for (const block of [...comparisons].sort((a, b) => a.height - b.height)) {
		const previous = accepted.get(block.parent);
		if (
			snapshot.forks.some(
				(fork) =>
					fork.height <= block.height &&
					block.height < fork.height + fork.blocks.length &&
					((fork.height === block.height && parents.get(fork.blocks[0]!) === block.parent) ||
						previous?.height === block.height - 1)
			)
		) {
			accepted.set(block.id, block);
		}
	}
	return [...accepted.values()];
}

/** Merge observations into a parent-linked graph, rejecting contradictory heights or parents. */
export function buildForkGraph(
	snapshot: RecentSnapshot,
	parents = new Map<string, string>(),
	comparisons: ForkComparison[] = [],
	focus: 'all' | 'forks' = 'all'
): ForkGraph {
	const nodes = new Map<string, ForkNode>();
	const links = new Map<string, string>();
	/** Merge observations of the same hash while requiring an identical height. */
	const add = (id: string, blockHeight: number, state: ForkNode['state']): ForkNode => {
		const existing = nodes.get(id);
		if (existing) {
			if (existing.height !== blockHeight) throw new ArweaveNodeError('invalid-response');
			return existing;
		}
		const node: ForkNode = {
			id,
			hash: state === 'unknown' ? undefined : id,
			height: blockHeight,
			state,
			lane: 0,
			row: 0,
		};
		nodes.set(id, node);
		return node;
	};
	/** Require adjacent heights and one parent per child before accepting an edge. */
	const connect = (parent: string, child: string) => {
		if (
			nodes.get(parent)!.height + 1 !== nodes.get(child)!.height ||
			(links.has(child) && links.get(child) !== parent)
		) {
			throw new ArweaveNodeError('invalid-response');
		}
		links.set(child, parent);
	};
	for (const block of snapshot.blocks) add(block.id, block.height, 'chain').received = block.received;
	for (const fork of snapshot.forks) {
		fork.blocks.forEach((id, index) => {
			const node = add(id, fork.height + index, 'orphan');
			node.orphanedAt = Math.max(node.orphanedAt ?? 0, fork.timestamp);
		});
	}
	const current = new Map(snapshot.blocks.map((block) => [block.height, block.id]));
	for (const block of snapshot.blocks) {
		const parent = current.get(block.height - 1);
		if (parent) connect(parent, block.id);
	}
	// The native fork block list is ordered oldest first, starting at fork.height.
	for (const fork of snapshot.forks) {
		for (let i = 1; i < fork.blocks.length; i++) connect(fork.blocks[i - 1]!, fork.blocks[i]!);
		const first = fork.blocks[0]!;
		const parent = parents.get(first);
		if (parent) {
			if (!BLOCK_ID.test(parent)) throw new ArweaveNodeError('invalid-response');
			add(parent, fork.height - 1, 'context');
			connect(parent, first);
		}
	}
	const matching = matchingForkComparisons(snapshot, parents, comparisons);
	if (matching.length !== comparisons.length) throw new ArweaveNodeError('invalid-response');
	for (const comparison of matching) {
		if (!BLOCK_ID.test(comparison.id) || !BLOCK_ID.test(comparison.parent)) {
			throw new ArweaveNodeError('invalid-response');
		}
		const parent = add(comparison.parent, comparison.height - 1, 'history');
		const child = add(comparison.id, comparison.height, 'history');
		for (const node of [parent, child]) if (node.state !== 'chain') node.state = 'history';
		connect(parent.id, child.id);
	}
	for (const fork of snapshot.forks) {
		const first = fork.blocks[0]!;
		if (!links.has(first) && nodes.get(first)!.state !== 'chain') {
			const parent = `unknown:${first}`;
			add(parent, fork.height - 1, 'unknown');
			connect(parent, first);
		}
	}
	if (focus === 'forks') keepForkBranches(snapshot, nodes, links);
	return layoutForkGraph(nodes, links);
}

/** Retain reported branches and their immediate parents, plus exactly one current-tip reference. */
function keepForkBranches(snapshot: RecentSnapshot, nodes: Map<string, ForkNode>, links: Map<string, string>): void {
	const tip = snapshot.blocks.reduce<RecentBlock | undefined>(
		(tip, block) => (!tip || block.height > tip.height ? block : tip),
		undefined
	);
	const forkHeights = new Set(snapshot.forks.flatMap((fork) => fork.blocks.map((_, index) => fork.height + index)));
	const branches = new Set(
		[...nodes.values()].filter((node) => node.state !== 'chain' || forkHeights.has(node.height)).map((node) => node.id)
	);
	const keep = new Set(branches);
	if (tip) keep.add(tip.id);
	// Keep each branch's immediate parent, not the entire chain leading to it.
	// Read from the original branch set so added parents cannot extend it again.
	for (const [child, parent] of links) if (branches.has(child)) keep.add(parent);
	for (const node of nodes.values()) {
		if (!keep.has(node.id)) nodes.delete(node.id);
		else if (node.state === 'chain' && node.id !== tip?.id) node.state = 'history';
	}
	for (const [child, parent] of links) {
		if (!nodes.has(child) || !nodes.has(parent) || (child === tip?.id && !branches.has(child))) links.delete(child);
	}
}

/** Assign compact rows and reusable branch lanes without inventing unobserved blocks. */
function layoutForkGraph(nodes: Map<string, ForkNode>, links: Map<string, string>): ForkGraph {
	const ordered = [...nodes.values()].sort((a, b) => a.height - b.height || a.id.localeCompare(b.id));
	const continued = new Set<string>();
	const isChain = (node: ForkNode) => node.state === 'chain' || node.state === 'history';
	const lastHeight = new Map(ordered.map((node) => [node.id, node.height]));
	for (const node of [...ordered].reverse()) {
		const parent = links.get(node.id);
		if (parent) lastHeight.set(parent, Math.max(lastHeight.get(parent)!, lastHeight.get(node.id)!));
	}
	const laneEnds: number[] = ordered.some(isChain) ? [Infinity] : [];
	for (const node of ordered) {
		if (isChain(node)) continue;
		const parent = nodes.get(links.get(node.id) || '');
		if (parent && !isChain(parent) && !continued.has(parent.id)) {
			node.lane = parent.lane;
			continued.add(parent.id);
		} else {
			const reusable = laneEnds.findIndex((end) => end < (parent?.height ?? node.height));
			node.lane = reusable === -1 ? laneEnds.length : reusable;
			laneEnds[node.lane] = lastHeight.get(node.id)!;
		}
	}
	const heights = [...new Set(ordered.map((node) => node.height))].sort((a, b) => b - a);
	const rows = new Map(heights.map((height, row) => [height, row]));
	for (const node of ordered) node.row = rows.get(node.height)!;
	return {
		nodes: ordered,
		edges: [...links].map(([child, parent]) => ({ parent, child })),
		heights,
		lanes: laneEnds.length,
	};
}
