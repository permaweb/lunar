import React from 'react';

import { MetricChart } from 'components/molecules/MetricChart';
import { getMetricsEndpoint } from 'helpers/endpoints';
import { MetricDataPoint } from 'helpers/types';

import * as S from './styles';

const CACHE_DURATION = 6 * 60 * 60 * 1000;

export default function Metrics(props: { network: 'mainnet' | 'legacynet'; gridTemplate: number }) {
	const [metrics, setMetrics] = React.useState<MetricDataPoint[] | null>(null);

	React.useEffect(() => {
		(async function () {
			try {
				const cacheKey = `lunar-metrics-cache-${props.network}`;
				const cachedData = localStorage.getItem(cacheKey);

				if (cachedData) {
					const { data, timestamp } = JSON.parse(cachedData);
					const now = Date.now();

					if (now - timestamp < CACHE_DURATION) {
						setMetrics(data);
						return;
					}
				}

				const response = await fetch(getMetricsEndpoint(30, props.network));
				const data = await response.json();
				const reversedData = data.reverse();

				localStorage.setItem(
					cacheKey,
					JSON.stringify({
						data: reversedData,
						timestamp: Date.now(),
					})
				);

				setMetrics(reversedData);
			} catch (e: any) {
				console.error(e);
			}
		})();
	}, [props.network]);

	const isLegacynet = props.network === 'legacynet';
	const isLoading = !metrics;

	if (isLoading) {
		return (
			<S.Wrapper gridTemplate={props.gridTemplate}>
				<S.Placeholder className={'border-wrapper-alt4'} />
				<S.Placeholder className={'border-wrapper-alt4'} />
				{isLegacynet && (
					<>
						<S.Placeholder className={'border-wrapper-alt4'} />
						<S.Placeholder className={'border-wrapper-alt4'} />
					</>
				)}
			</S.Wrapper>
		);
	}

	return (
		<S.Wrapper gridTemplate={props.gridTemplate}>
			<MetricChart dataList={metrics} metric={'txs'} totalField={'txs_roll'} chartLabel={'Total Messages'} />
			<MetricChart
				dataList={metrics}
				metric={'active_processes_over_blocks'}
				totalField={'processes_roll'}
				chartLabel={'Total Processes'}
			/>
			{isLegacynet && (
				<>
					<MetricChart dataList={metrics} metric={'transfers'} totalField={'transfers'} chartLabel={'Transfers'} />
					<MetricChart
						dataList={metrics}
						metric={'active_users_over_blocks'}
						totalField={'active_users_over_blocks'}
						chartLabel={'Users'}
					/>
				</>
			)}
		</S.Wrapper>
	);
}
