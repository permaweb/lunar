import React from 'react';

import { MetricChart } from 'components/molecules/MetricChart';
import type { MetricDataPoint, NetworkMetricsSnapshot } from 'helpers/types';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { buildMetricHistory } from '../../../model/metrics';

import * as S from './styles';
type MetricsSection = 'arweave-txs' | 'legacynet' | 'mainnet';

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
			chartLabel: 'mainnetMessagesWindow',
			chartType: 'vertical-bar',
			metric: 'mainnet_messages_rolling',
			totalField: 'mainnet_messages_total',
			totalLabel: 'mainnetMessages',
		},
		{
			chartLabel: 'mainnetProcessesWindow',
			chartType: 'line',
			metric: 'mainnet_processes_rolling',
			totalField: 'mainnet_processes_total',
			totalLabel: 'mainnetProcesses',
		},
	],
	legacynet: [
		{
			chartLabel: 'legacyMessagesWindow',
			chartType: 'line',
			metric: 'legacynet_messages_rolling',
			totalField: 'legacynet_messages_total',
			totalLabel: 'legacyMessages',
		},
	],
	['arweave-txs']: [
		{
			chartLabel: 'transactionsWindow',
			chartType: 'vertical-bar',
			metric: 'arweave_txs_rolling',
			totalField: 'arweave_txs_total',
			totalLabel: 'totalTransactions',
		},
	],
};

export default function Metrics(props: {
	section: MetricsSection;
	gridTemplate: number;
	snapshot: NetworkMetricsSnapshot | null;
}) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const snapshot = props.snapshot;
	const history = React.useMemo(() => (snapshot ? buildMetricHistory(snapshot) : []), [snapshot]);

	if (!snapshot) {
		return (
			<S.Wrapper gridTemplate={props.gridTemplate}>
				{CHARTS[props.section].map((chart) => (
					<S.Placeholder className={'border-wrapper-alt3'} key={chart.chartLabel} />
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
					chartLabel={language.landing[chart.chartLabel]}
					totalLabel={language.landing[chart.totalLabel]}
					valueFormatter={chart.valueFormatter}
					valueScale={chart.valueScale}
					loadingDelay={0}
				/>
			))}
		</S.Wrapper>
	);
}
