import { expect, it } from 'vitest';

import { createRequestQueue } from '../../src/api/nodes/requestQueue';

it.each([2, 8])('limits active requests to %s and removes cancelled queued work', async (limit) => {
	const enqueue = createRequestQueue(limit);
	let active = 0;
	let maximum = 0;
	const started: number[] = [];
	const releases: Array<() => void> = [];
	const controllers = Array.from({ length: limit + 2 }, () => new AbortController());
	const requests = controllers.map((controller, index) =>
		enqueue(async () => {
			started.push(index);
			active++;
			maximum = Math.max(maximum, active);
			await new Promise<void>((resolve) => releases.push(resolve));
			active--;
			return index;
		}, controller.signal)
	);
	const cancelled = expect(requests[limit]).rejects.toMatchObject({ code: 'cancelled' });
	await Promise.resolve();
	expect(started).toEqual(Array.from({ length: limit }, (_, index) => index));
	controllers[limit].abort();
	await cancelled;
	releases.shift()();
	await requests[0];
	await new Promise((resolve) => setTimeout(resolve, 0));
	expect(started).toEqual([...Array.from({ length: limit }, (_, index) => index), limit + 1]);
	for (const release of releases) release();
	await Promise.all(requests.filter((_, index) => index !== limit));
	expect(maximum).toBe(limit);
});
