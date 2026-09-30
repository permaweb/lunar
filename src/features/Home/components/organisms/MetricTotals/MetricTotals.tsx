import { Icon } from 'components/atoms/Icon';
import { ASSETS } from 'helpers/config';
import type { NetworkMetricsSnapshot } from 'helpers/types';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { formatBytes, formatDecimal, getMetric } from '../../../model/metrics';

import * as S from './styles';

export default function MetricTotals(props: { snapshot: NetworkMetricsSnapshot | null }) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const snapshot = props.snapshot;

	if (!snapshot) {
		return (
			<S.TotalsWrapper>
				{Array.from({ length: 4 }).map((_, index) => (
					<S.TotalPlaceholder className={'border-wrapper-alt3'} key={index} />
				))}
			</S.TotalsWrapper>
		);
	}

	const totals = [
		{
			icon: ASSETS.data,
			label: language.landing.weaveSize,
			value: formatBytes(getMetric(snapshot, 'total-weave-size', 'bytes')),
		},
		{
			icon: ASSETS.upload,
			label: language.landing.uploadedWindow,
			value: formatBytes(getMetric(snapshot, 'data-uploaded-rolling', 'bytes')),
		},
		{ icon: ASSETS.time, label: language.landing.currentTps, value: formatDecimal(getMetric(snapshot, 'current-tps')) },
		{ icon: ASSETS.block, label: language.landing.proofRate, value: formatDecimal(getMetric(snapshot, 'proof-rate')) },
	];

	return (
		<S.TotalsWrapper>
			{totals.map((total) => (
				<S.TotalCard key={total.label} className={'border-wrapper-alt3'}>
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
