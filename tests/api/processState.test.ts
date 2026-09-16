import fc from 'fast-check';
import { afterEach, expect, it, vi } from 'vitest';

import { createAoReadTransport } from '../../src/api/aoNetwork';
import { parseStateHeaders, type ProcessStateProgress, readProcessState } from '../../src/api/permaweb/processState';
import { DEFAULT_AO_NETWORK } from '../../src/helpers/aoNetwork';

const statePath = `/${'p'.repeat(43)}~process@1.0/now`;
const balanceId = 'b'.repeat(43);
const ordersId = 'o'.repeat(43);
const orderId = 'r'.repeat(43);
const linkPath = (id: string) => `/~cache@1.0/read=${id}?require-codec=json%401.0&accept-bundle=true`;
const head = (headers: Record<string, string>) => new Response(null, { headers });
const json = (value: unknown) => new Response(JSON.stringify(value));
const options = { timeoutMs: 90_000 };
const transportFor = (fetcher: typeof fetch) =>
	createAoReadTransport({ ...DEFAULT_AO_NETWORK, fallbackToPeers: false }, { injected: () => fetcher });

afterEach(() => vi.useRealTimers());

it('publishes immutable header and linked snapshots, including nested values as they arrive', async () => {
	vi.useFakeTimers();
	const progress: ProcessStateProgress[] = [];
	const fetcher = vi.fn(async (path) => {
		if (path === statePath) return head({ name: 'Legacy wUSDC', 'balances+link': balanceId, 'orders+link': ordersId });
		await new Promise((resolve) => setTimeout(resolve, path === linkPath(balanceId) ? 20 : 10));
		if (path === linkPath(balanceId)) return json({ holder: '900719925474099312345' });
		if (path === linkPath(ordersId)) return json([{ 'order+link': orderId }]);
		return json({ status: 'open' });
	});
	const pending = readProcessState(transportFor(fetcher), statePath, {
		...options,
		onProgress: (value) => progress.push(value),
	});
	await vi.advanceTimersByTimeAsync(0);
	expect(progress).toHaveLength(1);
	expect(progress[0]).toMatchObject({
		data: { name: 'Legacy wUSDC', 'balances+link': balanceId, 'orders+link': ordersId },
		completedLinks: 0,
		totalLinks: 2,
	});
	await vi.advanceTimersByTimeAsync(11);
	expect(progress[1]).toMatchObject({
		data: { name: 'Legacy wUSDC', 'balances+link': balanceId, orders: [{ 'order+link': orderId }] },
		completedLinks: 1,
		totalLinks: 3,
	});
	await vi.advanceTimersByTimeAsync(10);
	const result = await pending;
	expect(progress.at(-1)).toMatchObject({
		data: result.data,
		completedLinks: 3,
		totalLinks: 3,
	});
	expect(progress[0].data).not.toHaveProperty('orders');
	expect(progress[1].data).toHaveProperty('orders', [{ 'order+link': orderId }]);
	expect(result.data).toEqual({
		name: 'Legacy wUSDC',
		balances: { holder: '900719925474099312345' },
		orders: [{ order: { status: 'open' } }],
	});
});

it('starts queued links while an earlier slow value is still pending', async () => {
	vi.useFakeTimers();
	const onProgress = vi.fn();
	const fetcher = vi.fn(async (path) => {
		if (path === statePath)
			return head(Object.fromEntries(Array.from({ length: 5 }, (_, i) => [`field-${i}+link`, String(i).repeat(43)])));
		await new Promise((resolve) => setTimeout(resolve, path === linkPath('0'.repeat(43)) ? 100 : 10));
		return json({ ready: true });
	});
	const pending = readProcessState(transportFor(fetcher), statePath, { ...options, onProgress });
	await vi.advanceTimersByTimeAsync(21);
	expect(onProgress.mock.lastCall[0]).toMatchObject({
		data: { 'field-0+link': '0'.repeat(43), 'field-4': { ready: true } },
		completedLinks: 4,
		totalLinks: 5,
	});
	await vi.advanceTimersByTimeAsync(80);
	await pending;
});

it('keeps publishing independent values after a linked read fails without reporting complete success', async () => {
	vi.useFakeTimers();
	const onProgress = vi.fn();
	const fetcher = vi.fn(async (path) => {
		if (path === statePath) return head({ 'balances+link': balanceId, 'orders+link': ordersId });
		if (path === linkPath(balanceId)) throw new Error('Unavailable');
		await new Promise((resolve) => setTimeout(resolve, 10));
		return json({ status: 'open' });
	});
	const pending = expect(
		readProcessState(transportFor(fetcher), statePath, { ...options, onProgress })
	).rejects.toBeDefined();
	await vi.advanceTimersByTimeAsync(11);
	await pending;
	expect(onProgress.mock.lastCall[0]).toMatchObject({
		data: { 'balances+link': balanceId, orders: { status: 'open' } },
		completedLinks: 1,
		totalLinks: 2,
	});
});

