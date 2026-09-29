import type { NetworkActivityEntry } from '../../src/api/networkActivity';
import type { NetworkMetricsSnapshot } from '../../src/helpers/types';

export const HOME_METRICS: NetworkMetricsSnapshot = {
	generatedAt: '2026-09-29T12:00:00.000Z',
	height: 2000000,
	gateway: 'https://arweave.net',
	schema: 'metrics@1.0',
	window: { blocks: 720, startHeight: 1999280, endHeight: 2000000, seconds: '86400' },
	metrics: {
		'total-txs': { value: '9007199254740993' },
		'current-tps': { value: '10.5' },
		'total-weave-size': { bytes: '1099511627776' },
		'ao-mainnet-processes-total': { value: '12345' },
		'ao-mainnet-messages-total': { value: '90000' },
		'ao-mainnet-messages-rolling': { value: '250' },
	},
};
export const HOME_ACTIVITY: NetworkActivityEntry[] = [
	{ id: 'b'.repeat(64), kind: 'block', network: 'arweave', height: 2000000, timestamp: 1790683100, dataSize: null },
	{ id: 't'.repeat(43), kind: 'transaction', network: 'arweave', timestamp: 1790683000, dataSize: '1000000' },
	{ id: 'm'.repeat(43), kind: 'message', network: 'ao', timestamp: null, dataSize: '0' },
	{ id: 'p'.repeat(43), kind: 'process', network: 'ao', timestamp: 1790682900, dataSize: null },
];
