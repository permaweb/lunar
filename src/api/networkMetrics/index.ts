import { PROCESSES } from 'helpers/config';
import { getMetricsProcessEndpoint } from 'helpers/endpoints';
import type { MetricDataPoint, NetworkMetricsSnapshot } from 'helpers/types';

const CACHE_KEY = 'lunar:v1:mainnet:network-metrics';
const CACHE_TTL = 24 * 60 * 60 * 1000;
let cached: { savedAt: number; snapshot: NetworkMetricsSnapshot } | null = null;
let pending: Promise<NetworkMetricsSnapshot> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseMetricsSnapshot(value: unknown): NetworkMetricsSnapshot {
	if (!isRecord(value)) throw new Error('invalid-response');
	const generatedAt = value.generatedAt ?? value.generatedat;
	if (
		typeof generatedAt !== 'string' ||
		!Number.isFinite(Date.parse(generatedAt)) ||
		!isRecord(value.metrics) ||
		!isRecord(value.window) ||
		typeof value.height !== 'number' ||
		!Number.isSafeInteger(value.height) ||
		value.height < 0
	)
		throw new Error('invalid-response');
	const metrics: NetworkMetricsSnapshot['metrics'] = {};
	for (const [key, metric] of Object.entries(value.metrics)) {
		if (
			key === 'commitments' ||
			key === 'ao-types' ||
			metric === null ||
			(Array.isArray(metric) && metric.length === 0)
		)
			continue;
		if (!isRecord(metric)) throw new Error('invalid-response');
		const result: NetworkMetricsSnapshot['metrics'][string] = {};
		for (const field of ['value', 'bytes'] as const) {
			const amount = metric[field];
			if (amount === null || amount === undefined) continue;
			if (typeof amount !== 'string' || !/^\d+(\.\d+)?$/.test(amount) || !Number.isFinite(Number(amount))) {
				throw new Error('invalid-response');
			}
			result[field] = amount;
		}
		metrics[key] = result;
	}
	const history: MetricDataPoint[] = [];
	if (value.history !== undefined && !Array.isArray(value.history)) throw new Error('invalid-response');
	for (const point of Array.isArray(value.history) ? value.history : []) {
		if (!isRecord(point) || typeof point.day !== 'string' || !Number.isFinite(Date.parse(point.day))) {
			throw new Error('invalid-response');
		}
		const parsed: MetricDataPoint = { day: point.day };
		for (const [key, amount] of Object.entries(point)) {
			// The AO envelope also carries commitments and generation metadata.
			if (!/^(arweave|mainnet|legacynet)_/.test(key) || amount === null) continue;
			if ((typeof amount !== 'string' && typeof amount !== 'number') || !Number.isFinite(Number(amount))) {
				throw new Error('invalid-response');
			}
			parsed[key] = amount;
		}
		history.push(parsed);
	}
	const window = value.window;
	if (
		!['blocks', 'startHeight', 'endHeight'].every(
			(key) => Number.isSafeInteger(window[key]) && Number(window[key]) >= 0
		) ||
		typeof window.seconds !== 'string' ||
		!/^\d+(\.\d+)?$/.test(window.seconds)
	)
		throw new Error('invalid-response');
	return {
		generatedAt,
		height: value.height,
		metrics,
		history,
		gateway: typeof value.gateway === 'string' ? value.gateway : '',
		schema: typeof value.schema === 'string' ? value.schema : '',
		window: {
			blocks: Number(window.blocks),
			startHeight: Number(window.startHeight),
			endHeight: Number(window.endHeight),
			seconds: window.seconds,
		},
	};
}

export function readMetricsSnapshot(): NetworkMetricsSnapshot | null {
	try {
		if (!cached && typeof window !== 'undefined') {
			const stored = JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? 'null');
			if (isRecord(stored) && typeof stored.savedAt === 'number') {
				cached = { savedAt: stored.savedAt, snapshot: parseMetricsSnapshot(stored.snapshot) };
			}
		}
		if (cached && cached.savedAt <= Date.now() && Date.now() - cached.savedAt < CACHE_TTL) return cached.snapshot;
	} catch {
		// An unavailable or invalid persistent cache falls back to the network.
	}
	cached = null;
	return null;
}

export async function getMetricsSnapshot(): Promise<NetworkMetricsSnapshot> {
	const snapshot = readMetricsSnapshot();
	if (snapshot) return snapshot;
	if (!pending) {
		pending = (async () => {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 15000);
			try {
				const response = await fetch(getMetricsProcessEndpoint(PROCESSES.metrics), {
					headers: { Accept: 'application/json' },
					signal: controller.signal,
				});
				if (!response.ok) throw new Error('unavailable');
				const snapshot = parseMetricsSnapshot(await response.json());
				cached = { savedAt: Date.now(), snapshot };
				try {
					if (typeof window !== 'undefined') window.localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
				} catch {
					// Memory caching remains available when browser storage is disabled or full.
				}
				return snapshot;
			} finally {
				clearTimeout(timeout);
			}
		})().finally(() => {
			pending = null;
		});
	}
	return pending;
}
