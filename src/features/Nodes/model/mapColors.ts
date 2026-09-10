function hash(value: string): number {
	let result = 2166136261;
	for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16777619);
	return result >>> 0;
}

function colorDistance(first: string, second: string): number {
	const a = Number.parseInt(first.slice(1), 16);
	const b = Number.parseInt(second.slice(1), 16);
	return [16, 8, 0].reduce((distance, shift) => distance + (((a >> shift) & 255) - ((b >> shift) & 255)) ** 2, 0);
}

export function getCountryColors(ids: string[], neighbors: number[][], palette: string[]): string[] {
	const colors = [...new Set(palette)];
	if (!colors.length) return [];
	const assigned: string[] = [];
	// Color countries with the most borders first. Country IDs seed the shuffle,
	// so updates to node counts or their order never reshuffle the map.
	const order = ids
		.map((id, index) => ({ id, index }))
		.sort((a, b) => neighbors[b.index].length - neighbors[a.index].length || hash(a.id) - hash(b.id));
	for (const { id, index } of order) {
		const surrounding = neighbors[index].map((neighbor) => assigned[neighbor]).filter(Boolean);
		const candidates = [...colors].sort((a, b) => hash(`${id}:${a}`) - hash(`${id}:${b}`));
		let best = candidates[0];
		let bestDistance = -1;
		for (const candidate of candidates) {
			const distance = Math.min(...surrounding.map((color) => colorDistance(candidate, color)));
			if (distance > bestDistance) {
				best = candidate;
				bestDistance = distance;
			}
			// Skip identical and near-matching shades while retaining varied choices.
			if (distance >= 90 ** 2) break;
		}
		assigned[index] = best;
	}
	return assigned;
}
