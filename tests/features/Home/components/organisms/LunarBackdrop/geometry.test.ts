import { expect, it } from 'vitest';

import { createStarField } from '../../../../../../src/features/Home/components/organisms/LunarBackdrop/geometry';

it('keeps the seeded star field finite and inside the viewport at both rendering budgets', () => {
	for (const count of [700, 2200]) {
		const stars = createStarField(count);
		expect(stars.positions).toHaveLength(count * 3);
		for (let i = 0; i < count; i++) {
			for (const position of stars.positions.subarray(i * 3, i * 3 + 3)) {
				expect(position).toBeGreaterThanOrEqual(-1);
				expect(position).toBeLessThanOrEqual(1);
			}
			expect(stars.brightness[i]).toBeGreaterThan(0);
			expect(stars.brightness[i]).toBeLessThanOrEqual(1);
			expect(stars.sizes[i]).toBeGreaterThan(0);
			expect(stars.sizes[i]).toBeLessThanOrEqual(7);
		}
	}
	expect(createStarField(100)).toEqual(createStarField(100));
});
