import type { MetricDataPoint, NetworkMetricsSnapshot } from 'helpers/types';

export function getMetric(snapshot: NetworkMetricsSnapshot, key: string, field: 'bytes' | 'value' = 'value') {
	const value = snapshot.metrics[key]?.[field];
	return value === null || value === undefined ? null : Number(value);
}

function buildCurrentMetricPoint(snapshot: NetworkMetricsSnapshot): MetricDataPoint {
	return {
		day: snapshot.generatedAt,
		mainnet_messages_rolling: getMetric(snapshot, 'ao-mainnet-messages-rolling'),
		mainnet_messages_total: getMetric(snapshot, 'ao-mainnet-messages-total'),
		mainnet_processes_rolling: getMetric(snapshot, 'ao-mainnet-processes-rolling'),
		mainnet_processes_total: getMetric(snapshot, 'ao-mainnet-processes-total'),
		legacynet_messages_rolling: getMetric(snapshot, 'ao-legacynet-messages-rolling'),
		legacynet_messages_total: getMetric(snapshot, 'ao-legacynet-messages-total'),
		legacynet_processes_rolling: getMetric(snapshot, 'ao-legacynet-processes-rolling'),
		legacynet_processes_total: getMetric(snapshot, 'ao-legacynet-processes-total'),
		arweave_txs_rolling: getMetric(snapshot, 'txs-rolling'),
		arweave_txs_total: getMetric(snapshot, 'total-txs'),
	};
}

export function buildMetricHistory(snapshot: NetworkMetricsSnapshot): MetricDataPoint[] {
	const history = snapshot.history?.filter((point) => typeof point.day === 'string');
	return history?.length ? history : [buildCurrentMetricPoint(snapshot)];
}

export function formatBytes(value: string | number | null) {
	if (value === null) return '—';
	const bytes = Number(value);
	const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
	let unitIndex = 0;
	let formatted = bytes;

	while (formatted >= 1024 && unitIndex < units.length - 1) {
		formatted /= 1024;
		unitIndex++;
	}

	const maximumFractionDigits = unitIndex === 0 ? 0 : 3;
	const formattedValue = formatted.toLocaleString(undefined, {
		maximumFractionDigits,
		minimumFractionDigits: 0,
	});

	return `${formattedValue} ${units[unitIndex]}`;
}

export function formatDecimal(value: string | number | null) {
	if (value === null) return '—';
	return Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 });
}
