import { NODE_INFO_CONCURRENCY } from 'helpers/config';

import { parseCountryDatabase } from './countryDatabase';
import { parsePeerAddress } from './peerAddress.mjs';
import { createRequestQueue } from './requestQueue';
import { createNodesCache } from './storage';
import type { ArweavePeer, NodeCountry, NodeObservation, NodesApi } from './types';
import { NodesApiError } from './types';

const PEERS_URL = 'https://arweave.net/peers';
const REQUEST_TIMEOUT_MS = 15_000;
const ANALYTICS_URL = 'https://stats.forward.computer/~analytics@1.0/';

export function parsePeers(value: unknown): ArweavePeer[] {
	if (!Array.isArray(value) || value.length > 4096 || value.some((entry) => typeof entry !== 'string')) {
		throw new NodesApiError('invalid-response');
	}
	const peers = new Map<string, ArweavePeer>();
	for (const entry of value) {
		const peer = parsePeerAddress(entry);
		if (peer) peers.set(peer.address, peer);
	}
	if (value.length && !peers.size) throw new NodesApiError('invalid-response');
	return [...peers.values()];
}

async function request<T>(url: string, signal: AbortSignal, read: (response: Response) => Promise<T>): Promise<T> {
	if (signal.aborted) throw new NodesApiError('cancelled');
	const controller = new AbortController();
	const cancel = () => controller.abort();
	signal.addEventListener('abort', cancel, { once: true });
	const timer = setTimeout(cancel, REQUEST_TIMEOUT_MS);
	try {
		const response = await fetch(url, { signal: controller.signal, credentials: 'omit' });
		if (response.status === 429) throw new NodesApiError('rate-limited');
		if (!response.ok) throw new NodesApiError('unavailable');
		return await read(response);
	} catch (error) {
		if (signal.aborted) throw new NodesApiError('cancelled');
		if (controller.signal.aborted) throw new NodesApiError('timeout');
		throw error instanceof NodesApiError ? error : new NodesApiError('unavailable');
	} finally {
		clearTimeout(timer);
		signal.removeEventListener('abort', cancel);
	}
}

async function jsonRequest(url: string, signal: AbortSignal): Promise<unknown> {
	return request(url, signal, async (response) => {
		if (!response.headers.get('content-type')?.includes('application/json'))
			throw new NodesApiError('invalid-response');
		try {
			return await response.json();
		} catch {
			throw new NodesApiError('invalid-response');
		}
	});
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function parseObservation(value: unknown, peer: ArweavePeer): NodeObservation {
	if (
		!isRecord(value) ||
		value.peer !== peer.address ||
		typeof value.checkedAt !== 'number' ||
		!Number.isSafeInteger(value.checkedAt) ||
		value.checkedAt <= 0 ||
		!Number.isFinite(new Date(value.checkedAt).getTime())
	)
		throw new NodesApiError('invalid-response');
	const base = { peer: peer.address, checkedAt: value.checkedAt };
	if (value.status === 'unavailable') return { ...base, status: 'unavailable' };
	if (
		value.status !== 'reachable' ||
		!isRecord(value.info) ||
		typeof value.latencyMs !== 'number' ||
		!Number.isSafeInteger(value.latencyMs) ||
		value.latencyMs < 0
	)
		throw new NodesApiError('invalid-response');
	const { height, version, release, peers } = value.info;
	if (
		[height, version, release, peers].some(
			(metric) => typeof metric !== 'number' || !Number.isSafeInteger(metric) || metric < 0
		)
	)
		throw new NodesApiError('invalid-response');
	return {
		...base,
		status: 'reachable',
		latencyMs: value.latencyMs,
		info: { height: height as number, version: version as number, release: release as number, peers: peers as number },
	};
}

function parseCountries(value: unknown, peers: ArweavePeer[]): NodeCountry[] {
	if (
		!isRecord(value) ||
		value.source !== PEERS_URL ||
		!Array.isArray(value.countries) ||
		value.countries.length > 4096
	)
		throw new NodesApiError('invalid-response');
	const allowed = new Set(peers.map((peer) => peer.ip));
	const countries = new Map<string, NodeCountry>();
	for (const entry of value.countries) {
		if (
			!isRecord(entry) ||
			typeof entry.ip !== 'string' ||
			!parsePeerAddress(`${entry.ip}:1`) ||
			typeof entry.countryCode !== 'string' ||
			!/^[A-Z]{2}$/.test(entry.countryCode) ||
			['ZZ', 'XX'].includes(entry.countryCode)
		)
			throw new NodesApiError('invalid-response');
		if (allowed.has(entry.ip)) countries.set(entry.ip, { ip: entry.ip, countryCode: entry.countryCode });
	}
	return [...countries.values()];
}

export function createNodesApi(
	countryDatabaseUrl = new URL('./data/ipv4-country.bin', import.meta.url).href,
	analyticsUrl = ANALYTICS_URL
): NodesApi {
	let countryDatabase: ReturnType<typeof parseCountryDatabase> | null = null;
	const enqueue = createRequestQueue(NODE_INFO_CONCURRENCY);
	const cache = createNodesCache(PEERS_URL, analyticsUrl, parsePeers, parseObservation);
	return {
		getCachedInfo: (peers) => cache.getInfos(peers),
		getPeers: async (signal, refresh = false) => {
			if (signal.aborted) throw new NodesApiError('cancelled');
			const cached = !refresh && cache.getPeers();
			if (cached) return cached;
			const peers = parsePeers(await jsonRequest(PEERS_URL, signal));
			if (signal.aborted) throw new NodesApiError('cancelled');
			cache.setPeers(peers);
			return peers;
		},
		supportsInfo: async (signal) => {
			const value = await jsonRequest(new URL('node-capabilities', analyticsUrl).href, signal);
			return isRecord(value) && value.version === 1 && value.nodeInfo === true && value.source === PEERS_URL;
		},
		getInfo: (peer, signal) =>
			enqueue(async () => {
				if (signal.aborted) throw new NodesApiError('cancelled');
				if (!parsePeerAddress(peer.address)) throw new NodesApiError('invalid-response');
				const cached = cache.getInfo(peer.address);
				if (cached) return cached;
				const url = new URL('node-info', analyticsUrl);
				url.searchParams.set('peer', peer.address);
				const data = parseObservation(await jsonRequest(url.href, signal), peer);
				if (signal.aborted) throw new NodesApiError('cancelled');
				cache.setInfo(data);
				return data;
			}, signal),
		getCountries: async (peers, signal) => {
			if (signal.aborted) throw new NodesApiError('cancelled');
			if (!peers.length) return { countries: [], source: 'bundled' };
			try {
				const value = await jsonRequest(new URL('node-locations', analyticsUrl).href, signal);
				return { countries: parseCountries(value, peers), source: 'analytics' };
			} catch (error) {
				if (signal.aborted) throw new NodesApiError('cancelled');
				// Keep geography available before device deployment or during an outage.
			}
			if (!countryDatabase) {
				const data = await request(countryDatabaseUrl, signal, (response) => response.arrayBuffer());
				if (signal.aborted) throw new NodesApiError('cancelled');
				countryDatabase = parseCountryDatabase(data);
			}
			const countries = [...new Set(peers.map((peer) => peer.ip))].flatMap((ip) => {
				const countryCode = countryDatabase.lookup(ip);
				return countryCode ? [{ ip, countryCode }] : [];
			});
			return { countries, source: 'bundled' };
		},
	};
}
