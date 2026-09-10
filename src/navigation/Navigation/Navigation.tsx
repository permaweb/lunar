import React from 'react';
import { useDispatch } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { ReactSVG } from 'react-svg';
import { debounce } from 'lodash';
import { useTheme } from 'styled-components';

import { getBlock } from 'api/blocks';

import { Button } from 'components/atoms/Button';
import { FormField } from 'components/atoms/FormField';
import { Modal } from 'components/atoms/Modal';
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
	return checkValidAddress(value) || checkValidBlockHeight(value) || checkValidBlockId(value);
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
	const [txResponse, setTxResponse] = React.useState<any | null>(null);
	const [panelOpen, setPanelOpen] = React.useState<boolean>(false);
	const [prices, setPrices] = React.useState<{ ao: number | null; ar: number | null }>({
		ao: null,
		ar: null,
	});

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
				path: URLS.base,
				icon: ASSETS.app,
				label: language.home,
			},
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
		(async function () {
			if (inputTxId && isValidSearchInput(inputTxId)) {
				setTxOutputOpen(true);
				setLoadingTx(true);
				try {
					// Handle block searches
					if (checkValidBlockHeight(inputTxId) || checkValidBlockId(inputTxId)) {
						const block = await getBlock(
							checkValidBlockHeight(inputTxId) ? { height: Number(inputTxId) } : { id: inputTxId }
						);

						if (block) {
							// Create a response that matches the expected structure
							setTxResponse({
								node: {
									id: inputTxId,
									tags: [
										{ name: 'Type', value: 'Block' },
										{ name: 'Name', value: `${language.block || 'Block'} ${formatCount(block.height.toString())}` },
									],
								},
							});
						} else {
							setTxResponse(null);
						}
					}
					// Handle transaction/process/message searches
					else {
						const response = await searchTxById({
							txId: inputTxId,
							getGQLData: permawebProvider.legacyApi.getGQLData,
							readProcess: permawebProvider.legacyApi.readProcess,
							store: store,
							dispatch: dispatch,
						});

						setTxResponse(response ?? { node: { id: inputTxId, tags: [] } });
					}
				} catch (e: any) {
					console.error(e);
					setTxResponse(null);
				}
				setLoadingTx(false);
			} else {
				setTxResponse(null);
				setTxOutputOpen(false);
			}
		})();
	}, [inputTxId, language.block, permawebProvider.legacyApi?.getGQLData, dispatch]);

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
						to={`${URLS.explorer}${txResponse.node.id}`}
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
					<p>{language.txNotFound}</p>
				</S.SearchOutputPlaceholder>
			);
		}

		return null;
	}, [loadingTx, txResponse, inputTxId, language.txNotFound]);

	function getSearch(autoFocus: boolean = false) {
		return (
			<S.SearchWrapper>
				<S.SearchInputWrapper>
					<ReactSVG src={ASSETS.search} />
					<FormField
						value={inputTxId}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputTxId(e.target.value)}
						onFocus={() => setTxOutputOpen(true)}
						placeholder={language.explorerSearchInput}
						invalid={{ status: inputTxId ? !isValidSearchInput(inputTxId) : false, message: null }}
						disabled={loadingTx}
						autoFocus={autoFocus}
						hideErrorMessage
						sm
					/>
				</S.SearchInputWrapper>
				{txOutputOpen && isValidSearchInput(inputTxId) && <S.SearchOutputWrapper>{searchOutput}</S.SearchOutputWrapper>}
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
							<Button
								type={'alt1'}
								icon={ASSETS.search}
								onPress={() => {
									setPanelOpen(false);
									setSearchOpen(true);
								}}
								height={36.5}
								width={36.5}
								noMinWidth
								iconSize={14.5}
								tooltip={language.search}
								stopPropagation
								preventDefault
							/>
						</S.SearchActionWrapper>
						<S.MMenuWrapper>
							<Button
								type={'alt1'}
								icon={ASSETS.menu}
								onPress={() => {
									setSearchOpen(false);
									setPanelOpen(true);
								}}
								height={36.5}
								width={36.5}
								noMinWidth
								iconSize={16.5}
								stopPropagation
								preventDefault
							/>
						</S.MMenuWrapper>
						<WalletConnect />
					</S.ActionsWrapper>
				</S.Content>
			</S.Header>
			{searchOpen && (
				<Modal type={'panel'} width={500} header={language.search} onClose={() => setSearchOpen(false)}>
					<S.MSearchPanelContent>{getSearch(true)}</S.MSearchPanelContent>
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
