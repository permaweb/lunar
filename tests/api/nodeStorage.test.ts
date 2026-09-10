import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { createNodesApi } from '../../src/api/nodes/arweaveAdapter';

const peer = { address: '8.8.8.8:1984', ip: '8.8.8.8', port: 1984 };
const signal = () => new AbortController().signal;
const observation = () => ({
	peer: peer.address,
	checkedAt: Date.now(),
	status: 'reachable',
	latencyMs: 23,
	info: { height: 2000000, version: 5, release: 100, peers: 200 },
});
const json = (value: unknown) =>
	new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });
let stored: Map<string, string>;
beforeEach(() => {
	stored = new Map([['unrelated-setting', 'keep']]);
	vi.stubGlobal('localStorage', {
		getItem: (key: string) => stored.get(key) ?? null,
		setItem: (key: string, value: string) => stored.set(key, value),
	});
});
afterEach(() => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

it('restores peers and observations after reload, refreshes discovery, and expires old observations', async () => {
	vi.useFakeTimers();
	const fetchMock = vi.fn(async (url: string) => json(url.endsWith('/peers') ? [peer.address] : observation()));
	vi.stubGlobal('fetch', fetchMock);
	const first = createNodesApi();
	await first.getPeers(signal());
	const checked = await first.getInfo(peer, signal());
	expect(fetchMock).toHaveBeenCalledTimes(2);
	const reload = createNodesApi();
	expect(await reload.getPeers(signal())).toEqual([peer]);
	expect(reload.getCachedInfo([peer])).toEqual([checked]);
	expect(await reload.getInfo(peer, signal())).toEqual(checked);
	expect(fetchMock).toHaveBeenCalledTimes(2);
	await reload.getPeers(signal(), true);
	expect(fetchMock).toHaveBeenCalledTimes(3);
	await vi.advanceTimersByTimeAsync(300_001);
	expect(createNodesApi().getCachedInfo([peer])).toEqual([]);
	await reload.getInfo(peer, signal());
	expect(fetchMock).toHaveBeenCalledTimes(4);
	expect(stored.get('unrelated-setting')).toBe('keep');
});

it('expires negative observations quickly and removes nodes absent from refreshed discovery', async () => {
	vi.useFakeTimers();
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string) =>
			json(
				url.endsWith('/peers')
					? []
					: {
							peer: peer.address,
							checkedAt: Date.now(),
							status: 'unavailable',
					  }
			)
		)
	);
	const api = createNodesApi();
	await api.getInfo(peer, signal());
	expect(createNodesApi().getCachedInfo([peer])).toHaveLength(1);
	await vi.advanceTimersByTimeAsync(30_001);
	expect(createNodesApi().getCachedInfo([peer])).toEqual([]);
	await api.getInfo(peer, signal());
	await api.getPeers(signal(), true);
	expect(api.getCachedInfo([peer])).toEqual([]);
});

it('validates persisted entries, isolates analytics hosts, and tolerates blocked storage', async () => {
	const fetchMock = vi.fn(async () => json(observation()));
	vi.stubGlobal('fetch', fetchMock);
	await createNodesApi().getInfo(peer, signal());
	const key = [...stored.keys()].find((key) => key.startsWith('lunar:nodes:'));
	const envelope = JSON.parse(stored.get(key));
	envelope.observations = [
		{ ...observation(), info: { height: -1 } },
		{ ...observation(), peer: '127.0.0.1:80' },
		{ ...observation(), checkedAt: Date.now() + 86400_000 },
	];
	stored.set(key, JSON.stringify(envelope));
	expect(createNodesApi().getCachedInfo([peer])).toEqual([]);
	expect(createNodesApi(undefined, 'https://another.example/~analytics@1.0/').getCachedInfo([peer])).toEqual([]);
	stored.set(key, '{broken');
	expect(createNodesApi().getCachedInfo([peer])).toEqual([]);
	vi.stubGlobal('localStorage', {
		getItem: () => {
			throw new Error('blocked');
		},
		setItem: () => {
			throw new Error('quota');
		},
	});
	const api = createNodesApi();
	const checked = await api.getInfo(peer, signal());
	expect(api.getCachedInfo([peer])).toEqual([checked]);
	expect(await api.getInfo(peer, signal())).toEqual(checked);
	expect(fetchMock).toHaveBeenCalledTimes(2);
});
