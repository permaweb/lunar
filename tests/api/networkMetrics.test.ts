// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';

import { parseMetricsSnapshot } from '../../src/api/networkMetrics';
import { HOME_METRICS } from '../fixtures/home';

afterEach(() => {
	localStorage.clear();
	vi.unstubAllGlobals();
});

it('normalizes AO envelope metadata and unavailable metrics without losing integer precision', () => {
	const result = parseMetricsSnapshot({
		...HOME_METRICS,
		generatedAt: undefined,
		generatedat: HOME_METRICS.generatedAt,
		metrics: { ...HOME_METRICS.metrics, commitments: {}, 'total-addresses': [] },
		history: [
			{
				day: HOME_METRICS.generatedAt,
				generatedAt: HOME_METRICS.generatedAt,
				commitments: {},
				mainnet_messages_total: 90000,
			},
		],
	});
	expect(result.metrics['total-txs'].value).toBe('9007199254740993');
	expect(result.metrics['total-addresses']).toBeUndefined();
	expect(result.metrics.commitments).toBeUndefined();
	expect(result.history).toEqual([{ day: HOME_METRICS.generatedAt, mainnet_messages_total: 90000 }]);
});

it('accepts partial history and nullable metrics while preserving real zero readings', () => {
	const result = parseMetricsSnapshot({
		...HOME_METRICS,
		metrics: {
			...HOME_METRICS.metrics,
			'ao-mainnet-processes-rolling': null,
			'ao-legacynet-messages-rolling': { value: null },
		},
		history: [
			{
				day: HOME_METRICS.generatedAt,
				mainnet_messages_rolling: null,
				mainnet_messages_total: null,
				arweave_txs_rolling: 0,
				arweave_txs_total: '9007199254740993',
			},
			{ day: HOME_METRICS.generatedAt },
		],
	});
	expect(result.metrics['ao-mainnet-processes-rolling']).toBeUndefined();
	expect(result.metrics['ao-legacynet-messages-rolling']).toEqual({});
	expect(result.history).toEqual([
		{ day: HOME_METRICS.generatedAt, arweave_txs_rolling: 0, arweave_txs_total: '9007199254740993' },
		{ day: HOME_METRICS.generatedAt },
	]);
});

it.each([
	{ ...HOME_METRICS, generatedAt: 'invalid' },
	{ ...HOME_METRICS, height: -1 },
	{ ...HOME_METRICS, metrics: { count: { value: 'NaN' } } },
	{ ...HOME_METRICS, metrics: { count: { value: -10 } } },
	{ ...HOME_METRICS, window: {} },
	{ ...HOME_METRICS, history: [{ day: HOME_METRICS.generatedAt, mainnet_messages_total: {} }] },
])('rejects malformed metrics at the adapter boundary', (payload) => {
	expect(() => parseMetricsSnapshot(payload)).toThrow('invalid-response');
});

it('deduplicates requests, replaces corrupt cache, and reuses the validated snapshot', async () => {
	vi.resetModules();
	localStorage.setItem('lunar:v1:mainnet:network-metrics', '{bad json');
	const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => HOME_METRICS });
	vi.stubGlobal('fetch', fetch);
	const api = await import('../../src/api/networkMetrics');
	const [first, second] = await Promise.all([api.getMetricsSnapshot(), api.getMetricsSnapshot()]);
	expect(first).toEqual(second);
	expect(fetch).toHaveBeenCalledOnce();
	await api.getMetricsSnapshot();
	expect(fetch).toHaveBeenCalledOnce();
	expect(JSON.parse(localStorage.getItem('lunar:v1:mainnet:network-metrics')).snapshot.metrics).toEqual(
		HOME_METRICS.metrics
	);
});

it('does not cache a failed response and permits retry', async () => {
	vi.resetModules();
	const fetch = vi
		.fn()
		.mockResolvedValueOnce({ ok: false })
		.mockResolvedValueOnce({ ok: true, json: async () => HOME_METRICS });
	vi.stubGlobal('fetch', fetch);
	const api = await import('../../src/api/networkMetrics');
	await expect(api.getMetricsSnapshot()).rejects.toThrow('unavailable');
	expect(api.readMetricsSnapshot()).toBeNull();
	await expect(api.getMetricsSnapshot()).resolves.toMatchObject({ height: 2000000 });
});
