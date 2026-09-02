import React from 'react';

import { requestRemote } from 'api/http';

import { Icon } from 'components/atoms/Icon';
import { MetricChart } from 'components/molecules/MetricChart';
import { ASSETS } from 'helpers/config';
import { getMetricsEndpoint, getMetricsFallbackEndpoint } from 'helpers/endpoints';
import { MetricDataPoint, NetworkMetricsSnapshot } from 'helpers/types';

import * as S from './styles';

type MetricsSection = 'arweave-txs' | 'legacynet' | 'mainnet';

let metricsRequest: Promise<NetworkMetricsSnapshot> | null = null;
let metricsSnapshot: NetworkMetricsSnapshot | null = null;
let metricsCachedAt: number | null = null;
let metricsError: string | null = null;

type MetricsCache = {
	cachedAt: number;
	snapshot: NetworkMetricsSnapshot;
};

const METRICS_CACHE_KEY = 'lunar-network-metrics';
const METRICS_CACHE_TTL = 24 * 60 * 60 * 1000;

const METRICS_SOURCES = [
	{ label: 'AO process', url: getMetricsEndpoint() },
	{ label: 'S3 fallback', url: getMetricsFallbackEndpoint() },
];

function normalizeMetricsSnapshot(payload: any, sourceLabel: string): NetworkMetricsSnapshot {
	const generatedAt = payload?.generatedAt ?? payload?.generatedat;

	if (typeof generatedAt !== 'string' || !payload?.metrics || !payload?.window) {
		throw new Error(`${sourceLabel} returned an invalid metrics payload`);
	}

	return {
		...payload,
		generatedAt,
		history: Array.isArray(payload.history) ? payload.history : [],
	} as NetworkMetricsSnapshot;
}

function getMetricsStorage(): Storage | null {
	try {
		return typeof window !== 'undefined' ? window.localStorage : null;
	} catch {
		return null;
	}
}

function clearStoredMetrics() {
	try {
		getMetricsStorage()?.removeItem(METRICS_CACHE_KEY);
	} catch {
		// Ignore storage errors; metrics can still be fetched normally.
	}
}

function readMetricsCache(): NetworkMetricsSnapshot | null {
	const now = Date.now();

	if (metricsSnapshot && metricsCachedAt !== null && now - metricsCachedAt < METRICS_CACHE_TTL) {
		return metricsSnapshot;
	}

	metricsSnapshot = null;
	metricsCachedAt = null;

	let storedCache: string | null | undefined;
	try {
		storedCache = getMetricsStorage()?.getItem(METRICS_CACHE_KEY);
	} catch {
		return null;
	}

	if (!storedCache) return null;

	try {
		const parsedCache = JSON.parse(storedCache) as MetricsCache;
		const cachedAt = Number(parsedCache?.cachedAt);

		if (!Number.isFinite(cachedAt) || now - cachedAt >= METRICS_CACHE_TTL) {
			clearStoredMetrics();
			return null;
		}

		metricsSnapshot = normalizeMetricsSnapshot(parsedCache.snapshot, 'Cached metrics');
		metricsCachedAt = cachedAt;
		return metricsSnapshot;
	} catch {
		clearStoredMetrics();
		return null;
	}
}

function writeMetricsCache(snapshot: NetworkMetricsSnapshot) {
	const cache: MetricsCache = { cachedAt: Date.now(), snapshot };
	metricsSnapshot = snapshot;
	metricsCachedAt = cache.cachedAt;

	try {
		getMetricsStorage()?.setItem(METRICS_CACHE_KEY, JSON.stringify(cache));
	} catch {
		// The in-memory cache still prevents duplicate requests during this page session.
	}
}

async function fetchMetricsFromSource(source: (typeof METRICS_SOURCES)[number]) {
	const response = await requestRemote(source.url, { headers: { Accept: 'application/json' } });

	if (!response.ok) {
		throw new Error(`${source.label} request failed with HTTP ${response.status}`);
	}

	return normalizeMetricsSnapshot(await response.json(), source.label);
}

