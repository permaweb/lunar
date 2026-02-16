import React from 'react';
import { ReactSVG } from 'react-svg';

import { Avatar } from 'components/atoms/Avatar';
import { Checkbox } from 'components/atoms/Checkbox';
import { Panel } from 'components/atoms/Panel';
import { ASSETS } from 'helpers/config';
import {
	darkTheme,
	darkThemeAlt1,
	darkThemeAlt2,
	darkThemeHighContrast,
	lightTheme,
	lightThemeAlt1,
	lightThemeAlt2,
	lightThemeHighContrast,
} from 'helpers/themes';
import { formatAddress } from 'helpers/utils';
import { useArweaveProvider } from 'providers/ArweaveProvider';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { usePermawebProvider } from 'providers/PermawebProvider';
import { useSettingsProvider } from 'providers/SettingsProvider';
import { CloseHandler } from 'wrappers/CloseHandler';

import * as S from './styles';

export default function WalletConnect(_props: { callback?: () => void }) {
	const arProvider = useArweaveProvider();
	const permawebProvider = usePermawebProvider();
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const { settings, updateSettings, setShowNodeSettings } = useSettingsProvider();

	const [showWallet, setShowWallet] = React.useState<boolean>(false);
	const [showWalletDropdown, setShowWalletDropdown] = React.useState<boolean>(false);
	const [showThemeSelector, setShowThemeSelector] = React.useState<boolean>(false);
	const [copied, setCopied] = React.useState<boolean>(false);

	const [label, setLabel] = React.useState<string | null>(null);

	React.useEffect(() => {
		setTimeout(() => {
			setShowWallet(true);
		}, 200);
	}, [arProvider.walletAddress]);

	React.useEffect(() => {
		if (!showWallet) {
			setLabel(`${language.fetching}...`);
		} else {
			if (arProvider.walletAddress) {
				if (permawebProvider.profile && permawebProvider.profile.username) {
					setLabel(permawebProvider.profile.username);
				} else {
					setLabel(formatAddress(arProvider.walletAddress, false));
				}
			} else {
				setLabel(language.connect);
			}
		}
	}, [showWallet, arProvider.walletAddress, permawebProvider.profile]);

	const copyAddress = React.useCallback(async (address: string) => {
		if (address) {
			if (address.length > 0) {
				await navigator.clipboard.writeText(address);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			}
		}
	}, []);

	function handlePress() {
		if (arProvider.walletAddress) {
			setShowWalletDropdown(!showWalletDropdown);
		} else {
			arProvider.setWalletModalVisible(true);
		}
	}

	function handleDisconnect() {
		arProvider.handleDisconnect();
		setShowWalletDropdown(false);
	}

	const THEMES = {
		light: {
			label: language.lightThemes,
			icon: ASSETS.light,
			variants: [
				{
					id: 'light-primary',
					name: language.lightDefault,
					background: lightTheme.neutral1,
					accent1: lightTheme.primary1,
				},
				{
					id: 'light-high-contrast',
					name: language.lightHighContrast,
					background: lightThemeHighContrast.neutral1,
					accent1: lightThemeHighContrast.neutral9,
				},
				{
					id: 'light-alt-1',
					name: language.sunlit,
					background: lightThemeAlt1.neutral1,
					accent1: lightThemeAlt1.primary1,
				},
				{
					id: 'light-alt-2',
					name: language.daybreak,
					background: lightThemeAlt2.neutral1,
					accent1: lightThemeAlt2.primary1,
				},
			],
		},
		dark: {
			label: language.darkThemes,
			icon: ASSETS.dark,
			variants: [
				{
					id: 'dark-primary',
					name: language.darkDefault,
					background: darkTheme.neutral1,
					accent1: darkTheme.primary1,
				},
				{
					id: 'dark-high-contrast',
					name: language.darkHighContrast,
					background: darkThemeHighContrast.neutral1,
					accent1: darkThemeHighContrast.neutralA1,
				},
				{
					id: 'dark-alt-1',
					name: language.eclipse,
					background: darkThemeAlt1.neutral1,
					accent1: darkThemeAlt1.primary1,
				},
				{
					id: 'dark-alt-2',
					name: language.midnight,
					background: darkThemeAlt2.neutral1,
					accent1: darkThemeAlt2.primary1,
				},
			],
		},
	};

	return (
		<>
			<CloseHandler
				callback={() => {
					setShowWalletDropdown(false);
				}}
				active={showWalletDropdown}
				disabled={!showWalletDropdown}
			>
				<S.Wrapper>
					<S.PWrapper>
						<Avatar owner={permawebProvider.profile} dimensions={{ wrapper: 35, icon: 21.5 }} callback={handlePress} />
					</S.PWrapper>
					{showWalletDropdown && (
						<S.Dropdown className={'border-wrapper-alt1 fade-in scroll-wrapper'}>
							<S.DHeaderWrapper>
								<S.DHeaderFlex>
									<Avatar owner={permawebProvider.profile} dimensions={{ wrapper: 32.5, icon: 19.5 }} callback={null} />
									<S.DHeader>
										<p>{label}</p>
									</S.DHeader>
								</S.DHeaderFlex>
							</S.DHeaderWrapper>
							<S.DBodyWrapper>
								<li onClick={() => copyAddress(arProvider.walletAddress)}>
									<ReactSVG src={ASSETS.copy} />
									{copied ? `${language.copied}!` : language.walletAddress}
								</li>
								<li onClick={() => permawebProvider.setShowProfileManager(true)}>
									<ReactSVG src={ASSETS.write} />
									{language.profile}
								</li>
								<li onClick={() => setShowNodeSettings(true)}>
									<ReactSVG src={ASSETS.settings} />
									{language.settings}
								</li>
								<li onClick={() => setShowThemeSelector(true)}>
									<ReactSVG src={ASSETS.design} />
									{language.appearance}
								</li>
							</S.DBodyWrapper>
							<S.DFooterWrapper>
								<li onClick={handleDisconnect}>
									<ReactSVG src={ASSETS.disconnect} />
									{language.disconnect}
								</li>
							</S.DFooterWrapper>
						</S.Dropdown>
					)}
				</S.Wrapper>
			</CloseHandler>
			<Panel
				open={showThemeSelector}
				width={450}
				header={language.chooseAppAppearance}
				handleClose={() => setShowThemeSelector(false)}
			>
				<S.MWrapper className={'modal-wrapper'}>
					<S.SyncToggle
						onClick={() => updateSettings('syncWithSystem', !settings.syncWithSystem)}
						active={settings.syncWithSystem}
					>
						<S.SyncToggleLabel>
							<p>{language.syncWithSystem}</p>
						</S.SyncToggleLabel>
						<Checkbox checked={settings.syncWithSystem} handleSelect={() => {}} disabled={false} />
					</S.SyncToggle>
					{Object.entries(THEMES).map(([key, theme]) => (
						<S.ThemeSection key={key}>
							<S.ThemeSectionHeader>
								<ReactSVG src={theme.icon} />
								<p>{theme.label}</p>
							</S.ThemeSectionHeader>
							<S.ThemeSectionBody>
								{theme.variants.map((variant) => {
									const isActiveTheme = settings.theme === variant.id;
									const isPreferredLight = settings.preferredLightTheme === variant.id;
									const isPreferredDark = settings.preferredDarkTheme === variant.id;
									const showIndicator =
										isActiveTheme || (settings.syncWithSystem && (isPreferredLight || isPreferredDark));

									return (
										<S.ThemeSectionBodyElement
											key={variant.id}
											onClick={() => updateSettings('theme', variant.id as any)}
										>
											<S.Preview background={variant.background} accent={variant.accent1}>
												<div id={'preview-accent-1'} />
											</S.Preview>
											<div>
												<S.Indicator active={showIndicator} />
												<p>{variant.name}</p>
											</div>
										</S.ThemeSectionBodyElement>
									);
								})}
							</S.ThemeSectionBody>
						</S.ThemeSection>
					))}
				</S.MWrapper>
			</Panel>
		</>
	);
}
