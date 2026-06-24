import React from 'react';

import { MetricChart } from 'components/molecules/MetricChart';
import { getMetricsEndpoint, getMetricsFallbackEndpoint } from 'helpers/endpoints';
import { MetricDataPoint, NetworkMetricsSnapshot } from 'helpers/types';

import * as S from './styles';

type MetricsSection = 'arweave-txs' | 'arweave' | 'legacynet' | 'mainnet';

let metricsRequest: Promise<NetworkMetricsSnapshot> | null = null;
let metricsSnapshot: NetworkMetricsSnapshot | null = null;
let metricsError: string | null = null;

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

async function fetchMetricsFromSource(source: (typeof METRICS_SOURCES)[number]) {
	const response = await fetch(source.url, { headers: { Accept: 'application/json' } });

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
	if (!metricsRequest) {
		metricsRequest = requestMetrics()
			.then((snapshot) => {
				metricsSnapshot = snapshot;
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
	const [snapshot, setSnapshot] = React.useState<NetworkMetricsSnapshot | null>(() => metricsSnapshot);
	const [error, setError] = React.useState<string | null>(() => metricsError);

	React.useEffect(() => {
		let cancelled = false;

		if (metricsSnapshot) {
			setSnapshot(metricsSnapshot);
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
		arweave_data_uploaded_rolling: getMetric(snapshot, 'data-uploaded-rolling', 'bytes'),
		arweave_weave_size_total: getMetric(snapshot, 'total-weave-size', 'bytes'),
		arweave_tps: getMetric(snapshot, 'current-tps'),
		arweave_proof_rate: getMetric(snapshot, 'proof-rate'),
		arweave_storage_cost_per_gib: getMetric(snapshot, 'storage-cost-ar-per-gib'),
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
			chartType: 'line',
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
			chartType: 'line',
			metric: 'arweave_txs_rolling',
			totalField: 'arweave_txs_total',
			totalLabel: 'Total Arweave Transactions',
		},
	],
	arweave: [
		{
			chartLabel: 'Weave Size',
			chartType: 'vertical-bar',
			metric: 'arweave_weave_size_total',
			totalField: 'arweave_weave_size_total',
			totalLabel: 'Total Weave Size',
			valueFormatter: formatBytes,
			valueScale: 'fit',
		},
		{
			chartLabel: 'Data Uploaded Rolling / 720 Blocks',
			chartType: 'vertical-bar',
			metric: 'arweave_data_uploaded_rolling',
			totalField: 'arweave_data_uploaded_rolling',
			totalLabel: 'Data Uploaded Rolling / 720 Blocks',
			valueFormatter: formatBytes,
		},
		{
			chartLabel: 'Current TPS',
			chartType: 'line',
			metric: 'arweave_tps',
			totalField: 'arweave_tps',
			totalLabel: 'Current TPS',
			valueFormatter: formatDecimal,
		},
		{
			chartLabel: 'Proof Rate',
			chartType: 'line',
			metric: 'arweave_proof_rate',
			totalField: 'arweave_proof_rate',
			totalLabel: 'Proofs / Second',
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
				{Array.from({ length: 7 }).map((_, index) => (
					<S.TotalPlaceholder key={index} />
				))}
			</S.TotalsWrapper>
		);
	}

	const totals = [
		{ label: 'Total Weave Size', value: formatBytes(getMetric(snapshot, 'total-weave-size', 'bytes')) },
		{ label: 'Estimated Network Size', value: formatBytes(getMetric(snapshot, 'network-size', 'bytes')) },
	];

	return (
		<S.TotalsWrapper>
			{totals.map((total) => (
				<S.TotalCard className={'border-wrapper-alt4'} key={total.label}>
					<span>{total.label}</span>
					<p>{total.value}</p>
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
			{CHARTS[props.section].map((chart, index) => (
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
					loadingDelay={1000 + index * 125}
				/>
			))}
		</S.Wrapper>
	);
}