it('stops progress notifications when a read is cancelled', async () => {
	vi.useFakeTimers();
	const controller = new AbortController();
	const onProgress = vi.fn();
	const fetcher = vi.fn(async (path) => {
		if (path === statePath) return head({ 'balances+link': balanceId });
		await new Promise((resolve) => setTimeout(resolve, 10));
		return json({ holder: '100' });
	});
	const pending = expect(
		readProcessState(transportFor(fetcher), statePath, { ...options, signal: controller.signal, onProgress })
	).rejects.toMatchObject({ code: 'cancelled' });
	await vi.advanceTimersByTimeAsync(0);
	controller.abort();
	await pending;
	await vi.advanceTimersByTimeAsync(11);
	expect(onProgress).toHaveBeenCalledTimes(1);
});

it('reads scalar headers and follows linked state, nested links, and lists with exact quantities', async () => {
	const fetcher = vi.fn(async (path, init) => {
		if (path === statePath) {
			expect(init.method).toBe('HEAD');
			expect(init.headers).toBeUndefined();
			return head({
				name: 'Legacy wUSDC',
				'total-supply': '900719925474099312345',
				'balances+link': balanceId,
				'orders+link': ordersId,
				server: 'nginx',
				'content-length': '0',
				'signature-input': 'transport-only',
			});
		}
		if (path === linkPath(balanceId)) return new Response('{"holder":900719925474099312345}');
		if (path === linkPath(ordersId)) return json([{ 'order+link': orderId }]);
		if (path === linkPath(orderId)) return json({ status: 'open', quantity: '1' });
		throw new Error(`Unexpected request: ${path}`);
	});
	expect(await readProcessState(transportFor(fetcher), statePath, options)).toMatchObject({
		data: {
			name: 'Legacy wUSDC',
			'total-supply': '900719925474099312345',
			balances: { holder: '900719925474099312345' },
			orders: [{ order: { status: 'open', quantity: '1' } }],
		},
		source: 'permawebos',
	});
	expect(fetcher).toHaveBeenCalledTimes(4);
	// Query codec negotiation avoids custom-header CORS preflights on linked values.
	expect(fetcher.mock.calls.slice(1).every(([, init]) => init.headers === undefined)).toBe(true);
});

it('only fetches links belonging to a requested state field', async () => {
	const fetcher = vi.fn(async (path) =>
		path === statePath ? head({ 'balances+link': balanceId, 'unrelated+link': ordersId }) : json({ holder: '100' })
	);
	expect((await readProcessState(transportFor(fetcher), statePath, { ...options, field: 'balances' })).data).toEqual({
		holder: '100',
	});
	expect(fetcher.mock.calls.map(([path]) => path)).toEqual([statePath, linkPath(balanceId)]);
});

it('deduplicates immutable link reads while keeping independent state values', async () => {
	const fetcher = vi.fn(async (path) =>
		path === statePath ? head({ 'first+link': balanceId, 'second+link': balanceId }) : json({ value: '1' })
	);
	expect((await readProcessState(transportFor(fetcher), statePath, options)).data).toEqual({
		first: { value: '1' },
		second: { value: '1' },
	});
	expect(fetcher).toHaveBeenCalledTimes(2);
});

it('switches linked reads to peers when PermawebOS fails after returning the state headers', async () => {
	const injected = vi.fn(async (path) => {
		if (path === statePath) return head({ 'balances+link': balanceId });
		throw new Error('extension unavailable');
	});
	const direct = vi.fn(async () => json({ holder: '100' }));
	const transport = createAoReadTransport(DEFAULT_AO_NETWORK, { injected: () => injected, fetch: direct });
	expect((await readProcessState(transport, statePath, options)).data).toEqual({ balances: { holder: '100' } });
	expect(direct).toHaveBeenCalledWith(expect.stringContaining(linkPath(balanceId)), expect.any(Object));
	expect(transport.getStatus().source).toBe('fallback');
});

it('limits concurrent linked reads to four', async () => {
	vi.useFakeTimers();
	let active = 0;
	let peak = 0;
	const fetcher = vi.fn(async (path) => {
		if (path === statePath)
			return head(
				Object.fromEntries(Array.from({ length: 9 }, (_, index) => [`field-${index}+link`, String(index).repeat(43)]))
			);
		peak = Math.max(peak, ++active);
		await new Promise((resolve) => setTimeout(resolve, 10));
		--active;
		return json({ ready: true });
	});
	const pending = readProcessState(transportFor(fetcher), statePath, options);
	await vi.advanceTimersByTimeAsync(31);
	await pending;
	expect(peak).toBe(4);
	expect(fetcher).toHaveBeenCalledTimes(10);
});

