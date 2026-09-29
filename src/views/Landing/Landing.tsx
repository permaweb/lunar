import { ViewWrapper } from 'app/styles';
import { Button } from 'components/atoms/Button';
import { BlockList } from 'components/molecules/BlockList';
import { MessageList } from 'components/molecules/MessageList';
import { TransactionList } from 'components/molecules/TransactionList';
import { HomeHero, Metrics, MetricTotals, NetworkActivity, NetworkCards, useNetworkMetrics } from 'features/Home';
import { FLAGS } from 'helpers/config';
import { MessageVariantEnum } from 'helpers/types';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { NodeConnection } from './NodeConnection';
import { Nodes } from './Nodes';
import * as S from './styles';

export default function Landing() {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const metrics = useNetworkMetrics();

	return (
		<>
			<HomeHero />
			<ViewWrapper>
				<S.Wrapper>
					<NetworkCards snapshot={metrics.snapshot} isLoading={metrics.status === 'loading'} />
					{metrics.status === 'error' && (
						<S.Status role="status">
							{language.landing.metricsError}
							<Button type="alt3" label={language.retry} onPress={metrics.onRetry} />
						</S.Status>
					)}
					<NetworkActivity />
					<S.Section aria-labelledby="statistics-title">
						<S.SectionHeading>
							<h2 id="statistics-title">{language.landing.statisticsTitle}</h2>
							<p>
								{metrics.snapshot
									? `${language.landing.snapshotUpdated} ${new Date(metrics.snapshot.generatedAt).toLocaleString()}`
									: language.landing.statisticsDescription}
							</p>
						</S.SectionHeading>
						<S.NetworkSection aria-labelledby="arweave-statistics-title">
							<h3 id="arweave-statistics-title">{language.landing.arweaveNetwork}</h3>
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
							<h3 id="ao-statistics-title">{language.landing.aoNetwork}</h3>
							<p>{language.landing.aoStatisticsDescription}</p>
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
						<S.SectionHeading>
							<h2 id="connection-title">{language.landing.connectionTitle}</h2>
							<p>{language.landing.connectionDescription}</p>
						</S.SectionHeading>
						<NodeConnection />
						{FLAGS.SHOW_AVAILABLE_NODES && <Nodes />}
					</S.Section>
				</S.Wrapper>
			</ViewWrapper>
		</>
	);
}
