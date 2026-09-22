import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { dedupeGqlEdgesById } from '../../src/helpers/gqlEdges';

type TestEdge = { cursor: string; node: { id: string; block: { height: number; timestamp: number } | null } };

const B96U = 'B96Uvs5eF3muB-KYuubbeA5KrROSPjqKgbYgn_4CeME';
const BVX2 = 'Bvx2P9IP8zpLYm8N2FttNiuqRaWP0ZIWPMpXaaEq7h0';
const FUQO = 'fUQo-wDzhdmNuS2NJxL0z8QDepdwAiRgdPbujb9wClg';
const SUZ9 = 'suz9pH8HYQbmzhhU-UaudmHf2_9l4qiyStyrYWxNcMc';

function confirmed(id: string, cursor: string, height = 2006276): TestEdge {
	return { cursor, node: { id, block: { height, timestamp: 1790089844 } } };
}

function pending(id: string): TestEdge {
	return { cursor: `member=-1${id}`, node: { id, block: null } };
}

const edgeArbitrary = fc.record({
	id: fc.constantFrom('a', 'b', 'c', 'd', ''),
	isConfirmed: fc.boolean(),
});

function toEdges(specs: { id: string; isConfirmed: boolean }[]): TestEdge[] {
	return specs.map((spec, index) => ({
		cursor: `cursor-${index}`,
		node: { id: spec.id, block: spec.isConfirmed ? { height: 1000 - index, timestamp: index } : null },
	}));
}

describe('dedupeGqlEdgesById', () => {
	it('returns unique edges unchanged and in order', () => {
		const edges = [confirmed(B96U, 'c1'), confirmed(BVX2, 'c2'), pending(SUZ9)];

		const result = dedupeGqlEdgesById(edges);

		expect(result).toEqual(edges);
		result.forEach((edge, index) => expect(edge).toBe(edges[index]));
	});

	it('drops a pending copy that follows its confirmed copy', () => {
		// arweave.net returns the confirmed copy first and sorts the pending copy (cursor -1) to the end.
		const edges = [confirmed(B96U, 'c1'), confirmed(SUZ9, 'c2'), pending(B96U)];

		expect(dedupeGqlEdgesById(edges)).toEqual([edges[0], edges[1]]);
	});

	it('replaces an earlier pending copy with the confirmed copy at its own position', () => {
		const edges = [pending(B96U), confirmed(SUZ9, 'c1', 2006300), confirmed(B96U, 'c2', 2006276)];

		expect(dedupeGqlEdgesById(edges)).toEqual([edges[1], edges[2]]);
	});

	it('keeps the first of several confirmed copies', () => {
		const edges = [
			confirmed(BVX2, 'c1', 2005617),
			confirmed(FUQO, 'c2', 2005617),
			confirmed(BVX2, 'c3', 2005617),
			confirmed(BVX2, 'c4', 2005617),
			confirmed(FUQO, 'c5', 2005617),
			confirmed(BVX2, 'c6', 2005617),
		];

		expect(dedupeGqlEdgesById(edges).map((edge) => edge.cursor)).toEqual(['c1', 'c2']);
	});

	it('keeps the first copy when every copy is pending', () => {
		const first = pending(B96U);

		expect(dedupeGqlEdgesById([first, pending(B96U)])).toEqual([first]);
	});

	it('treats a missing block like a pending copy', () => {
		const withoutBlock = { cursor: 'c1', node: { id: B96U } };
		const withBlock = { cursor: 'c2', node: { id: B96U, block: { height: 1, timestamp: 1 } } };

		expect(dedupeGqlEdgesById([withoutBlock, withBlock])).toEqual([withBlock]);
	});

	it('keeps edges without an id', () => {
		const edges = toEdges([
			{ id: '', isConfirmed: true },
			{ id: '', isConfirmed: false },
		]);

		expect(dedupeGqlEdgesById(edges)).toEqual(edges);
	});

	it('does not mutate its input', () => {
		const edges = [pending(B96U), confirmed(B96U, 'c1')];
		const snapshot = structuredClone(edges);

		dedupeGqlEdgesById(edges);

		expect(edges).toEqual(snapshot);
	});

	it('returns an empty list for no edges', () => {
		expect(dedupeGqlEdgesById([])).toEqual([]);
	});

	it('keeps one edge per id, preferring a confirmed copy, as an ordered subset of the input', () => {
		fc.assert(
			fc.property(fc.array(edgeArbitrary, { maxLength: 40 }), (specs) => {
				const edges = toEdges(specs);
				const result = dedupeGqlEdgesById(edges);
				const resultIds = result.map((edge) => edge.node.id).filter(Boolean);

				expect(new Set(resultIds).size).toBe(resultIds.length);
				expect(new Set(resultIds)).toEqual(new Set(edges.map((edge) => edge.node.id).filter(Boolean)));

				for (const id of resultIds) {
					const hasConfirmedCopy = edges.some((edge) => edge.node.id === id && edge.node.block !== null);
					const kept = result.find((edge) => edge.node.id === id);
					expect(kept.node.block !== null).toBe(hasConfirmedCopy);
				}

				const inputPositions = result.map((edge) => edges.indexOf(edge));
				expect(inputPositions).toEqual([...inputPositions].sort((a, b) => a - b));
			})
		);
	});

	it('gives the same result when applied chunk by chunk as when applied to the whole list', () => {
		fc.assert(
			fc.property(
				fc.array(edgeArbitrary, { maxLength: 40 }),
				fc.array(fc.nat({ max: 40 }), { maxLength: 5 }),
				(specs, splitPoints) => {
					const edges = toEdges(specs);
					const boundaries = [...new Set([0, ...splitPoints.map((point) => Math.min(point, edges.length))])].sort(
						(a, b) => a - b
					);
					let accumulated: TestEdge[] = [];

					boundaries.forEach((start, index) => {
						const chunk = edges.slice(start, boundaries[index + 1] ?? edges.length);
						const next = dedupeGqlEdgesById([...accumulated, ...chunk]);
						expect(next.length).toBeLessThanOrEqual(accumulated.length + chunk.length);
						accumulated = next;
					});

					expect(accumulated).toEqual(dedupeGqlEdgesById(edges));
				}
			)
		);
	});
});
