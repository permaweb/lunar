import fc from 'fast-check';
import { expect, it, vi } from 'vitest';

import { createAoReadTransport } from '../../src/api/aoNetwork';
import { createArweaveScheduleReader } from '../../src/api/permaweb/arweaveSchedule';
import { DEFAULT_AO_NETWORK } from '../../src/helpers/aoNetwork';
import { assignment, assignments, MESSAGE_ID, PROCESS_ID, SENDER } from '../fixtures/arweaveSchedule';

const settings = { ...DEFAULT_AO_NETWORK, peers: ['https://peer.example'] };
const json = (value: unknown) =>
	new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json' } });

function reader(payload: unknown = assignments(0, 1), latestSlot = 1) {
	const fetch = vi.fn(async (_input: RequestInfo | URL) => json(payload));
	const latest = vi.fn(async () => latestSlot);
	const transport = createAoReadTransport(settings, { fetch, injected: () => undefined });
	return { read: createArweaveScheduleReader(transport, latest), fetch, latest };
}

it('reads native JSON assignments, selecting tx@1.0 IDs and including the spawn at slot zero', async () => {
	const { read, fetch } = reader();
	const controller = new AbortController();
	const page = await read({ processId: PROCESS_ID, page: 0, signal: controller.signal });
	expect(page).toMatchObject({ latestSlot: 1, totalCount: 2, totalPages: 1, page: 0 });
	expect(page.messages).toMatchObject([
		{
			id: MESSAGE_ID,
			slot: 1,
			blockHeight: 1995397,
			blockIndex: 0,
			sender: SENDER,
			recipient: PROCESS_ID,
			action: 'make-offer',
		},
		{ id: PROCESS_ID, slot: 0, blockHeight: 1995392, blockIndex: 9, sender: SENDER, recipient: null, action: null },
	]);
	expect(page.messages[0].tags).toContainEqual({ name: 'offer-quantity', value: '6000000000000000000' });
	expect(page.messages[0].tags.some((tag) => tag.name === 'commitments')).toBe(false);
	const url = new URL(String(fetch.mock.calls[0][0]));
	expect(url.pathname).toBe(`/${PROCESS_ID}~process@1.0/schedule&from=0&to=1/assignments`);
	expect(url.searchParams.get('require-codec')).toBe('json@1.0');
	expect(url.searchParams.get('accept-bundle')).toBe('true');
});

it('keeps inputs assigned from other native recipients', async () => {
	const message = assignment(1);
	message.body.target = 'x'.repeat(43);
	const complete = reader({ 0: assignment(0), 1: { ...message, body: { ...message.body, 'assign-to': PROCESS_ID } } });
	expect((await complete.read({ processId: PROCESS_ID, page: 0 })).messages[0].recipient).toBe('x'.repeat(43));
});

it('pins pagination to the supplied latest slot and reads the tip only on refresh', async () => {
	const { read, latest, fetch } = reader(assignments(0, 0), 50);
	const page = await read({ processId: PROCESS_ID, page: 2, latestSlot: 50 });
	expect(page.messages.map((message) => message.slot)).toEqual([0]);
	expect(page).toMatchObject({ totalCount: 51, totalPages: 3 });
	expect(latest).not.toHaveBeenCalled();
	expect(String(fetch.mock.calls[0][0])).toContain('from=0&to=0');
});

it('treats only latest slot -1 as an empty schedule without requesting assignments', async () => {
	const { read, fetch } = reader({}, -1);
	expect(await read({ processId: PROCESS_ID, page: 0 })).toEqual({
		messages: [],
		latestSlot: -1,
		totalCount: 0,
		totalPages: 0,
		page: 0,
	});
	expect(fetch).not.toHaveBeenCalled();
	const spawn = reader({ 0: assignment(0) }, 0);
	expect((await spawn.read({ processId: PROCESS_ID, page: 0 })).messages[0].id).toBe(PROCESS_ID);
});

it.each([
	{},
	{ edges: [] },
	{ 0: assignment(0) },
	{ 0: assignment(0), 1: { ...assignment(1), process: 'x'.repeat(43) } },
	{ 0: assignment(0), 1: { ...assignment(1), slot: 2 } },
	{ 0: assignment(0), 1: { ...assignment(1), 'block-height': '9007199254740993' } },
	{ 0: assignment(0), 1: { ...assignment(1), body: 'unresolved-link' } },
	{
		0: assignment(0),
		1: { ...assignment(1), body: { commitments: { [MESSAGE_ID]: { 'commitment-device': 'httpsig@1.0' } } } },
	},
])('rejects malformed, wrong-process, or incomplete schedules: %j', async (payload) => {
	await expect(reader(payload).read({ processId: PROCESS_ID, page: 0 })).rejects.toMatchObject({
		code: 'invalid-response',
	});
});

it.each([
	{ processId: '../invalid', page: 0 },
	{ processId: PROCESS_ID, page: -1 },
	{ processId: PROCESS_ID, page: 0.5 },
	{ processId: PROCESS_ID, page: 1, latestSlot: 1 },
	{ processId: PROCESS_ID, page: 0, latestSlot: Number.MAX_SAFE_INTEGER },
])('rejects invalid page input before requesting assignments: %j', async (args) => {
	const { read, fetch } = reader();
	await expect(read(args)).rejects.toMatchObject({ code: 'invalid-input' });
	expect(fetch).not.toHaveBeenCalled();
});

it('falls back to peers when PermawebOS returns an incompatible schedule envelope', async () => {
	const injected = vi.fn(async () => json({ edges: [] }));
	const fetch = vi.fn(async () => json(assignments(0, 1)));
	const transport = createAoReadTransport(settings, { fetch, injected: () => injected });
	const read = createArweaveScheduleReader(transport, async () => 1);
	expect((await read({ processId: PROCESS_ID, page: 0 })).messages).toHaveLength(2);
	expect(injected).toHaveBeenCalledOnce();
	expect(fetch).toHaveBeenCalledOnce();
	expect(transport.getStatus().source).toBe('fallback');
});

it('cancels an in-flight schedule request without falling back', async () => {
	const fetch = vi.fn();
	const injected = vi.fn(() => new Promise<Response>(() => {}));
	const read = createArweaveScheduleReader(
		createAoReadTransport(settings, { fetch, injected: () => injected }),
		async () => 1
	);
	const controller = new AbortController();
	const pending = read({ processId: PROCESS_ID, page: 0, latestSlot: 1, signal: controller.signal });
	controller.abort();
	await expect(pending).rejects.toMatchObject({ code: 'cancelled' });
	expect(fetch).not.toHaveBeenCalled();
});

it('covers bounded descending slot ranges without overlap for arbitrary schedule lengths', async () => {
	await fc.assert(
		fc.asyncProperty(fc.integer({ min: 0, max: 10000 }), fc.nat(), async (latestSlot, seed) => {
			const totalPages = Math.ceil((latestSlot + 1) / 25);
			const page = seed % totalPages;
			const to = latestSlot - page * 25;
			const from = Math.max(0, to - 24);
			const { read } = reader(assignments(from, to));
			const result = await read({ processId: PROCESS_ID, page, latestSlot });
			expect(result.messages.map((message) => message.slot)).toEqual(
				Array.from({ length: to - from + 1 }, (_, index) => to - index)
			);
			expect(result.totalCount).toBe(latestSlot + 1);
			expect(result.messages.length).toBeLessThanOrEqual(25);
		})
	);
});
