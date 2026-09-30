import React from 'react';
import { useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';
import { debounce } from 'lodash';
import { useTheme } from 'styled-components';

import { arweaveNodeApi, ArweaveNodeError } from 'api/arweaveNode';
import { getBlock } from 'api/blocks';

import { ActionMenu } from 'components/atoms/ActionMenu';
import { Button } from 'components/atoms/Button';
import { FormField } from 'components/atoms/FormField';
import { Modal } from 'components/atoms/Modal';
import { TokenPrice } from 'components/atoms/TokenPrice';
import { getArweaveNodeRoute, normalizeArweaveNode } from 'helpers/arweaveNode';
import { ASSETS, PROCESSES, STYLING, URLS } from 'helpers/config';
import { searchTxById } from 'helpers/search';
import { checkValidBlockHeight, checkValidBlockId, isValidSearchInput } from 'helpers/searchInput';
import { formatAddress, formatCount, getTagValue } from 'helpers/utils';
import { checkWindowCutoff } from 'helpers/window';
import { useExplorerNavigation } from 'hooks/useExplorerNavigation';
import { useTokenPrices } from 'hooks/useTokenPrices';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { usePermawebProvider } from 'providers/PermawebProvider';
import { useSettingsProvider } from 'providers/SettingsProvider';
import { store } from 'store';
import { WalletConnect } from 'wallet/WalletConnect';

import * as S from './styles';

type NavigationItem = { label: string } & ({ path: string } | { id: string; onSelect: () => void });

export default function Navigation(props: { open: boolean; toggle: () => void; hideTokenPrices?: boolean }) {
	const dispatch = useDispatch();
	const location = useLocation();
	const { isInAppTabsEnabled } = useExplorerNavigation();
	const navigate = useNavigate();
	const settingsProvider = useSettingsProvider();
	const theme = useTheme();

	const permawebProvider = usePermawebProvider();
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const [searchOpen, setSearchOpen] = React.useState<boolean>(false);
	const [inputTxId, setInputTxId] = React.useState<string>('');
	const [txOutputOpen, setTxOutputOpen] = React.useState<boolean>(false);
	const [loadingTx, setLoadingTx] = React.useState<boolean>(false);
	const [txResponse, setTxResponse] = React.useState<{
		node: { id: string; tags: { name: string; value: string }[] };
	} | null>(null);
	const [searchError, setSearchError] = React.useState<string | null>(null);
	const [panelOpen, setPanelOpen] = React.useState<boolean>(false);
	const prices = useTokenPrices();

	const handleOpenSearch = React.useCallback(() => {
		setPanelOpen(false);
		setSearchOpen(true);
	}, []);

	const handleCloseSearch = React.useCallback(() => setSearchOpen(false), []);

	React.useEffect(() => {
		function handleSearchShortcut(event: KeyboardEvent) {
			if (
				event.key !== '/' ||
				event.defaultPrevented ||
				event.repeat ||
				event.isComposing ||
				event.ctrlKey ||
				event.metaKey ||
				event.altKey ||
				searchOpen
			)
				return;

			const target = event.target;
			if (
				target instanceof Element &&
				target.closest(
					'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="spinbutton"]'
				)
			)
				return;
			if (document.querySelector('[role="dialog"][aria-modal="true"], dialog[open]')) return;

			event.preventDefault();
			handleOpenSearch();
		}

		document.addEventListener('keydown', handleSearchShortcut);
		return () => document.removeEventListener('keydown', handleSearchShortcut);
	}, [searchOpen, handleOpenSearch]);

	React.useEffect(() => {
		const header = document.getElementById('navigation-header');
		if (!header) return;

		const handleScroll = () => {
			if (window.scrollY > 0) {
				header.style.borderBottom = `1px solid ${theme.colors.border.primary}`;
			} else {
				header.style.borderBottom = `1px solid transparent`;
			}
		};

		window.addEventListener('scroll', handleScroll);
		handleScroll();

		return () => {
			window.removeEventListener('scroll', handleScroll);
			header.style.borderBottom = 'none';
		};
	}, [theme.colors.border.primary]);

	const groups: { label: string; items: NavigationItem[] }[] = React.useMemo(
		() => [
			{
				label: language.arweave,
				items: [
					{ path: URLS.transactions, label: language.transactions },
					{ path: URLS.blocks, label: language.blocks },
					{ path: URLS.addresses, label: language.landing.wallets },
					{ path: URLS.nodes, label: language.nodes },
				],
			},
			{
				label: language.landing.ao,
				items: [
					{ path: `${URLS.base}?network=ao&activity=process#network-activity`, label: language.landing.processes },
					{ path: `${URLS.base}?network=ao&activity=message#network-activity`, label: language.messages },
				],
			},
			{
				label: language.landing.tools,
				items: [
					{ path: URLS.aos, label: language.aos },
					{ path: URLS.graphql, label: language.graphql },
				],
			},
			{
				label: language.landing.more,
				items: [
					{ path: URLS.docs, label: language.docs },
					{
						id: 'network-settings',
						label: language.networkSettings,
						onSelect: () => settingsProvider.setShowNodeSettings(true),
					},
				],
			},
		],
		[language, settingsProvider.setShowNodeSettings]
	);

	function handleWindowResize() {
		if (checkWindowCutoff(parseInt(STYLING.cutoffs.tablet))) {
			setPanelOpen(false);
		}
	}

	const debouncedResize = React.useCallback(debounce(handleWindowResize, 0), []);

	React.useEffect(() => {
		window.addEventListener('resize', debouncedResize);

		return () => {
			window.removeEventListener('resize', debouncedResize);
			debouncedResize.cancel();
		};
	}, [debouncedResize]);

	React.useEffect(() => {
		const input = inputTxId.trim();
		setTxResponse(null);
		setSearchError(null);
		if (!searchOpen || !input || !isValidSearchInput(input)) {
			setTxOutputOpen(false);
			setLoadingTx(false);
			return;
		}
		const controller = new AbortController();
		setTxOutputOpen(true);
		setLoadingTx(true);
		const timer = setTimeout(async () => {
			try {
				let result: typeof txResponse = null;
				const node = normalizeArweaveNode(input);
				if (node) {
					await arweaveNodeApi.getInfo(node, controller.signal);
					result = {
						node: {
							id: node,
							tags: [
								{ name: 'Type', value: 'arweave-node' },
								{ name: 'Name', value: node },
							],
						},
					};
				} else if (checkValidBlockHeight(input) || checkValidBlockId(input)) {
					const block = await getBlock(checkValidBlockHeight(input) ? { height: Number(input) } : { id: input });
					if (block)
						result = {
							node: {
								id: input,
								tags: [
									{ name: 'Type', value: 'Block' },
									{ name: 'Name', value: `${language.block} ${formatCount(block.height.toString())}` },
								],
							},
						};
				} else if (permawebProvider.legacyApi) {
					result = (await searchTxById({
						txId: input,
						getGQLData: permawebProvider.legacyApi.getGQLData,
						readProcess: permawebProvider.legacyApi.readProcess,
						store,
						dispatch,
					})) ?? { node: { id: input, tags: [] } };
				}
				if (!controller.signal.aborted) setTxResponse(result);
			} catch (error) {
				if (!controller.signal.aborted)
					setSearchError(
						error instanceof ArweaveNodeError ? language.nodeErrors[error.code] : language.errorFetchingData
					);
			} finally {
				if (!controller.signal.aborted) setLoadingTx(false);
			}
		}, 250);
		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	}, [searchOpen, inputTxId, language, permawebProvider.legacyApi, dispatch]);

	const searchOutput = React.useMemo(() => {
		if (loadingTx) {
			return (
				<S.SearchOutputPlaceholder>
					<p>{`${language.loading}...`}</p>
				</S.SearchOutputPlaceholder>
			);
		}

		if (txResponse) {
			const name = getTagValue(txResponse.node.tags, 'Name');
			const type = getTagValue(txResponse.node.tags, 'Type');

			return (
				<S.SearchResult>
					<Link
						to={
							type === 'arweave-node'
								? getArweaveNodeRoute(txResponse.node.id)
								: `${URLS.explorer}${txResponse.node.id}`
						}
						onClick={() => {
							setTxResponse(null);
							setInputTxId('');
							setTxOutputOpen(false);
							setSearchOpen(false);
						}}
					>
						<S.SearchResultInfo>
							<ReactSVG src={ASSETS[type?.toLowerCase()] ?? ASSETS.transaction} />
							{`${name || formatAddress(txResponse.node.id, false)}`}
						</S.SearchResultInfo>
						<ReactSVG src={ASSETS.go} />
					</Link>
				</S.SearchResult>
			);
		}

		if (isValidSearchInput(inputTxId)) {
			return (
				<S.SearchOutputPlaceholder>
					<p>{searchError ?? language.txNotFound}</p>
				</S.SearchOutputPlaceholder>
			);
		}

		return null;
	}, [loadingTx, txResponse, inputTxId, language, searchError]);

	function getSearch() {
		return (
			<S.SearchWrapper>
				<FormField
					value={inputTxId}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputTxId(e.target.value)}
					onFocus={() => setTxOutputOpen(true)}
					placeholder={language.explorerSearchInput}
					icon={ASSETS.search}
					endAdornment={
						<S.ShortcutButton type={'button'} aria-label={language.close} onClick={handleCloseSearch}>
							{language.escapeKey}
						</S.ShortcutButton>
					}
					invalid={{ status: inputTxId ? !isValidSearchInput(inputTxId) : false, message: null }}
					disabled={false}
					size={'large'}
					hideErrorMessage
				/>
				{txOutputOpen && isValidSearchInput(inputTxId) && (
					<S.SearchOutputWrapper aria-live={'polite'} aria-busy={loadingTx}>
						{searchOutput}
					</S.SearchOutputWrapper>
				)}
			</S.SearchWrapper>
		);
	}

	const isTabsView =
		isInAppTabsEnabled &&
		[URLS.explorer, URLS.aos, URLS.graphql].some(
			(path) => location.pathname === path.replace(/\/$/, '') || location.pathname.startsWith(path)
		);

	const isDocsView = location.pathname.startsWith(URLS.docs);

	return (
		<>
			<S.Header
				id={'navigation-header'}
				navigationOpen={props.open}
				className={`${isTabsView ? ' tabs-view' : isDocsView ? ' docs-view' : ''}`}
			>
				<S.Content>
					<S.C1Wrapper>
						<S.LogoWrapper>
							<Link to={URLS.base} aria-label={language.home}>
								<ReactSVG src={ASSETS.logo} />
							</Link>
						</S.LogoWrapper>
						<S.DNavWrapper aria-label={language.goTo}>
							<S.DNavLink active={location.pathname === URLS.base}>
								<Link to={URLS.base}>{language.home}</Link>
							</S.DNavLink>
							<S.DNavLink active={location.pathname.startsWith(URLS.explorer)}>
								<Link to={URLS.explorer}>{language.explorer}</Link>
							</S.DNavLink>
							{groups.map((group) => (
								<ActionMenu
									key={group.label}
									label={group.label}
									ariaLabel={group.label}
									variant="plain"
									menuOffset={0}
									items={group.items.map((item) => ({
										id: 'path' in item ? item.path : item.id,
										label: item.label,
										onSelect: 'path' in item ? () => navigate(item.path) : item.onSelect,
									}))}
								/>
							))}
						</S.DNavWrapper>
					</S.C1Wrapper>
					<S.ActionsWrapper>
						{!props.hideTokenPrices && (
							<S.PriceWrapper>
								<S.PriceItem>
									<ReactSVG className={'ar-icon'} src={ASSETS.arweave} />
									<p>
										<TokenPrice
											price={prices.ar?.price ?? null}
											change24hPercent={prices.ar?.change24hPercent ?? null}
											priceLabel={`${language.arweave} ${language.price} (USD)`}
											changeLabel={language.priceChange24h}
										/>
									</p>
								</S.PriceItem>
								<Link to={`${URLS.explorer}${PROCESSES.ao}`}>
									<S.PriceItem>
										<ReactSVG className={'ao-icon'} src={ASSETS.ao} />
										<p>
											<TokenPrice
												price={prices.ao?.price ?? null}
												change24hPercent={prices.ao?.change24hPercent ?? null}
												priceLabel={`${language.landing.ao} ${language.price} (USD)`}
												changeLabel={language.priceChange24h}
											/>
										</p>
									</S.PriceItem>
								</Link>
							</S.PriceWrapper>
						)}
						<S.SearchActionWrapper>
							<FormField
								value={''}
								onChange={() => {}}
								onClick={handleOpenSearch}
								onKeyDown={(event) => {
									if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || event.nativeEvent.isComposing)
										return;
									if (event.key === 'Enter' || event.key === ' ' || event.key === '/') {
										event.preventDefault();
										handleOpenSearch();
									}
								}}
								placeholder={language.search}
								icon={ASSETS.search}
								endAdornment={<S.ShortcutKey aria-hidden={'true'}>/</S.ShortcutKey>}
								aria-haspopup={'dialog'}
								aria-keyshortcuts={'/'}
								invalid={{ status: false, message: null }}
								disabled={false}
								readOnly
								sm
							/>
						</S.SearchActionWrapper>
						<S.MobileSearchActionWrapper>
							<Button
								type={'primary'}
								icon={ASSETS.search}
								onPress={handleOpenSearch}
								height={32.5}
								width={32.5}
								iconSize={14}
								tooltip={language.search}
								stopPropagation
								preventDefault
							/>
						</S.MobileSearchActionWrapper>
						<S.MMenuWrapper>
							<Button
								type={'primary'}
								icon={ASSETS.menu}
								tooltip={language.goTo}
								onPress={() => {
									setSearchOpen(false);
									setPanelOpen(true);
								}}
								height={32.5}
								width={32.5}
								iconSize={14}
								stopPropagation
								preventDefault
							/>
						</S.MMenuWrapper>
						<WalletConnect />
					</S.ActionsWrapper>
				</S.Content>
			</S.Header>
			{searchOpen && (
				<Modal type={'spotlight'} header={null} aria-label={language.search} onClose={handleCloseSearch}>
					{getSearch()}
				</Modal>
			)}
			{panelOpen && (
				<Modal type={'panel'} width={400} header={language.goTo} onClose={() => setPanelOpen(false)}>
					<S.MNavWrapper>
						<Link to={URLS.base} onClick={() => setPanelOpen(false)}>
							{language.home}
						</Link>
						<Link to={URLS.explorer} onClick={() => setPanelOpen(false)}>
							{language.explorer}
						</Link>
						{groups.map((group) => (
							<S.MobileGroup key={group.label}>
								<h2>{group.label}</h2>
								{group.items.map((item) =>
									'path' in item ? (
										<Link key={item.path} to={item.path} onClick={() => setPanelOpen(false)}>
											{item.label}
										</Link>
									) : (
										<S.MobileAction
											key={item.id}
											type="button"
											onClick={() => {
												setPanelOpen(false);
												item.onSelect();
											}}
										>
											{item.label}
										</S.MobileAction>
									)
								)}
							</S.MobileGroup>
						))}
					</S.MNavWrapper>
				</Modal>
			)}
		</>
	);
}
