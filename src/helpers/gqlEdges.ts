type GqlEdgeLike = { node: { id: string; block?: unknown } };

function isConfirmedEdge(edge: GqlEdgeLike) {
	return edge.node.block !== null && edge.node.block !== undefined;
}

/**
 * Keeps one edge per transaction ID. A gateway can index a transaction more than once, for example as a confirmed copy
 * and a pending copy with `block: null`. The first confirmed copy wins and keeps its own position, which matches the
 * gateway's height ordering; otherwise the first copy wins. Edges without an ID are kept because they cannot be matched.
 */
export function dedupeGqlEdgesById<T extends GqlEdgeLike>(edges: readonly T[]): T[] {
	const keptEdges: (T | null)[] = [];
	const keptById = new Map<string, { edge: T; index: number }>();

	for (const edge of edges) {
		const id = edge.node?.id;
		if (!id) {
			keptEdges.push(edge);
			continue;
		}

		const kept = keptById.get(id);
		if (!kept) {
			keptById.set(id, { edge, index: keptEdges.push(edge) - 1 });
			continue;
		}

		if (isConfirmedEdge(kept.edge) || !isConfirmedEdge(edge)) continue;

		keptEdges[kept.index] = null;
		keptById.set(id, { edge, index: keptEdges.push(edge) - 1 });
	}

	return keptEdges.filter((edge): edge is T => edge !== null);
}
