import { ViewWrapper } from 'app/styles';
import { ViewHeader } from 'components/atoms/ViewHeader';
import { MessageList } from 'components/molecules/MessageList';
import { MessageVariantEnum } from 'helpers/types';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { Metrics, MetricTotals } from './Metrics';
import { NodeConnection } from './NodeConnection';
import { Nodes } from './Nodes';
import * as S from './styles';

export default function Landing() {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	return (
		<S.Wrapper>
			<S.NetworkWrapper>
				<S.HeaderWrapper>
					<ViewHeader
						header={language.network}
						actions={[
							<S.Subheader>
								<span>{language.arweave}</span>
							</S.Subheader>,
						]}
					/>
				</S.HeaderWrapper>
				<ViewWrapper>
					<S.MetricsSectionWrapper>
						<Metrics section={'arweave-txs'} gridTemplate={1} />
					</S.MetricsSectionWrapper>
				</ViewWrapper>
				<ViewWrapper>
					<MetricTotals />
				</ViewWrapper>
				<ViewWrapper>
					<S.MetricsSectionWrapper>
						<Metrics section={'arweave'} gridTemplate={2} />
					</S.MetricsSectionWrapper>
				</ViewWrapper>
				<ViewWrapper>
					<S.DividerWrapper>
						<div className={'landing-divider'} />
						<span>{language.aoMainnet}</span>
						<div className={'landing-divider'} />
					</S.DividerWrapper>
				</ViewWrapper>
				<ViewWrapper>
					<S.BodyFlexWrapper>
						<S.BodyFlexMetrics>
							<Metrics section={'mainnet'} gridTemplate={1} />
						</S.BodyFlexMetrics>
						<S.BodyFlexConnection>
							<NodeConnection />
						</S.BodyFlexConnection>
					</S.BodyFlexWrapper>
				</ViewWrapper>
				<ViewWrapper>
					<S.DividerWrapper>
						<div className={'landing-divider'} />
						<span>{language.availableNodes}</span>
						<div className={'landing-divider'} />
					</S.DividerWrapper>
				</ViewWrapper>
				<ViewWrapper>
					<S.NodesWrapper>
						<Nodes />
					</S.NodesWrapper>
				</ViewWrapper>
				<ViewWrapper>
					<S.DividerWrapper>
						<div className={'landing-divider'} />
						<span>{language.aoLegacynet}</span>
						<div className={'landing-divider'} />
					</S.DividerWrapper>
				</ViewWrapper>
				<ViewWrapper>
					<Metrics section={'legacynet'} gridTemplate={2} />
				</ViewWrapper>
			</S.NetworkWrapper>
			<S.MessagesWrapper>
				<ViewWrapper>
					<MessageList header={language.recentMessages} variant={MessageVariantEnum.Legacynet} />
				</ViewWrapper>
			</S.MessagesWrapper>
		</S.Wrapper>
	);
}
