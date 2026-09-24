import React from 'react';
import { useDispatch } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { ReactSVG } from 'react-svg';
import { debounce } from 'lodash';
import { useTheme } from 'styled-components';

import { arweaveNodeApi, ArweaveNodeError } from 'api/arweaveNode';
import { getBlock } from 'api/blocks';

import { Button } from 'components/atoms/Button';
import { FormField } from 'components/atoms/FormField';
import { Modal } from 'components/atoms/Modal';
import { getArweaveNodeRoute, normalizeArweaveNode } from 'helpers/arweaveNode';
import { ASSETS, PROCESSES, STYLING, URLS } from 'helpers/config';
import { getAoPrice, getArPrice } from 'helpers/prices';
import { searchTxById } from 'helpers/search';
import { checkValidAddress, formatAddress, formatCount, getTagValue } from 'helpers/utils';
import { checkWindowCutoff } from 'helpers/window';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { usePermawebProvider } from 'providers/PermawebProvider';
import { store } from 'store';
import { WalletConnect } from 'wallet/WalletConnect';

import * as S from './styles';

function checkValidBlockId(id: string | null): boolean {
	if (!id) return false;
	return /^[a-z0-9_-]{64}$/i.test(id);
}

function checkValidBlockHeight(id: string | null): boolean {
	if (!id) return false;
	return /^\d+$/.test(id);
}

function isValidSearchInput(value: string): boolean {
	const input = value.trim();
	return (
		normalizeArweaveNode(input) !== null ||
		checkValidAddress(input) ||
		checkValidBlockHeight(input) ||
		checkValidBlockId(input)
	);
}

export default function Navigation(props: { open: boolean; toggle: () => void }) {
	const dispatch = useDispatch();
	const location = useLocation();
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
	const [prices, setPrices] = React.useState<{ ao: number | null; ar: number | null }>({
		ao: null,
		ar: null,
	});

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

	const paths = React.useMemo(() => {
		return [
			{
				path: URLS.explorer,
				icon: ASSETS.explorer,
				label: language.explorer,
			},
			{
				path: URLS.transactions,
				icon: ASSETS.transaction,
				label: language.transactions,
			},
			{
				path: URLS.blocks,
				icon: ASSETS.block,
				label: language.blocks,
			},
			{
				path: URLS.addresses,
				icon: ASSETS.users,
				label: language.addresses,
			},
			{
				path: URLS.nodes,
				icon: ASSETS.arweave,
				label: language.nodes,
			},
			{
				path: URLS.aos,
				icon: ASSETS.console,
				label: language.aos,
			},
			{
				path: URLS.graphql,
				icon: ASSETS.code,
				label: language.graphql,
			},
			{
				path: URLS.docs,
				icon: ASSETS.docs,
				label: language.docs,
			},
		];
	}, [language]);

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
		};
	}, [debouncedResize]);

	React.useEffect(() => {
		let cancelled = false;

		async function fetchPrices() {
			const [ao, ar] = await Promise.all([getAoPrice(), getArPrice()]);

			if (!cancelled) {
				setPrices({
					ao: ao,
					ar: ar,
				});
			}
		}

		fetchPrices();
		const interval = window.setInterval(fetchPrices, 60 * 1000);

		return () => {
			cancelled = true;
			window.clearInterval(interval);
		};
	}, []);

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

	function formatUsdPrice(price: number | null) {
		if (price === null) return '-';

		return price.toLocaleString(undefined, {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: price >= 1 ? 2 : 4,
			maximumFractionDigits: price >= 1 ? 2 : 6,
		});
	}

	const isTabsView =
		location.pathname.startsWith(URLS.explorer) ||
		location.pathname.startsWith(URLS.aos) ||
		location.pathname.startsWith(URLS.graphql);

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
							<Link to={URLS.base}>
								<ReactSVG src={ASSETS.logo} />
							</Link>
						</S.LogoWrapper>
						<S.DNavWrapper>
							{paths.map((element: { path: string; label: string; target?: '_blank' }, index: number) => {
								const active =
									element.path === URLS.base
										? location.pathname === URLS.base
										: location.pathname.startsWith(element.path);
								return (
									<S.DNavLink key={index} active={active}>
										<Link to={element.path} target={element.target || ''}>
											{element.label}
										</Link>
									</S.DNavLink>
								);
							})}
						</S.DNavWrapper>
					</S.C1Wrapper>
					<S.ActionsWrapper>
						<S.PriceWrapper>
							<S.PriceItem>
								<ReactSVG className={'ar-icon'} src={ASSETS.arweave} />
								<p>{formatUsdPrice(prices.ar)}</p>
							</S.PriceItem>
							<Link to={`${URLS.explorer}${PROCESSES.ao}`}>
								<S.PriceItem>
									<ReactSVG className={'ao-icon'} src={ASSETS.ao} />
									<p>{formatUsdPrice(prices.ao)}</p>
								</S.PriceItem>
							</Link>
						</S.PriceWrapper>
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
						{paths.map((element: { path: string; label: string; target?: '_blank' }, index: number) => {
							return (
								<Link key={index} to={element.path} target={element.target || ''} onClick={() => setPanelOpen(false)}>
									{element.label}
								</Link>
							);
						})}
					</S.MNavWrapper>
				</Modal>
			)}
		</>
	);
}
