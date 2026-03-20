import React from 'react';
import { ReactSVG } from 'react-svg';

import { Avatar } from 'components/atoms/Avatar';
import { Checkbox } from 'components/atoms/Checkbox';
import { IconButton } from 'components/atoms/IconButton';
import { Panel } from 'components/atoms/Panel';
import { ASSETS, PROCESSES, TOKEN_DENOMINATIONS } from 'helpers/config';
import { getARBalanceEndpoint } from 'helpers/endpoints';
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
import { checkValidAddress, formatAddress, formatCount, isNumeric } from 'helpers/utils';
import { useArweaveProvider } from 'providers/ArweaveProvider';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { usePermawebProvider } from 'providers/PermawebProvider';
import { useSettingsProvider } from 'providers/SettingsProvider';
import { CloseHandler } from 'wrappers/CloseHandler';

import * as S from './styles';

const WalletBalanceSection = React.memo(
	({
		balanceSource = 'process',
		processId,
		tokenName,
		denomination,
		walletAddress,
		libs,
		errorFetching,
		loading,
		refresh,
	}: {
		balanceSource?: 'process' | 'arweave';
		processId?: string;
		tokenName: string;
		denomination: number;
		walletAddress: string | null;
		libs: any;
		errorFetching: string;
		loading: string;
		refresh: string;
	}) => {
		const [walletBalance, setWalletBalance] = React.useState<number | string | null>(null);
		const [loadingBalance, setLoadingBalance] = React.useState<boolean>(false);

		const hasFetchedRef = React.useRef(false);

		const fetchBalance = React.useCallback(async () => {
			if (!walletAddress || !checkValidAddress(walletAddress)) return;

			setLoadingBalance(true);
			setWalletBalance(null);

			try {
				let response: any = null;

				if (balanceSource === 'arweave') {
					const arResponse = await fetch(getARBalanceEndpoint(walletAddress));
					if (!arResponse.ok) {
						throw new Error(`AR balance request failed with status ${arResponse.status}`);
					}
					response = await arResponse.text();
				} else {
					if (!processId) {
						setWalletBalance('Error');
						return;
					}
					response = await libs.readProcess({
						processId: processId,
						action: 'Balance',
						tags: [{ name: 'Recipient', value: walletAddress }],
					});
				}

				if (!isNumeric(response)) {
					setWalletBalance('Error');
					return;
				}

				setWalletBalance(((response ?? 0) / Math.pow(10, denomination)).toFixed(denomination));
			} catch (e: any) {
				console.error(e);
				const showZeroBalance = e.toString().includes('Failed to fetch');
				setWalletBalance(showZeroBalance ? '0' : errorFetching);
			} finally {
				setLoadingBalance(false);
			}
		}, [balanceSource, processId, denomination, walletAddress, libs, errorFetching]);

		React.useEffect(() => {
			if (!hasFetchedRef.current && walletAddress && checkValidAddress(walletAddress)) {
				hasFetchedRef.current = true;
				fetchBalance();
			}
		}, [walletAddress, fetchBalance]);

		let icon = null;
		let dimensions = 15;
		let margin = '0';
		switch (processId) {
			case PROCESSES.ao:
				icon = ASSETS.ao;
				dimensions = 17.5;
				break;
			case PROCESSES.pi:
				dimensions = 10.5;
				margin = '0 0 6.5px 0';
				icon = ASSETS.pi;
				break;
		}

		if (balanceSource === 'arweave') {
			dimensions = 12.5;
			margin = '0 0 4.95px 0';
			icon = ASSETS.arweave;
		}

		const getBalanceDisplay = () => {
			if (!walletBalance) return 'Loading...';
			return isNumeric(walletBalance) ? formatCount(walletBalance.toString()) : walletBalance;
		};

		return (
			<S.BalanceWrapper isNumber={isNumeric(walletBalance)}>
				{icon && (
					<S.LogoWrapper>
						<S.Logo dimensions={dimensions} margin={margin}>
							<ReactSVG src={icon} />
						</S.Logo>
					</S.LogoWrapper>
				)}
				<p>{getBalanceDisplay()}</p>
				{!icon && <span>{tokenName}</span>}
				<S.Refresh>
					<IconButton
						type={'primary'}
						handlePress={() => {
							hasFetchedRef.current = false;
							fetchBalance();
						}}
						src={ASSETS.refresh}
						dimensions={{
							wrapper: 20,
							icon: 12.5,
						}}
						disabled={loadingBalance}
						tooltip={loadingBalance ? `${loading}...` : refresh}
						tooltipPosition={'bottom-right'}
					/>
				</S.Refresh>
			</S.BalanceWrapper>
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps.balanceSource === nextProps.balanceSource &&
			prevProps.processId === nextProps.processId &&
			prevProps.tokenName === nextProps.tokenName &&
			prevProps.denomination === nextProps.denomination &&
			prevProps.walletAddress === nextProps.walletAddress &&
			prevProps.libs === nextProps.libs
		);
	}
);

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
						<Avatar
							owner={permawebProvider.profile}
							isConnected={!!arProvider.walletAddress}
							dimensions={{ wrapper: 35, icon: 21.5 }}
							callback={handlePress}
						/>
					</S.PWrapper>
					{showWalletDropdown && (
						<S.Dropdown className={'border-wrapper-alt1 fade-in scroll-wrapper-hidden'}>
							<S.DHeaderWrapper>
								<S.DHeaderFlex>
									<Avatar
										owner={permawebProvider.profile}
										isConnected={!!arProvider.walletAddress}
										dimensions={{ wrapper: 32.5, icon: 19.5 }}
										callback={null}
									/>
									<S.DHeader>
										<p>{label}</p>
									</S.DHeader>
								</S.DHeaderFlex>
							</S.DHeaderWrapper>
							<S.DBalanceWrapper>
								<WalletBalanceSection
									balanceSource={'process'}
									processId={PROCESSES.ao}
									tokenName={'AO'}
									denomination={TOKEN_DENOMINATIONS.ao}
									walletAddress={arProvider.walletAddress}
									libs={permawebProvider.libs}
									errorFetching={language.errorFetching}
									loading={language.loading}
									refresh={language.refresh}
								/>
								<WalletBalanceSection
									balanceSource={'process'}
									processId={PROCESSES.pi}
									tokenName={'PI'}
									denomination={TOKEN_DENOMINATIONS.pi}
									walletAddress={arProvider.walletAddress}
									libs={permawebProvider.libs}
									errorFetching={language.errorFetching}
									loading={language.loading}
									refresh={language.refresh}
								/>
								<WalletBalanceSection
									balanceSource={'arweave'}
									tokenName={'AR'}
									denomination={TOKEN_DENOMINATIONS.ar}
									walletAddress={arProvider.walletAddress}
									libs={permawebProvider.libs}
									errorFetching={language.errorFetching}
									loading={language.loading}
									refresh={language.refresh}
								/>
							</S.DBalanceWrapper>
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
					<S.SyncToggle
						onClick={() => updateSettings('syncWithSystem', !settings.syncWithSystem)}
						active={settings.syncWithSystem}
					>
						<S.SyncToggleLabel>
							<p>{language.syncWithSystem}</p>
						</S.SyncToggleLabel>
						<Checkbox checked={settings.syncWithSystem} handleSelect={() => {}} disabled={false} />
					</S.SyncToggle>
				</S.MWrapper>
			</Panel>
		</>
	);
}
