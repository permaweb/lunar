import { Link } from 'react-router-dom';

import { Icon } from 'components/atoms/Icon';
import { ASSETS, URLS } from 'helpers/config';
import type { NetworkMetricsSnapshot } from 'helpers/types';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { formatBytes, formatDecimal, getMetric } from '../../../model/metrics';

import * as S from './styles';

export default function NetworkCards(props: { snapshot: NetworkMetricsSnapshot | null; isLoading: boolean }) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	function metric(key: string, format: 'count' | 'bytes' | 'decimal' = 'count') {
		if (!props.snapshot) return props.isLoading ? language.loading : '—';
		const raw = props.snapshot.metrics[key]?.[format === 'bytes' ? 'bytes' : 'value'];
		if (raw === null || raw === undefined) return '—';
		if (format === 'bytes') return formatBytes(raw);
		if (format === 'decimal') return formatDecimal(getMetric(props.snapshot, key));
		return /^\d+$/.test(raw) ? BigInt(raw).toLocaleString() : formatDecimal(raw);
	}
	const cards = [
		{
			id: 'arweave',
			name: language.arweave,
			icon: ASSETS.arweave,
			description: language.landing.arweaveDescription,
			detail: language.landing.arweaveDetail,
			stats: [
				{ label: language.transactions, value: metric('total-txs') },
				{ label: language.landing.currentTps, value: metric('current-tps', 'decimal') },
				{ label: language.landing.weaveSize, value: metric('total-weave-size', 'bytes') },
			],
			path: URLS.transactions,
			action: language.landing.exploreArweave,
			links: [
				{ label: language.blocks, path: URLS.blocks },
				{ label: language.landing.wallets, path: URLS.addresses },
				{ label: language.nodes, path: URLS.nodes },
			],
		},
		{
			id: 'ao',
			name: language.landing.ao,
			icon: ASSETS.ao,
			description: language.landing.aoDescription,
			detail: language.landing.aoDetail,
			stats: [
				{ label: language.landing.mainnetProcesses, value: metric('ao-mainnet-processes-total') },
				{ label: language.landing.mainnetMessages, value: metric('ao-mainnet-messages-total') },
				{ label: language.landing.messagesWindow, value: metric('ao-mainnet-messages-rolling') },
			],
			path: `${URLS.base}?network=ao#network-activity`,
			action: language.landing.exploreAo,
			links: [
				{ label: language.landing.processes, path: `${URLS.base}?network=ao&activity=process#network-activity` },
				{ label: language.messages, path: `${URLS.base}?network=ao&activity=message#network-activity` },
				{ label: language.aos, path: URLS.aos },
			],
		},
	];
	return (
		<S.Wrapper aria-label={language.landing.networks}>
			{cards.map((card) => (
				<S.Card key={card.id} className="border-wrapper-alt3" aria-labelledby={`${card.id}-title`}>
					<S.Intro>
						<S.NetworkIcon>
							<Icon src={card.icon} size={24} />
						</S.NetworkIcon>
						<div>
							<h2 id={`${card.id}-title`}>{card.name}</h2>
							<p>{card.description}</p>
						</div>
					</S.Intro>
					<S.Detail>{card.detail}</S.Detail>
					<S.Stats aria-busy={props.isLoading}>
						{card.stats.map((stat) => (
							<div key={stat.label}>
								<dt>{stat.label}</dt>
								<dd>{stat.value}</dd>
							</div>
						))}
					</S.Stats>
					<S.Actions>
						<Link to={card.path}>
							{card.action} <span aria-hidden="true">→</span>
						</Link>
						<S.Links>
							{card.links.map((link) => (
								<Link key={link.label} to={link.path}>
									{link.label}
								</Link>
							))}
						</S.Links>
					</S.Actions>
				</S.Card>
			))}
		</S.Wrapper>
	);
}