it.each(['../other', 'https://other.example/state', '', 'x'.repeat(42)])('rejects invalid links: %s', async (id) => {
	const fetcher = vi.fn(async () => head({ 'balances+link': id }));
	await expect(readProcessState(transportFor(fetcher), statePath, options)).rejects.toMatchObject({
		code: 'invalid-response',
	});
	expect(fetcher).toHaveBeenCalledTimes(1);
});

it('rejects cyclic links instead of leaving the state read pending', async () => {
	const fetcher = vi.fn(async (path) =>
		path === statePath ? head({ 'first+link': balanceId }) : json({ 'self+link': balanceId })
	);
	await expect(readProcessState(transportFor(fetcher), statePath, options)).rejects.toMatchObject({
		code: 'invalid-response',
	});
	expect(fetcher).toHaveBeenCalledTimes(2);
});

const numberedId = (index: number) => String(index).padStart(43, 'x');
const descend = (value: any, depth: number) => {
	for (let index = 0; index < depth; index++) value = value.next;
	return value;
};

it('pauses at depth 64 and resumes in bounded batches from the same snapshot', async () => {
	const fetcher = vi.fn(async (path) => {
		if (path === statePath) return head({ name: 'Deep process', 'next+link': numberedId(0) });
		const index = Number(String(path).match(/read=x*(\d+)/)[1]);
		return json(index === 129 ? { done: true } : { 'next+link': numberedId(index + 1) });
	});
	const first = await readProcessState(transportFor(fetcher), statePath, options);
	expect(fetcher).toHaveBeenCalledTimes(65);
	expect(descend(first.data, 64)).toEqual({ 'next+link': numberedId(64) });
	expect(first.loadMore).toBeTypeOf('function');
	const progress = vi.fn();
	const second = await first.loadMore({ onProgress: progress });
	expect(fetcher).toHaveBeenCalledTimes(129);
	expect(descend(second.data, 128)).toEqual({ 'next+link': numberedId(128) });
	expect(descend(first.data, 64)).toEqual({ 'next+link': numberedId(64) });
	expect(progress.mock.lastCall[0]).toMatchObject({ completedLinks: 128, totalLinks: 129 });
	const third = await second.loadMore();
	expect(descend(third.data, 130)).toEqual({ done: true });
	expect(third.loadMore).toBeUndefined();
	expect(fetcher).toHaveBeenCalledTimes(131);
	expect(fetcher.mock.calls.filter(([path]) => path === statePath)).toHaveLength(1);
});

it('limits each batch to 256 links and loads the remaining links only on request', async () => {
	const fetcher = vi.fn(async (path) =>
		path === statePath
			? head(Object.fromEntries(Array.from({ length: 300 }, (_, index) => [`field-${index}+link`, numberedId(index)])))
			: json({ ready: true })
	);
	const first = await readProcessState(transportFor(fetcher), statePath, options);
	expect(fetcher).toHaveBeenCalledTimes(257);
	expect(Object.keys(first.data).filter((key) => key.endsWith('+link'))).toHaveLength(44);
	const second = await first.loadMore();
	expect(fetcher).toHaveBeenCalledTimes(301);
	expect(Object.keys(second.data).filter((key) => key.endsWith('+link'))).toHaveLength(0);
	expect(second.loadMore).toBeUndefined();
});

it('retains deduplication across manual batches', async () => {
	const fetcher = vi.fn(async (path) =>
		path === statePath
			? head(Object.fromEntries(Array.from({ length: 300 }, (_, index) => [`field-${index}+link`, balanceId])))
			: json({ holder: '900719925474099312345' })
	);
	const first = await readProcessState(transportFor(fetcher), statePath, options);
	const second = await first.loadMore();
	expect(fetcher).toHaveBeenCalledTimes(2);
	expect(second.data['field-299']).toEqual({ holder: '900719925474099312345' });
});

it('defers links inside deeply nested inline objects and arrays without discarding their values', async () => {
	let nested: unknown = [{ 'value+link': ordersId, amount: '900719925474099312345' }];
	for (let index = 0; index < 70; index++) nested = { next: nested };
	const fetcher = vi.fn(async (path) => {
		if (path === statePath) return head({ 'next+link': balanceId });
		return json(path === linkPath(balanceId) ? nested : { done: true });
	});
	const first = await readProcessState(transportFor(fetcher), statePath, options);
	expect(fetcher).toHaveBeenCalledTimes(2);
	expect(descend(first.data, 71)[0]).toHaveProperty('value+link', ordersId);
	const second = await first.loadMore();
	expect(fetcher).toHaveBeenCalledTimes(3);
	expect(descend(second.data, 71)[0]).toEqual({ value: { done: true }, amount: '900719925474099312345' });
	expect(second.loadMore).toBeUndefined();
});

