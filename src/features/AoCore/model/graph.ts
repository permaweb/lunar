import type { MessageValue } from 'api/aoCore';

export const MAX_GRAPH_NODES = 100;

export type GraphEntry = {
	id: string;
	parent?: string;
	fieldKey?: string;
	linkId?: string;
	ancestors: string[];
	depth: number;
	isCommitmentMetadata: boolean;
	content:
		| { status: 'ready'; value: MessageValue; provider?: string }
		| { status: 'loading' }
		| { status: 'blocked'; reason: 'cycle' | 'depth' }
		| { status: 'error'; code: 'unavailable' | 'timeout' | 'invalid-response' };
};

export function removeGraphBranch(entries: GraphEntry[], id: string): GraphEntry[] {
	const removed = new Set([id]);
	// Parents always precede descendants in the graph's insertion order.
	for (const entry of entries) if (removed.has(entry.parent)) removed.add(entry.id);
	return entries.filter((entry) => !removed.has(entry.id));
}

// Each expansion is a separate occurrence with one parent, even when IDs repeat.
// Allocate one vertical band per subtree so siblings and descendants cannot overlap.
export function arrangeGraph(entries: Pick<GraphEntry, 'id' | 'parent'>[], width: number, height: number) {
	const children = new Map<string | undefined, string[]>();
	for (const entry of entries) children.set(entry.parent, [...(children.get(entry.parent) ?? []), entry.id]);
	const spans = new Map<string, number>();
	function measure(id: string): number {
		const span = Math.max(
			1,
			(children.get(id) ?? []).reduce((total, child) => total + measure(child), 0)
		);
		spans.set(id, span);
		return span;
	}
	const positions = new Map<string, { x: number; y: number }>();
	function place(id: string, depth: number, start: number) {
		positions.set(id, { x: depth * (width + 150), y: (start + (spans.get(id) - 1) / 2) * (height + 60) });
		let offset = start;
		for (const child of children.get(id) ?? []) {
			place(child, depth + 1, offset);
			offset += spans.get(child);
		}
	}
	let offset = 0;
	for (const root of children.get(undefined) ?? []) {
		const span = measure(root);
		place(root, 0, offset);
		offset += span;
	}
	return positions;
}
