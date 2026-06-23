import React from 'react';

import { MetricChart } from 'components/molecules/MetricChart';
import { getMetricsEndpoint } from 'helpers/endpoints';
import { MetricDataPoint, NetworkMetricsSnapshot } from 'helpers/types';
import { formatCount } from 'helpers/utils';

import * as S from './styles';

type MetricsSection = 'arweave-txs' | 'arweave' | 'legacynet' | 'mainnet';

type MockPoint = {
	activity: number;
	daysAgo: number;
	legacyProcesses: number;
	price: number;
	proof: number;
	storage: number;
	throughput: number;
};

const MOCK_POINTS: MockPoint[] = [
	{ activity: 0.72, daysAgo: 10, legacyProcesses: 9, price: 1.034, proof: 0.982, storage: 0.7, throughput: 0.81 },
	{ activity: 0.79, daysAgo: 9, legacyProcesses: 7, price: 1.026, proof: 0.991, storage: 0.77, throughput: 0.86 },
	{ activity: 0.75, daysAgo: 8, legacyProcesses: 6, price: 1.031, proof: 0.976, storage: 0.74, throughput: 0.78 },
	{ activity: 0.86, daysAgo: 7, legacyProcesses: 5, price: 1.019, proof: 1.008, storage: 0.82, throughput: 0.91 },
	{ activity: 0.81, daysAgo: 6, legacyProcesses: 4, price: 1.022, proof: 0.997, storage: 0.8, throughput: 0.84 },
	{ activity: 0.9, daysAgo: 5, legacyProcesses: 4, price: 1.014, proof: 1.014, storage: 0.87, throughput: 0.95 },
	{ activity: 0.88, daysAgo: 4, legacyProcesses: 3, price: 1.012, proof: 1.006, storage: 0.9, throughput: 0.92 },
	{ activity: 0.94, daysAgo: 3, legacyProcesses: 2, price: 1.008, proof: 1.021, storage: 0.93, throughput: 0.97 },
	{ activity: 0.91, daysAgo: 2, legacyProcesses: 1, price: 1.006, proof: 1.011, storage: 0.96, throughput: 0.94 },
	{ activity: 0.97, daysAgo: 1, legacyProcesses: 1, price: 1.002, proof: 1.004, storage: 0.98, throughput: 0.99 },
	{ activity: 1, daysAgo: 0, legacyProcesses: 0, price: 1, proof: 1, storage: 1, throughput: 1 },
];

let metricsRequest: Promise<NetworkMetricsSnapshot> | null = null;

function fetchMetrics() {
	if (!metricsRequest) {
		metricsRequest = fetch(getMetricsEndpoint()).then(async (response) => {
			if (!response.ok) {
				throw new Error(`Metrics request failed with HTTP ${response.status}`);
			}

			return (await response.json()) as NetworkMetricsSnapshot;
		});
	}

	return metricsRequest;
}

function useMetrics() {
	const [snapshot, setSnapshot] = React.useState<NetworkMetricsSnapshot | null>(null);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		let cancelled = false;

		fetchMetrics()
			.then((data) => {
				if (!cancelled) setSnapshot(data);
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

function buildMetricHistory(snapshot: NetworkMetricsSnapshot): MetricDataPoint[] {
	const generatedAt = new Date(snapshot.generatedAt);
	const mainnetMessages = getMetric(snapshot, 'ao-mainnet-messages-rolling');
	const mainnetProcesses = getMetric(snapshot, 'ao-mainnet-processes-rolling');
	const legacynetMessages = getMetric(snapshot, 'ao-legacynet-messages-rolling');
	const legacynetProcesses = getMetric(snapshot, 'ao-legacynet-processes-rolling');
	const arweaveTransactions = getMetric(snapshot, 'txs-rolling');
	const dataUploaded = getMetric(snapshot, 'data-uploaded-rolling', 'bytes');
	const currentTps = getMetric(snapshot, 'current-tps');
	const proofRate = getMetric(snapshot, 'proof-rate');
	const storageCost = getMetric(snapshot, 'storage-cost-ar-per-gib');

	return MOCK_POINTS.map((point) => {
		const day = new Date(generatedAt);
		day.setUTCDate(day.getUTCDate() - point.daysAgo);

		return {
			day: day.toISOString(),
			mainnet_messages_rolling: Math.round(mainnetMessages * point.activity),
			mainnet_messages_total: getMetric(snapshot, 'ao-mainnet-messages-total'),
			mainnet_processes_rolling: Math.round(mainnetProcesses * point.activity),
			mainnet_processes_total: getMetric(snapshot, 'ao-mainnet-processes-total'),
			legacynet_messages_rolling: Math.round(legacynetMessages * point.activity),
			legacynet_messages_total: getMetric(snapshot, 'ao-legacynet-messages-total'),
			legacynet_processes_rolling:
				legacynetProcesses === 0 ? point.legacyProcesses : Math.max(0, Math.round(legacynetProcesses * point.activity)),
			legacynet_processes_total: getMetric(snapshot, 'ao-legacynet-processes-total'),
			arweave_txs_rolling: Math.round(arweaveTransactions * point.activity),
			arweave_txs_total: getMetric(snapshot, 'total-txs'),
			arweave_data_uploaded_rolling: Math.round(dataUploaded * point.storage),
			arweave_weave_size_total: getMetric(snapshot, 'total-weave-size', 'bytes'),
			arweave_tps: Number((currentTps * point.throughput).toFixed(4)),
			arweave_proof_rate: Math.round(proofRate * point.proof),
			arweave_storage_cost_per_gib: Number((storageCost * point.price).toFixed(12)),
		};
	});
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

	return `${formatted >= 100 ? formatted.toFixed(0) : formatted.toFixed(2)} ${units[unitIndex]}`;
}

function formatDecimal(value: string | number) {
	return Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function formatAr(value: string | number) {
	return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 6 })} AR`;
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
		{
			chartLabel: 'Legacynet Processes / 720 Blocks',
			chartType: 'line',
			metric: 'legacynet_processes_rolling',
			totalField: 'legacynet_processes_total',
			totalLabel: 'Total Legacynet Processes',
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
			chartLabel: 'Data Uploaded Rolling / 720 Blocks',
			chartType: 'vertical-bar',
			metric: 'arweave_data_uploaded_rolling',
			totalField: 'arweave_data_uploaded_rolling',
			totalLabel: 'Data Uploaded Rolling / 720 Blocks',
			valueFormatter: formatBytes,
		},
		{
			chartLabel: 'Storage Cost / GiB',
			chartType: 'vertical-bar',
			metric: 'arweave_storage_cost_per_gib',
			totalField: 'arweave_storage_cost_per_gib',
			totalLabel: 'Storage Cost / GiB',
			valueFormatter: formatAr,
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

	const history = buildMetricHistory(snapshot);

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
					loadingDelay={1000 + index * 125}
				/>
			))}
		</S.Wrapper>
	);
}
