import { afterEach, expect, it, vi } from 'vitest';

import { createAoReadTransport } from '../../../src/api/aoNetwork';
import { DEFAULT_AO_NETWORK } from '../../../src/helpers/aoNetwork';

const peers = ['https://alpha.example', 'https://charlie.example'];
const settings = { ...DEFAULT_AO_NETWORK, peers };
const path = '/process~process@1.0/now';
const json = (value: unknown) =>
	new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json' } });
afterEach(() => vi.useRealTimers());

it('uses the injected transport without a wallet or a direct peer request', async () => {
	const injected = vi.fn(async () => json({ name: 'extension' }));
	const direct = vi.fn();
	const transport = createAoReadTransport(settings, { fetch: direct, injected: () => injected });
	expect(await transport.readJson(path)).toMatchObject({ data: { name: 'extension' }, source: 'permawebos' });
	expect(injected).toHaveBeenCalledWith(path, expect.objectContaining({ signal: expect.any(AbortSignal) }));
	expect(direct).not.toHaveBeenCalled();
});

it('reads HEAD responses and falls back when the extension headers are invalid', async () => {
	const injected = vi.fn(async () => new Response(null));
	const direct = vi.fn(async () => new Response(null, { headers: { name: 'state' } }));
	const transport = createAoReadTransport(settings, { fetch: direct, injected: () => injected });
	const { parseStateHeaders } = await import('../../../src/api/permaweb/processState');
	expect(await transport.readHeaders(path, {}, parseStateHeaders)).toMatchObject({
		data: { name: 'state' },
		source: 'fallback',
	});
	expect(injected).toHaveBeenCalledWith(path, expect.objectContaining({ method: 'HEAD' }));
	expect(direct).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'HEAD' }));
});

it.each([429, 502])('fails over between configured peers after HTTP %i', async (status) => {
	const requests: string[] = [];
	const direct = vi.fn(async (input) => {
		requests.push(String(input));
		return requests.length === 1 ? new Response('', { status }) : json({ ready: true });
	});
	const transport = createAoReadTransport(settings, { fetch: direct, injected: () => undefined });
	expect(await transport.readJson(path)).toMatchObject({ data: { ready: true }, source: 'peers' });
	expect(new Set(requests.map((url) => new URL(url).origin))).toEqual(new Set(peers));
});

it.each(['rejected', 'http', 'invalid-json'])('switches to peers when PermawebOS returns %s', async (failure) => {
	const injected = vi.fn(async () => {
		if (failure === 'rejected') throw new Error('extension unavailable');
		return failure === 'http' ? new Response('', { status: 503 }) : new Response('<html>not state</html>');
	});
	const direct = vi.fn(async () => json({ name: 'fallback' }));
	const transport = createAoReadTransport(settings, { fetch: direct, injected: () => injected });
	expect(await transport.readJson(path)).toMatchObject({ data: { name: 'fallback' }, source: 'fallback' });
	expect(transport.getStatus()).toMatchObject({ source: 'fallback', processPeers: peers });
});

it('times out a hanging extension even if it ignores the abort signal', async () => {
	vi.useFakeTimers();
	const injected = vi.fn(() => new Promise<Response>(() => {}));
	const direct = vi.fn(async () => json({ ready: true }));
	const transport = createAoReadTransport(settings, { fetch: direct, injected: () => injected, timeoutMs: 100 });
	const pending = transport.readJson(path);
	await vi.advanceTimersByTimeAsync(101);
	expect(await pending).toMatchObject({ source: 'fallback' });
	expect(injected.mock.calls[0][1].signal.aborted).toBe(true);
});

it.each(['peers', 'permawebos'] as const)(
	'allows a full-state read to take longer than discovery reads through %s',
	async (source) => {
		vi.useFakeTimers();
		const delayed = vi.fn(async (_input, init) => {
			await new Promise((resolve) => setTimeout(resolve, 13_000));
			init.signal.throwIfAborted();
			return json({ name: 'Legacy wUSDC', balances: { holder: '255018926306' } });
		});
		const direct = source === 'peers' ? delayed : vi.fn();
		const transport = createAoReadTransport(settings, {
			fetch: direct,
			injected: () => (source === 'permawebos' ? delayed : undefined),
		});
		const pending = expect(transport.readJson(path, { timeoutMs: 30_000 })).resolves.toMatchObject({
			data: { name: 'Legacy wUSDC' },
			source,
		});
		await vi.advanceTimersByTimeAsync(13_001);
		await pending;
		if (source === 'permawebos') expect(direct).not.toHaveBeenCalled();
		expect(delayed.mock.calls[0][1]).not.toHaveProperty('timeoutMs');
	}
);

it('still cancels a full-state read immediately without falling back', async () => {
	const injected = vi.fn(() => new Promise<Response>(() => {}));
	const direct = vi.fn();
	const controller = new AbortController();
	const transport = createAoReadTransport(settings, { fetch: direct, injected: () => injected });
	const pending = transport.readJson(path, { signal: controller.signal, timeoutMs: 30_000 });
	controller.abort();
	await expect(pending).rejects.toMatchObject({ code: 'cancelled' });
	expect(direct).not.toHaveBeenCalled();
});

