import React from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { BlockNode, getBlock } from 'api/blocks';

import { Button } from 'components/atoms/Button';
import { FormField } from 'components/atoms/FormField';
import { TxAddress } from 'components/atoms/TxAddress';
import { ASSETS, URLS } from 'helpers/config';
import { searchTxById } from 'helpers/search';
import { checkValidAddress, formatAddress, formatCount, getTagValue } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { usePermawebProvider } from 'providers/PermawebProvider';
import { store } from 'store';
import { CloseHandler } from 'wrappers/CloseHandler';

import * as S from './styles';

export interface SearchProps {
	placeholder?: string;
	onSelect?: (id: string, type: 'transaction' | 'block' | 'wallet' | 'process' | 'message' | 'bundle') => void;
	onInputChange?: (value: string) => void;
	initialValue?: string;
	disabled?: boolean;
	autoFocus?: boolean;
	showCopyButton?: boolean;
	showRefreshButton?: boolean;
	onRefresh?: () => void;
	className?: string;
	compact?: boolean;
	hideIcon?: boolean;
}

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

export default function Search(props: SearchProps) {
	const dispatch = useDispatch();
	const permawebProvider = usePermawebProvider();
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const [inputValue, setInputValue] = React.useState<string>(props.initialValue || '');
	const [loading, setLoading] = React.useState<boolean>(false);
	const [searchResult, setSearchResult] = React.useState<any>(null);
	const [outputOpen, setOutputOpen] = React.useState<boolean>(false);
	const [idCopied, setIdCopied] = React.useState<boolean>(false);

	React.useEffect(() => {
		if (props.initialValue !== undefined) {
			setInputValue(props.initialValue);
		}
	}, [props.initialValue]);

	React.useEffect(() => {
		(async function () {
			if (inputValue && isValidSearchInput(inputValue)) {
				setOutputOpen(true);
				setLoading(true);
				setSearchResult(null);

				try {
					// Handle block searches
					if (checkValidBlockHeight(inputValue) || checkValidBlockId(inputValue)) {
						const block = await getBlock(
							checkValidBlockHeight(inputValue) ? { height: Number(inputValue) } : { id: inputValue }
						);

						if (block) {
							setSearchResult({
								type: 'block',
								data: block,
								id: inputValue,
							});
						} else {
							setSearchResult({ type: 'not-found' });
						}
					}
					// Handle transaction/process/message searches
					else {
						const response = await searchTxById({
							txId: inputValue,
							getGQLData: permawebProvider.libs.getGQLData,
							readProcess: permawebProvider.libs.readProcess,
							store: store,
							dispatch: dispatch,
						});

						if (response) {
							const type = getTagValue(response.node.tags, 'Type')?.toLowerCase() || 'transaction';
							setSearchResult({
								type: type as any,
								data: response,
								id: inputValue,
							});
						} else {
							setSearchResult({ type: 'not-found' });
						}
					}
				} catch (e: any) {
					console.error(e);
					setSearchResult({ type: 'error', message: e.message });
				}

				setLoading(false);
			} else {
				setSearchResult(null);
				setOutputOpen(false);
			}
		})();
	}, [inputValue, permawebProvider, dispatch]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setInputValue(value);
		if (props.onInputChange) {
			props.onInputChange(value);
		}
	};

	const handleSelect = (id: string, type: any) => {
		if (props.onSelect) {
			props.onSelect(id, type);
		}
		setInputValue('');
		setSearchResult(null);
		setOutputOpen(false);
	};

	const copyAddress = React.useCallback(async () => {
		if (inputValue?.length > 0) {
			await navigator.clipboard.writeText(inputValue);
			setIdCopied(true);
			setTimeout(() => setIdCopied(false), 2000);
		}
	}, [inputValue]);

	const getSearchOutput = () => {
		if (loading) {
			return (
				<S.SearchOutputPlaceholder>
					<p>{`${language.loading}...`}</p>
				</S.SearchOutputPlaceholder>
			);
		}

		if (!searchResult) return null;

		if (searchResult.type === 'not-found') {
			return (
				<S.SearchOutputPlaceholder>
					<p>{language.txCannotBeFoundYet || language.txNotFound || 'Not found'}</p>
				</S.SearchOutputPlaceholder>
			);
		}

		if (searchResult.type === 'error') {
			return (
				<S.SearchOutputPlaceholder>
					<p>{searchResult.message || language.errorFetchingData || 'Error fetching data'}</p>
				</S.SearchOutputPlaceholder>
			);
		}

		// Format display based on type
		let icon = ASSETS.transaction;
		let label = formatAddress(searchResult.id, false);
		let url = `${URLS.explorer}${searchResult.id}`;

		if (searchResult.type === 'block') {
			icon = ASSETS.data;
			const block = searchResult.data as BlockNode;
			label = `${language.block || 'Block'} ${formatCount(block.height.toString())}`;
			url = `${URLS.explorer}${searchResult.id}`;
		} else if (searchResult.data?.node) {
			const name = getTagValue(searchResult.data.node.tags, 'Name');
			const type = getTagValue(searchResult.data.node.tags, 'Type');

			if (type) {
				// Map type to correct icon
				const typeIconMap: Record<string, string> = {
					process: ASSETS.process,
					message: ASSETS.message,
					bundle: ASSETS.bundle,
					wallet: ASSETS.wallet,
					block: ASSETS.block,
					transaction: ASSETS.transaction,
				};
				icon = typeIconMap[type.toLowerCase()] || ASSETS.transaction;
			}

			if (name) {
				label = name;
			}
		} else if (searchResult.type === 'wallet') {
			icon = ASSETS.wallet || ASSETS.transaction;
			label = `${language.wallet || 'Wallet'} ${formatAddress(searchResult.id, false)}`;
		}

		return (
			<S.SearchResult>
				<Link to={url} onClick={() => handleSelect(searchResult.id, searchResult.type)}>
					<S.SearchResultInfo>
						<ReactSVG src={icon} />
						{label}
					</S.SearchResultInfo>
					<ReactSVG src={ASSETS.go} />
				</Link>
			</S.SearchResult>
		);
	};

	return (
		<CloseHandler callback={() => setOutputOpen(false)} active={outputOpen} disabled={!outputOpen}>
			<S.SearchWrapper className={props.className} compact={props.compact}>
				<S.SearchInputWrapper>
					{!props.hideIcon && <ReactSVG src={ASSETS.search} />}
					<FormField
						value={inputValue}
						onChange={handleInputChange}
						onFocus={() => setOutputOpen(true)}
						placeholder={props.placeholder || language.explorerSearchInput}
						invalid={{
							status: inputValue ? !isValidSearchInput(inputValue) : false,
							message: null,
						}}
						disabled={props.disabled || loading}
						autoFocus={props.autoFocus}
						hideErrorMessage
						sm
					/>
					{props.showCopyButton && (
						<Button
							type={'alt1'}
							icon={ASSETS.copy}
							handlePress={copyAddress}
							disabled={!inputValue}
							height={32.5}
							width={32.5}
							noMinWidth
							iconSize={14.5}
							tooltip={idCopied ? `${language.copied}!` : language.copyId}
							stopPropagation
							preventDefault
						/>
					)}
					{props.showRefreshButton && (
						<Button
							type={'alt1'}
							icon={ASSETS.refresh}
							handlePress={props.onRefresh}
							disabled={loading || !isValidSearchInput(inputValue)}
							height={32.5}
							width={32.5}
							noMinWidth
							iconSize={14.5}
							tooltip={loading ? `${language.loading}...` : language.refresh}
							stopPropagation
							preventDefault
						/>
					)}
				</S.SearchInputWrapper>
				{outputOpen && isValidSearchInput(inputValue) && (
					<S.SearchOutputWrapper>{getSearchOutput()}</S.SearchOutputWrapper>
				)}
			</S.SearchWrapper>
		</CloseHandler>
	);
}