async function requestMetrics() {
	const errors: string[] = [];

	for (const source of METRICS_SOURCES) {
		try {
			return await fetchMetricsFromSource(source);
		} catch (error) {
			errors.push(`${source.label}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	throw new Error(`Metrics request failed (${errors.join('; ')})`);
}

function fetchMetrics() {
	const cachedSnapshot = readMetricsCache();
	if (cachedSnapshot) return Promise.resolve(cachedSnapshot);

	if (!metricsRequest) {
		metricsRequest = requestMetrics()
			.then((snapshot) => {
				writeMetricsCache(snapshot);
				metricsRequest = null;
				metricsError = null;
				return snapshot;
			})
			.catch((error) => {
				metricsRequest = null;
				metricsError = error instanceof Error ? error.message : String(error);
				throw error;
			});
	}

	return metricsRequest;
}

function useMetrics() {
	const [snapshot, setSnapshot] = React.useState<NetworkMetricsSnapshot | null>(() => readMetricsCache());
	const [error, setError] = React.useState<string | null>(() => metricsError);

	React.useEffect(() => {
		let cancelled = false;

		const cachedSnapshot = readMetricsCache();
		if (cachedSnapshot) {
			setSnapshot(cachedSnapshot);
			setError(null);
			return;
		}

		fetchMetrics()
			.then((data) => {
				if (!cancelled) {
					setError(null);
					setSnapshot(data);
				}
			})
			.catch((requestError) => {
				if (!cancelled) setError(requestError instanceof Error ? requestError.message : String(requestError));
			});

		return () => {
			cancelled = true;
		};
	}, []);

	return { error, snapshot };
}

function getMetric(snapshot: NetworkMetricsSnapshot, key: string, field: 'bytes' | 'value' = 'value') {
	const value = snapshot.metrics[key]?.[field];
	return value === null || value === undefined ? 0 : Number(value);
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

function buildMetricHistory(snapshot: NetworkMetricsSnapshot): MetricDataPoint[] {
	const history = snapshot.history?.filter((point) => typeof point.day === 'string');
	return history?.length ? history : [buildCurrentMetricPoint(snapshot)];
}

function formatBytes(value: string | number) {
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

function formatDecimal(value: string | number) {
	return Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

const CHARTS: Record<
	MetricsSection,
	{
		chartLabel: string;
		chartType: 'horizontal-bar' | 'line' | 'vertical-bar';
		metric: keyof MetricDataPoint;
		totalField: keyof MetricDataPoint;
		totalLabel: string;
		valueFormatter?: (value: string | number) => string;
		valueScale?: 'fit' | 'zero';
	}[]
> = {
	mainnet: [
		{
			chartLabel: 'Mainnet Messages / 720 Blocks',
			chartType: 'vertical-bar',
			metric: 'mainnet_messages_rolling',
			totalField: 'mainnet_messages_total',
			totalLabel: 'Total Mainnet Messages',
		},
		{
			chartLabel: 'Mainnet Processes / 720 Blocks',
			chartType: 'line',
			metric: 'mainnet_processes_rolling',
			totalField: 'mainnet_processes_total',
			totalLabel: 'Total Mainnet Processes',
		},
	],
	legacynet: [
		{
			chartLabel: 'Legacynet Messages / 720 Blocks',
			chartType: 'line',
			metric: 'legacynet_messages_rolling',
			totalField: 'legacynet_messages_total',
			totalLabel: 'Total Legacynet Messages',
		},
	],
	['arweave-txs']: [
		{
			chartLabel: 'Transactions / 720 Blocks',
			chartType: 'vertical-bar',
			metric: 'arweave_txs_rolling',
			totalField: 'arweave_txs_total',
			totalLabel: 'Total Arweave Transactions',
		},
	],
};

export function MetricTotals() {
	const { error, snapshot } = useMetrics();

	if (error) {
		return <S.ErrorWrapper>{error}</S.ErrorWrapper>;
	}

	if (!snapshot) {
		return (
			<S.TotalsWrapper>
				{Array.from({ length: 4 }).map((_, index) => (
					<S.TotalPlaceholder key={index} />
				))}
			</S.TotalsWrapper>
		);
	}

	const totals = [
		{
			icon: ASSETS.data,
			label: 'Total Weave Size',
			value: formatBytes(getMetric(snapshot, 'total-weave-size', 'bytes')),
		},
		{
			icon: ASSETS.upload,
			label: 'Data Uploaded / 720 Blocks',
			value: formatBytes(getMetric(snapshot, 'data-uploaded-rolling', 'bytes')),
		},
		{ icon: ASSETS.time, label: 'Current TPS', value: formatDecimal(getMetric(snapshot, 'current-tps')) },
		{ icon: ASSETS.block, label: 'Proofs / Second', value: formatDecimal(getMetric(snapshot, 'proof-rate')) },
	];

	return (
		<S.TotalsWrapper>
			{totals.map((total) => (
				<S.TotalCard key={total.label}>
					<S.TotalIcon>
						<Icon src={total.icon} size={15} />
					</S.TotalIcon>
					<S.TotalLabel>
						<span>{total.label}</span>
					</S.TotalLabel>
					<S.TotalValue>
						<strong>{total.value}</strong>
					</S.TotalValue>
				</S.TotalCard>
			))}
		</S.TotalsWrapper>
	);
}

export default function Metrics(props: { section: MetricsSection; gridTemplate: number }) {
	const { error, snapshot } = useMetrics();
	const history = React.useMemo(() => (snapshot ? buildMetricHistory(snapshot) : []), [snapshot]);

	if (error) {
		return <S.ErrorWrapper>{error}</S.ErrorWrapper>;
	}

	if (!snapshot) {
		return (
			<S.Wrapper gridTemplate={props.gridTemplate}>
				{CHARTS[props.section].map((chart) => (
					<S.Placeholder className={'border-wrapper-alt4'} key={chart.chartLabel} />
				))}
			</S.Wrapper>
		);
	}

	return (
		<S.Wrapper gridTemplate={props.gridTemplate}>
			{CHARTS[props.section].map((chart) => (
				<MetricChart
					key={chart.chartLabel}
					chartType={chart.chartType}
					dataList={history}
					metric={chart.metric}
					totalField={chart.totalField}
					chartLabel={chart.chartLabel}
					totalLabel={chart.totalLabel}
					valueFormatter={chart.valueFormatter}
					valueScale={chart.valueScale}
					loadingDelay={0}
				/>
			))}
		</S.Wrapper>
	);
}
