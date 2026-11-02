import { afterEach, expect, it, vi } from 'vitest';

import { requestRemote } from '../../src/api/http';
import { readLegacyTransactionSchedule } from '../../src/api/scheduler';

vi.mock('api/http', () => ({ requestRemote: vi.fn() }));

const args = { messageId: 'm'.repeat(43), processId: 'p'.repeat(43) };

afterEach(() => {
	vi.resetAllMocks();
	vi.useRealTimers();
});

it('reads validated assignment metadata and clears the timeout after success', async () => {
	vi.useFakeTimers();
	vi.mocked(requestRemote).mockResolvedValue(
		new Response(
			JSON.stringify({
				assignment: {
					tags: [
						{ name: 'Block-Height', value: '000123' },
						{ name: 'Timestamp', value: '1793633333000' },
						{ name: 'Nonce', value: '0' },
					],
				},
			})
		)
	);
	expect(await readLegacyTransactionSchedule(args)).toEqual({ block: { height: 123, timestamp: 1793633333 }, slot: 0 });
	expect(requestRemote).toHaveBeenCalledWith(
		`https://su-router.ao-testnet.xyz/${args.messageId}?process-id=${args.processId}`,
		{ signal: expect.any(AbortSignal) }
	);
	expect(vi.getTimerCount()).toBe(0);
});

it.each(['headers', 'body'] as const)('bounds a scheduler stalled during %s', async (stage) => {
	vi.useFakeTimers();
	let signal: AbortSignal;
	vi.mocked(requestRemote).mockImplementation((_input, init) => {
		signal = init.signal;
		const stall = () =>
			new Promise<never>((_resolve, reject) => {
				signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
			});
		if (stage === 'headers') return stall();
		const response = new Response();
		vi.spyOn(response, 'json').mockImplementation(stall);
		return Promise.resolve(response);
	});
	const pending = readLegacyTransactionSchedule(args);
	await vi.advanceTimersByTimeAsync(4_000);
	expect(await pending).toBeNull();
	expect(signal.aborted).toBe(true);
	expect(vi.getTimerCount()).toBe(0);
});

it.each([null, {}, { assignment: null }, { assignment: { tags: [null, { name: 'Nonce', value: 'oops' }] } }])(
	'ignores unavailable or invalid assignment data: %j',
	async (payload) => {
		vi.mocked(requestRemote).mockResolvedValue(new Response(JSON.stringify(payload)));
		expect(await readLegacyTransactionSchedule(args)).toBeNull();
	}
);

it('keeps only valid fields from partial assignment metadata', async () => {
	vi.mocked(requestRemote).mockResolvedValue(
		new Response(
			JSON.stringify({
				assignment: {
					tags: [
						{ name: 'Block-Height', value: '-1' },
						{ name: 'Timestamp', value: '9007199254740992' },
						{ name: 'Nonce', value: '12' },
					],
				},
			})
		)
	);
	expect(await readLegacyTransactionSchedule(args)).toEqual({ block: {}, slot: 12 });
});

it('handles non-success responses and cancels a superseded read', async () => {
	vi.mocked(requestRemote).mockResolvedValueOnce(new Response(null, { status: 400 }));
	expect(await readLegacyTransactionSchedule(args)).toBeNull();
	vi.mocked(requestRemote).mockImplementation(
		(_input, init) =>
			new Promise((_resolve, reject) => {
				init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
			})
	);
	const controller = new AbortController();
	const pending = readLegacyTransactionSchedule({ ...args, signal: controller.signal });
	controller.abort();
	expect(await pending).toBeNull();
});

it('does not request invalid IDs or a cancelled lookup', async () => {
	expect(await readLegacyTransactionSchedule({ ...args, processId: 'invalid' })).toBeNull();
	expect(await readLegacyTransactionSchedule({ ...args, signal: AbortSignal.abort() })).toBeNull();
	expect(requestRemote).not.toHaveBeenCalled();
});
