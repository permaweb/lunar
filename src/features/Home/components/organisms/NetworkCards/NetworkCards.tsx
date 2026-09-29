import { ExternalLink } from 'components/atoms/ExternalLink';
import { Icon } from 'components/atoms/Icon';
import { TokenPrice } from 'components/atoms/TokenPrice';
import { ASSETS, LINKS } from 'helpers/config';
import type { NetworkMetricsSnapshot } from 'helpers/types';
import { useTokenPrices } from 'hooks/useTokenPrices';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { formatBytes, formatDecimal, getMetric } from '../../../model/metrics';

import * as S from './styles';
import { usePricesScrollPosition } from './usePricesScrollPosition';

export default function NetworkCards(props: {
	snapshot: NetworkMetricsSnapshot | null;
	isLoading: boolean;
	onPricesScrollChange?: (hasScrolledPast: boolean) => void;
}) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const prices = useTokenPrices();
	const priceRefs = usePricesScrollPosition(props.onPricesScrollChange);

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
			description: language.landing.arweaveDescription,
			icon: ASSETS.arweave,
			size: 14,
			price: prices.ar,
			href: LINKS.arweave,
			visitLabel: language.landing.visitArweave,
			stats: [
				{ label: language.transactions, value: metric('total-txs') },
				{ label: language.landing.currentTps, value: metric('current-tps', 'decimal') },
				{ label: language.landing.weaveSize, value: metric('total-weave-size', 'bytes') },
			],
		},
		{
			id: 'ao',
			name: language.landing.ao,
			description: language.landing.aoDescription,
			icon: ASSETS.ao,
			size: 18,
			price: prices.ao,
			href: LINKS.ao,
			visitLabel: language.landing.visitAo,
			stats: [
				{ label: language.landing.mainnetProcesses, value: metric('ao-mainnet-processes-total') },
				{ label: language.landing.mainnetMessages, value: metric('ao-mainnet-messages-total') },
				{ label: language.landing.messagesWindow, value: metric('ao-mainnet-messages-rolling') },
			],
		},
	];
	return (
		<S.Wrapper aria-label={language.landing.networks}>
			{cards.map((card, index) => (
				<S.Card key={card.id} aria-labelledby={`${card.id}-title`}>
					<S.Intro>
						<S.IntroFlex>
							<S.NetworkIcon $size={card.size}>
								<Icon src={card.icon} size={card.size} />
							</S.NetworkIcon>
							<h2 id={`${card.id}-title`}>{card.name}</h2>
						</S.IntroFlex>
						<S.Price
							ref={(element) => {
								priceRefs.current[index] = element;
							}}
						>
							<TokenPrice
								price={card.price?.price ?? null}
								change24hPercent={card.price?.change24hPercent ?? null}
								priceLabel={`${card.name} ${language.price} (USD)`}
								changeLabel={language.priceChange24h}
							/>
						</S.Price>
					</S.Intro>
					<S.Description>
						<p>{card.description}</p>
					</S.Description>
					<S.Stats aria-busy={props.isLoading}>
						{card.stats.map((stat) => (
							<div key={stat.label}>
								<dt>{stat.label}</dt>
								<dd>{stat.value}</dd>
							</div>
						))}
					</S.Stats>
					<S.Actions>
						<ExternalLink href={card.href} label={card.visitLabel} />
					</S.Actions>
				</S.Card>
			))}
		</S.Wrapper>
	);
}
