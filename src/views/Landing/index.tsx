import React from 'react';
import { useTheme } from 'styled-components';

import { ViewWrapper } from 'app/styles';
import { ViewHeader } from 'components/atoms/ViewHeader';
import { MessageList } from 'components/molecules/MessageList';
import { MessageVariantEnum } from 'helpers/types';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { Metrics } from './Metrics';
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
								<span>{language.aoLegacynet}</span>
							</S.Subheader>,
						]}
					/>
				</S.HeaderWrapper>
				<ViewWrapper>
					<Metrics />
				</ViewWrapper>
			</S.NetworkWrapper>
			{/* <S.NodesWrapper>
				<S.HeaderWrapper>
					<ViewHeader
						header={language.nodes}
						actions={[
							<S.Subheader>
								<span>{language.aoMainnet}</span>
							</S.Subheader>,
						]}
					/>
				</S.HeaderWrapper>
				<ViewWrapper>
					<Nodes />
				</ViewWrapper>
			</S.NodesWrapper> */}
			<S.MessagesWrapper>
				<ViewWrapper>
					<MessageList variant={MessageVariantEnum.Legacynet} />
				</ViewWrapper>
			</S.MessagesWrapper>
		</S.Wrapper>
	);
}
