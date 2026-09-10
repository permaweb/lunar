import fc from 'fast-check';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createNodesApi, parseObservation, parsePeers } from '../../src/api/nodes/arweaveAdapter';
import { parsePeerAddress } from '../../src/api/nodes/peerAddress.mjs';
import { countryDatabaseFixture } from '../fixtures/nodeCountries';

const peer = { address: '8.8.8.8:1984', ip: '8.8.8.8', port: 1984 };
const observation = {
	peer: peer.address,
	checkedAt: Date.now(),
	status: 'reachable',
	latencyMs: 25,
	info: { height: 2000000, version: 5, release: 100, peers: 200 },
};
const assetUrl = 'https://lunar.example/transaction/assets/ipv4-country.hash.bin';
const json = (value: unknown) =>
	new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });
afterEach(() => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe('Arweave node adapter', () => {
	it('preserves public endpoint identity and rejects generated private endpoints', () => {
		fc.assert(
			fc.property(
				fc.tuple(fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 })),
				fc.integer({ min: 1, max: 65535 }),
				(octets, port) => {
					const suffix = octets.join('.');
					const ip = `8.${suffix}`;
					const address = `${ip}:${port}`;
					expect(parsePeerAddress(address)).toEqual({ address, ip, port });
					for (const prefix of [0, 10, 127, 224, 255]) {
						expect(parsePeerAddress(`${prefix}.${suffix}:${port}`)).toBeNull();
					}
					expect(parsePeerAddress(`169.254.${octets[1]}.${octets[2]}:${port}`)).toBeNull();
					expect(parsePeerAddress(`192.168.${octets[1]}.${octets[2]}:${port}`)).toBeNull();
				}
			)
		);
	});
	it('discovers peers only from arweave.net, with no fallback', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(json([peer.address, peer.address, '10.0.0.1:1984', 'https://example.com']));
		vi.stubGlobal('fetch', fetchMock);
		expect(await createNodesApi().getPeers(new AbortController().signal)).toEqual([peer]);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock.mock.calls[0][0]).toBe('https://arweave.net/peers');
		fetchMock.mockResolvedValue(new Response('', { status: 503 }));
		await expect(createNodesApi().getPeers(new AbortController().signal)).rejects.toMatchObject({
			code: 'unavailable',
		});
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
	it('rejects malformed peer payloads and unsafe addresses', () => {
		expect(parsePeers([])).toEqual([]);
		for (const value of [
			{ peers: [] },
			[12],
			['127.0.0.1:1984'],
			['169.254.169.254:80'],
			['8.8.8.8:65536'],
			['008.8.8.8:80'],
		])
			expect(() => parsePeers(value)).toThrow();
	});
	it('uses analytics countries only for the peers discovered directly by Lunar', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			json({
				source: 'https://arweave.net/peers',
				countries: [
					{ ip: peer.ip, countryCode: 'US' },
					{ ip: '9.9.9.9', countryCode: 'DE' },
				],
			})
		);
		vi.stubGlobal('fetch', fetchMock);
		expect(await createNodesApi().getCountries([peer], new AbortController().signal)).toEqual({
			countries: [{ ip: peer.ip, countryCode: 'US' }],
			source: 'analytics',
		});
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock.mock.calls[0][0]).toBe('https://stats.forward.computer/~analytics@1.0/node-locations');
	});
	it('falls back to one cached static asset when the analytics endpoint is unavailable', async () => {
		const fetchMock = vi
			.fn()
			.mockImplementation(async (url) =>
				url === assetUrl ? new Response(countryDatabaseFixture()) : new Response('', { status: 404 })
			);
		vi.stubGlobal('fetch', fetchMock);
		const api = createNodesApi(assetUrl);
		const signal = new AbortController().signal;
		const sameIP = { ...peer, port: 1985, address: '8.8.8.8:1985' };
		expect(await api.getCountries([peer, sameIP], signal)).toEqual({
			countries: [{ ip: peer.ip, countryCode: 'US' }],
			source: 'bundled',
		});
		await api.getCountries([peer], signal);
		expect(fetchMock.mock.calls.filter(([url]) => url === assetUrl)).toHaveLength(1);
		expect(fetchMock.mock.calls.every(([, options]) => options.credentials === 'omit')).toBe(true);
	});
	it('rejects a corrupt fallback asset and permits a retry', async () => {
		let assets = 0;
		vi.stubGlobal(
			'fetch',
			vi.fn(async (url) => {
				if (url !== assetUrl) return new Response('', { status: 503 });
				return assets++ === 0 ? new Response('<html/>') : new Response(countryDatabaseFixture());
			})
		);
		const api = createNodesApi(assetUrl);
		const signal = new AbortController().signal;
		await expect(api.getCountries([peer], signal)).rejects.toMatchObject({ code: 'invalid-response' });
		expect((await api.getCountries([peer], signal)).countries).toHaveLength(1);
	});
	it('checks device capabilities and caches validated observations of the exact endpoint', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(json({ version: 1, nodeInfo: true, source: 'https://arweave.net/peers' }))
			.mockResolvedValueOnce(json(observation));
		vi.stubGlobal('fetch', fetchMock);
		const api = createNodesApi();
		const signal = new AbortController().signal;
		expect(await api.supportsInfo(signal)).toBe(true);
		expect(await api.getInfo(peer, signal)).toEqual(observation);
		await api.getInfo(peer, signal);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(fetchMock.mock.calls[1][0]).toBe(
			'https://stats.forward.computer/~analytics@1.0/node-info?peer=8.8.8.8%3A1984'
		);
		expect(() => parseObservation({ ...observation, peer: '9.9.9.9:1984' }, peer)).toThrow();
		expect(() =>
			parseObservation({ ...observation, info: { ...observation.info, height: Number.MAX_SAFE_INTEGER + 1 } }, peer)
		).toThrow();
		expect(() => parseObservation({ ...observation, checkedAt: -1 }, peer)).toThrow();
	});
	it('does not turn a service outage into an unavailable node observation', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
		await expect(createNodesApi().getInfo(peer, new AbortController().signal)).rejects.toMatchObject({
			code: 'unavailable',
		});
	});
	it('fetches eight node observations at once and queues the ninth', async () => {
		const releases: Array<() => void> = [];
		const fetchMock = vi.fn(
			(url: string) =>
				new Promise<Response>((resolve) => {
					const address = new URL(url).searchParams.get('peer');
					releases.push(() => resolve(json({ ...observation, peer: address })));
				})
		);
		vi.stubGlobal('fetch', fetchMock);
		const api = createNodesApi();
		const peers = parsePeers(Array.from({ length: 9 }, (_, index) => `8.8.8.${index + 1}:1984`));
		const requests = peers.map((peer) => api.getInfo(peer, new AbortController().signal));
		await Promise.resolve();
		expect(fetchMock).toHaveBeenCalledTimes(8);
		releases[0]();
		await requests[0];
		await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(9));
		for (const release of releases.slice(1)) release();
		expect(await Promise.all(requests)).toHaveLength(9);
	});
	it.each(['cancelled', 'timeout'])('aborts node requests on %s', async (reason) => {
		vi.useFakeTimers();
		const fetchMock = vi.fn(
			(_url, { signal }) =>
				new Promise((_resolve, reject) => {
					signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
				})
		);
		vi.stubGlobal('fetch', fetchMock);
		const controller = new AbortController();
		const result = expect(createNodesApi().getInfo(peer, controller.signal)).rejects.toMatchObject({ code: reason });
		await Promise.resolve();
		if (reason === 'cancelled') controller.abort();
		else await vi.advanceTimersByTimeAsync(15_000);
		await result;
		expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
	});
	it('does not load the country database for an empty peer list', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		expect(await createNodesApi().getCountries([], new AbortController().signal)).toEqual({
			countries: [],
			source: 'bundled',
		});
		expect(fetchMock).not.toHaveBeenCalled();
	});
	it('does not send cancelled requests', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		const controller = new AbortController();
		controller.abort();
		await expect(createNodesApi().getPeers(controller.signal)).rejects.toMatchObject({ code: 'cancelled' });
		await expect(createNodesApi().getCountries([peer], controller.signal)).rejects.toMatchObject({ code: 'cancelled' });
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
