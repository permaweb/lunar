import fc from 'fast-check';
import { expect, it } from 'vitest';

import { arrangeGraph } from '../../../src/features/AoCore/model/graph';

it('keeps arbitrary expanded message trees ordered and free of overlapping cards', () => {
	fc.assert(
		fc.property(fc.array(fc.nat(), { maxLength: 99 }), (parents) => {
			const entries: { id: string; parent?: string }[] = [{ id: 'root' }];
			for (const [index, parent] of parents.entries()) {
				entries.push({ id: String(index), parent: entries[parent % entries.length].id });
			}
			const positions = arrangeGraph(entries, 420, 470);
			expect(positions.size).toBe(entries.length);
			for (const entry of entries) {
				const position = positions.get(entry.id);
				expect(position.x).toBeGreaterThanOrEqual(0);
				expect(position.y).toBeGreaterThanOrEqual(0);
				if (entry.parent) expect(position.x).toBeGreaterThan(positions.get(entry.parent).x + 420);
			}
			const cards = [...positions.values()];
			for (let i = 0; i < cards.length; i++) {
				for (let j = i + 1; j < cards.length; j++) {
					expect(Math.abs(cards[i].x - cards[j].x) >= 420 || Math.abs(cards[i].y - cards[j].y) >= 470).toBe(true);
				}
			}
		})
	);
});
