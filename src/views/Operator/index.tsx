import React from 'react';
import { useTheme } from 'styled-components';

import { ViewWrapper } from 'app/styles';
import { ViewHeader } from 'components/atoms/ViewHeader';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { Layout } from './Layout';
import * as S from './styles';
import { Toolbar } from './Toolbar';

export interface ISettings {
	servers: IServer[];
	actions: IAction[];
	currentServer?: string;
	selectedDevice?: string;
}

export interface IServer {
	name: string;
	url: string;
	configuration: any;
}

export interface IAction {
	id: string;
	deviceId: string;
	deviceLabel: string;
	actionKey: string;
	action: any;
	uniqueId: string;
	baseUrl: string;
	parameters?: Record<string, any>;
}

export default function Operator() {
	const theme = useTheme();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	React.useEffect(() => {
		const header = document.getElementById('navigation-header');
		if (header) {
			header.style.background = theme.colors.container.alt1.background;
			header.style.position = 'relative';
			header.style.boxShadow = `inset 0px 6px 6px -6px ${theme.colors.shadow.primary}`;
			header.style.borderTop = `0.5px solid ${theme.colors.border.primary}`;
			header.style.borderBottom = 'none';
		}

		const handleScroll = () => {
			if (window.scrollY > 0) {
				header.style.borderBottom = `1px solid ${theme.colors.border.primary}`;
			} else {
				header.style.borderBottom = 'none';
			}
		};

		window.addEventListener('scroll', handleScroll);
		handleScroll();

		return () => {
			window.removeEventListener('scroll', handleScroll);
			if (header) {
				header.style.background = '';
				header.style.position = 'sticky';
				header.style.boxShadow = 'none';
				header.style.borderTop = 'none';
			}
		};
	}, [theme.colors.border.primary]);

	const [activeTab, setActiveTab] = React.useState(0);
	const [settings, setSettings] = React.useState<ISettings>({
		servers: [
			{
				name: 'Default',
				url: 'http://localhost:8734',
				configuration: {},
			},
		],
		actions: [],
		currentServer: 'Default',
		selectedDevice: 'snp',
	});

	return (
		<S.Wrapper>
			<S.OperatorWrapper>
				<S.HeaderWrapper>
					{/* <ViewHeader
						header={language.hb_operator}
						actions={[
							<S.Subheader>
								<span>{language.hb_operator_info}</span>
							</S.Subheader>,
						]}
					/> */}
					<Toolbar activeTab={activeTab} setActiveTab={setActiveTab} settings={settings} setSettings={setSettings} />
				</S.HeaderWrapper>
				<ViewWrapper>
					<Layout activeTab={activeTab} settings={settings} setSettings={setSettings} />
				</ViewWrapper>
			</S.OperatorWrapper>
		</S.Wrapper>
	);
}