it('falls back after the full-state deadline and gives peers time to serialize state', async () => {
	vi.useFakeTimers();
	const injected = vi.fn(() => new Promise<Response>(() => {}));
	const direct = vi.fn(async (_input, init) => {
		await new Promise((resolve) => setTimeout(resolve, 13_000));
		init.signal.throwIfAborted();
		return json({ name: 'Legacy wUSDC' });
	});
	const transport = createAoReadTransport(settings, { fetch: direct, injected: () => injected });
	const pending = expect(transport.readJson(path, { timeoutMs: 30_000 })).resolves.toMatchObject({
		data: { name: 'Legacy wUSDC' },
		source: 'fallback',
	});
	await vi.advanceTimersByTimeAsync(29_999);
	expect(direct).not.toHaveBeenCalled();
	await vi.advanceTimersByTimeAsync(1);
	expect(injected.mock.calls[0][1].signal.aborted).toBe(true);
	expect(direct).toHaveBeenCalledTimes(1);
	await vi.advanceTimersByTimeAsync(13_001);
	await pending;
});

it('stops cancelled reads without failing over or marking PermawebOS unhealthy', async () => {
	const injected = vi.fn(() => new Promise<Response>(() => {}));
	const direct = vi.fn();
	const controller = new AbortController();
	const transport = createAoReadTransport(settings, { fetch: direct, injected: () => injected });
	const pending = transport.readJson(path, { signal: controller.signal });
	controller.abort();
	await expect(pending).rejects.toMatchObject({ code: 'cancelled' });
	expect(direct).not.toHaveBeenCalled();
	expect(transport.getStatus().source).toBe('permawebos');
});

it('honors the fallback toggle and the preference to use peers directly', async () => {
	const injected = vi.fn(async () => {
		throw new Error('failed');
	});
	const direct = vi.fn(async () => json({ ready: true }));
	const strict = createAoReadTransport(
		{ ...settings, fallbackToPeers: false },
		{ fetch: direct, injected: () => injected }
	);
	await expect(strict.readJson(path)).rejects.toMatchObject({ code: 'unavailable' });
	expect(direct).not.toHaveBeenCalled();
	const peerOnly = createAoReadTransport(
		{ ...settings, preferPermawebOS: false },
		{ fetch: direct, injected: () => injected }
	);
	expect(await peerOnly.readJson(path)).toMatchObject({ source: 'peers' });
	expect(injected).toHaveBeenCalledTimes(1);
});

it('uses peers during the cooldown, then retries and recovers PermawebOS', async () => {
	let now = 10;
	const injected = vi
		.fn()
		.mockRejectedValueOnce(new Error('offline'))
		.mockImplementation(async () => json({ ready: true }));
	const transport = createAoReadTransport(settings, {
		fetch: async () => json({ ready: true }),
		injected: () => injected,
		now: () => now,
	});
	expect((await transport.readJson(path)).source).toBe('fallback');
	now += 10_000;
	expect((await transport.readJson(path)).source).toBe('fallback');
	expect(injected).toHaveBeenCalledTimes(1);
	now += 60_000;
	expect((await transport.readJson(path)).source).toBe('permawebos');
	expect(injected).toHaveBeenCalledTimes(2);
});

it('preserves large integers and fails closed when every peer fails', async () => {
	const transport = createAoReadTransport(settings, {
		fetch: async () => new Response('{"quantity":900719925474099312345}'),
		injected: () => undefined,
	});
	expect((await transport.readJson(path)).data).toEqual({ quantity: '900719925474099312345' });
	const failed = createAoReadTransport(settings, {
		fetch: async () => new Response('', { status: 502 }),
		injected: () => undefined,
	});
	await expect(failed.readJson(path)).rejects.toMatchObject({ code: 'unavailable' });
});

it('never routes writes or arbitrary absolute URLs through the read fallback', async () => {
	const direct = vi.fn();
	const transport = createAoReadTransport(settings, { fetch: direct, injected: () => undefined });
	await expect(transport.readJson(path, { method: 'POST' })).rejects.toMatchObject({ code: 'invalid-input' });
	await expect(transport.readJson('https://other.example/now')).rejects.toMatchObject({ code: 'invalid-input' });
	expect(direct).not.toHaveBeenCalled();
});

it('discovers a late extension, refreshes role-specific peers, and removes its listener', async () => {
	const events = new EventTarget();
	const removeListener = vi.spyOn(events, 'removeEventListener');
	vi.stubGlobal('window', events);
	let extension;
	const transport = createAoReadTransport(settings, { fetch: async () => json({}), injected: () => extension });
	const listener = vi.fn();
	const unsubscribe = transport.subscribe(listener);
	expect(transport.getStatus().source).toBe('peers');
	extension = Object.assign(async () => json({}), {
		peers: ['https://old.example'],
		networkPolicy: async () => ({
			ao: {
				processReads: [{ url: 'https://state.example' }],
				scheduleReads: [{ url: 'https://schedule.example' }],
				linkedStateReads: [{ url: 'https://linked.example' }],
			},
		}),
	});
	events.dispatchEvent(new Event('aoFetchLoaded'));
	await vi.waitFor(() => expect(transport.getStatus().processPeers).toEqual(['https://state.example']));
	expect(transport.getStatus()).toMatchObject({
		source: 'permawebos',
		schedulePeers: ['https://schedule.example'],
		linkedStatePeers: ['https://linked.example'],
	});
	unsubscribe();
	expect(removeListener).toHaveBeenCalledWith('aoFetchLoaded', expect.any(Function));
	vi.unstubAllGlobals();
});
