import { ViewWrapper } from 'app/styles';
import { Button } from 'components/atoms/Button';
import { BlockList } from 'components/molecules/BlockList';
import { MessageList } from 'components/molecules/MessageList';
import { TransactionList } from 'components/molecules/TransactionList';
import { ViewTitle } from 'components/molecules/ViewTitle';
import { HomeHero, Metrics, MetricTotals, NetworkActivity, useNetworkMetrics } from 'features/Home';
import { FLAGS } from 'helpers/config';
import { MessageVariantEnum } from 'helpers/types';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { NodeConnection } from './NodeConnection';
import { Nodes } from './Nodes';
import * as S from './styles';

export default function Landing(props: { onPricesScrollChange?: (hasScrolledPast: boolean) => void }) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const metrics = useNetworkMetrics();

	return (
		<>
			<HomeHero
				snapshot={metrics.snapshot}
				isLoading={metrics.status === 'loading'}
				onPricesScrollChange={props.onPricesScrollChange}
			/>
			<ViewWrapper>
				<S.Wrapper>
					{metrics.status === 'error' && (
						<S.Status role="status">
							{language.landing.metricsError}
							<Button type="alt3" label={language.retry} onPress={metrics.onRetry} />
						</S.Status>
					)}
					<NetworkActivity />
					<S.Section aria-labelledby="statistics-title">
						<ViewTitle
							id="statistics-title"
							header={language.landing.statisticsTitle}
							headingLevel="h2"
							layout="section"
						/>
						<S.NetworkSection aria-labelledby="arweave-statistics-title">
							<ViewTitle
								id="arweave-statistics-title"
								header={language.landing.arweaveNetwork}
								headingLevel="h3"
								layout="section"
								variant="subsection"
							/>
							{metrics.status !== 'error' && (
								<>
									<MetricTotals snapshot={metrics.snapshot} />
									<Metrics section="arweave-txs" gridTemplate={1} snapshot={metrics.snapshot} />
								</>
							)}
							<S.TablesWrapper>
								<TransactionList mode="recent" header={language.recentTransactions} pageSize={10} preview />
								<BlockList header={language.recentBlocks} pageSize={10} preview />
							</S.TablesWrapper>
						</S.NetworkSection>
						<S.NetworkSection aria-labelledby="ao-statistics-title">
							<ViewTitle
								id="ao-statistics-title"
								header={language.landing.aoNetwork}
								headingLevel="h3"
								layout="section"
								variant="subsection"
							/>
							{metrics.status !== 'error' && (
								<>
									<Metrics section="mainnet" gridTemplate={2} snapshot={metrics.snapshot} />
									<Metrics section="legacynet" gridTemplate={1} snapshot={metrics.snapshot} />
								</>
							)}
							<MessageList
								header={language.recentMessages}
								variant={MessageVariantEnum.Legacynet}
								pageSize={20}
								preview
							/>
						</S.NetworkSection>
					</S.Section>
					<S.Section aria-labelledby="connection-title">
						<ViewTitle
							id="connection-title"
							header={language.landing.connectionTitle}
							headingLevel="h4"
							layout="section"
							variant="subsection"
						/>
						<NodeConnection />
						{FLAGS.SHOW_AVAILABLE_NODES && <Nodes />}
					</S.Section>
				</S.Wrapper>
			</ViewWrapper>
		</>
	);
}