it('keeps cycle detection across manual depth boundaries', async () => {
	const fetcher = vi.fn(async (path) => {
		if (path === statePath) return head({ 'next+link': numberedId(0) });
		const index = Number(String(path).match(/read=x*(\d+)/)[1]);
		return json({ 'next+link': numberedId(index === 64 ? 0 : index + 1) });
	});
	const first = await readProcessState(transportFor(fetcher), statePath, options);
	await expect(first.loadMore()).rejects.toMatchObject({ code: 'invalid-response' });
	expect(fetcher).toHaveBeenCalledTimes(66);
	expect(descend(first.data, 64)).toEqual({ 'next+link': numberedId(64) });
});

it('shares concurrent continuation calls and permits retry after a continuation timeout', async () => {
	vi.useFakeTimers();
	let shouldStall = true;
	const fetcher = vi.fn(async (path) => {
		if (path === statePath) return head({ 'next+link': numberedId(0) });
		const index = Number(String(path).match(/read=x*(\d+)/)[1]);
		if (index < 64) return json({ 'next+link': numberedId(index + 1) });
		if (shouldStall) return new Promise<Response>(() => {});
		return json({ done: true });
	});
	const first = await readProcessState(transportFor(fetcher), statePath, { timeoutMs: 50 });
	const progress = vi.fn();
	const pending = first.loadMore({ onProgress: progress });
	expect(first.loadMore()).toBe(pending);
	const failure = expect(pending).rejects.toMatchObject({ code: 'timeout' });
	await vi.advanceTimersByTimeAsync(51);
	await failure;
	expect(progress).toHaveBeenCalledTimes(1);
	shouldStall = false;
	const retried = await first.loadMore();
	expect(descend(retried.data, 65)).toEqual({ done: true });
	expect(retried.loadMore).toBeUndefined();
	expect(fetcher).toHaveBeenCalledTimes(67);
});

it('cancels manual loading when the original process read is disposed', async () => {
	const controller = new AbortController();
	const fetcher = vi.fn(async (path) => {
		if (path === statePath) return head({ 'next+link': numberedId(0) });
		const index = Number(String(path).match(/read=x*(\d+)/)[1]);
		if (index === 64) controller.abort();
		return json({ 'next+link': numberedId(index + 1) });
	});
	const first = await readProcessState(transportFor(fetcher), statePath, { ...options, signal: controller.signal });
	const progress = vi.fn();
	await expect(first.loadMore({ onProgress: progress })).rejects.toMatchObject({ code: 'cancelled' });
	expect(progress).toHaveBeenCalledTimes(1);
	await expect(first.loadMore()).rejects.toMatchObject({ code: 'cancelled' });
	expect(fetcher).toHaveBeenCalledTimes(66);
});

it('bounds the complete traversal, aborting stalled linked reads', async () => {
	vi.useFakeTimers();
	const fetcher = vi.fn(async (path) =>
		path === statePath ? head({ 'balances+link': balanceId }) : new Promise<Response>(() => {})
	);
	const pending = expect(readProcessState(transportFor(fetcher), statePath, { timeoutMs: 50 })).rejects.toMatchObject({
		code: 'timeout',
	});
	await vi.advanceTimersByTimeAsync(51);
	await pending;
	expect(fetcher.mock.calls[1][1].signal.aborted).toBe(true);
});

it('cancels linked reads and never returns partial state as a complete result', async () => {
	const controller = new AbortController();
	const fetcher = vi.fn(async (path) => {
		if (path === statePath) return head({ 'balances+link': balanceId });
		controller.abort();
		return json({ holder: '1' });
	});
	await expect(
		readProcessState(transportFor(fetcher), statePath, { ...options, signal: controller.signal })
	).rejects.toMatchObject({ code: 'cancelled' });
});

it('decodes percent-encoded header names without changing their case or scalar values', () => {
	fc.assert(
		fc.property(
			fc.array(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'), {
				minLength: 43,
				maxLength: 43,
			}),
			fc.bigInt({ min: 0n, max: 2n ** 128n }),
			(characters, amount) => {
				const name = characters.join('');
				const encoded = characters.map((character) => `%${character.charCodeAt(0).toString(16)}`).join('');
				expect(parseStateHeaders(new Headers({ [encoded]: amount.toString() }))).toEqual({ [name]: amount.toString() });
			}
		)
	);
});

it('rejects transport-only responses and dangerous header names', () => {
	expect(() => parseStateHeaders(new Headers({ server: 'nginx', 'content-type': 'text/html' }))).toThrow();
	expect(() => parseStateHeaders(new Headers({ '%5f%5fproto%5f%5f': 'value' }))).toThrow();
});
