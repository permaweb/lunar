import React from 'react';
import { useTheme } from 'styled-components';

import { ViewWrapper } from 'app/styles';
import { ViewHeader } from 'components/atoms/ViewHeader';
import { MessageList } from 'components/molecules/MessageList';
import { MessageVariantEnum } from 'helpers/types';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { Metrics } from './Metrics';
import { NodeConnection } from './NodeConnection';
import { Nodes } from './Nodes';
import * as S from './styles';

export default function Landing() {
	const theme = useTheme();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	React.useEffect(() => {
		const header = document.getElementById('navigation-header');
		if (!header) return;

		const handleScroll = () => {
			if (window.scrollY > 0) {
				header.style.borderBottom = `1px solid ${theme.colors.border.alt2}`;
			} else {
				header.style.borderBottom = 'none';
			}
		};

		window.addEventListener('scroll', handleScroll);
		handleScroll();

		return () => {
			window.removeEventListener('scroll', handleScroll);
			header.style.borderBottom = 'none';
		};
	}, [theme.colors.border.primary]);

	return (
		<S.Wrapper>
			<S.NetworkWrapper>
				<S.HeaderWrapper>
					<ViewHeader
						header={language.network}
						actions={[
							<S.Subheader>
								<span>AO Mainnet</span>
							</S.Subheader>,
						]}
					/>
				</S.HeaderWrapper>
				<ViewWrapper>
					<S.BodyFlexWrapper>
						<S.BodyFlexMetrics>
							<Metrics network={'mainnet'} gridTemplate={1} />
						</S.BodyFlexMetrics>
						<S.BodyFlexConnection>
							<NodeConnection />
						</S.BodyFlexConnection>
					</S.BodyFlexWrapper>
				</ViewWrapper>
				<ViewWrapper>
					<S.DividerWrapper>
						<div className={'landing-divider'} />
						<span>{'Available Nodes'}</span>
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
					<Metrics network={'legacynet'} gridTemplate={2} />
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
