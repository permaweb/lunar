import React from 'react';

import { MetricChart } from 'components/molecules/MetricChart';
import { getMetricsEndpoint } from 'helpers/endpoints';
import { MetricDataPoint } from 'helpers/types';

import * as S from './styles';

export default function Metrics() {
	const [metrics, setMetrics] = React.useState<MetricDataPoint[] | null>(null);

	React.useEffect(() => {
		(async function () {
			try {
				const response = await fetch(getMetricsEndpoint(30));
				const data = await response.json();
				setMetrics(data.reverse());
			} catch (e: any) {
				console.error(e);
			}
		})();
	}, []);

	return (
		<S.Wrapper>
			{metrics ? (
				<>
					<MetricChart dataList={metrics} metric={'txs'} totalField={'txs_roll'} chartLabel={'Total Messages'} />
					<MetricChart dataList={metrics} metric={'transfers'} totalField={'transfers'} chartLabel={'Transfers'} />
					<MetricChart
						dataList={metrics}
						metric={'active_users_over_blocks'}
						totalField={'active_users_over_blocks'}
						chartLabel={'Users'}
					/>
					<MetricChart
						dataList={metrics}
						metric={'active_processes_over_blocks'}
						totalField={'processes_roll'}
						chartLabel={'Processes'}
					/>
				</>
			) : (
				<>
					<S.Placeholder />
					<S.Placeholder />
					<S.Placeholder />
					<S.Placeholder />
				</>
			)}
		</S.Wrapper>
	);
}
