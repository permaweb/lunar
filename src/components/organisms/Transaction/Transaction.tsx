import React from 'react';
import ReactDOM from 'react-dom';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';
import JSONbig from 'json-bigint';

import { Types } from '@permaweb/libs';

import {
	BlockMetadata,
	BlockNode,
	getBlock,
	getBlockMetadataByHeight,
	getCurrentBlockHeight,
	getTransactionById,
	getTransactionCountByBlock,
} from 'api/blocks';

import { Button } from 'components/atoms/Button';
import { FormField } from 'components/atoms/FormField';
import { ExplorerLink, TxAddress } from 'components/atoms/TxAddress';
import { URLTabs } from 'components/atoms/URLTabs';
import { Editor } from 'components/molecules/Editor';
import { JSONReader } from 'components/molecules/JSONReader';
import { MarkdownViewer } from 'components/molecules/MarkdownViewer';
import { MessageList } from 'components/molecules/MessageList';
import { MessageResult } from 'components/molecules/MessageResult';
import { ProcessRead } from 'components/molecules/ProcessRead';
import { TransactionList } from 'components/molecules/TransactionList';
import { ASSETS, PROCESSES, TAGS, TOKEN_DENOMINATIONS, URLS } from 'helpers/config';
import { getARBalanceEndpoint, getTxEndpoint } from 'helpers/endpoints';
import { searchTxById } from 'helpers/search';
import { MessageVariantEnum, TransactionType } from 'helpers/types';
import {
	capitalize,
	checkValidAddress,
	formatAddress,
	formatBlockId,
	formatCount,
	formatDate,
	formatUnits,
	getByteSizeDisplay,
	getRelativeDate,
	getTagValue,
	getTransactionTypeFromTags,
	isNumeric,
	removeCommitments,
	resolveLibDeps,
	resolveMessageId,
	shouldHydrateAoTransferNotices,
} from 'helpers/utils';
import { useArweaveProvider } from 'providers/ArweaveProvider';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { useNotifications } from 'providers/NotificationProvider';
import { usePermawebProvider } from 'providers/PermawebProvider';
import { store } from 'store';

import { AOS } from '../AOS';
import { ProcessEditor } from '../ProcessEditor';
import { ProcessSource } from '../ProcessSource';

import * as S from './styles';

const TX_FINALITY_CONFIRMATIONS = 15;
const ARWEAVE_BLOCK_TIME_SECONDS = 120;
const ARWEAVE_PRICE_ENDPOINT = 'https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd';

type TransactionOverviewData = {
	metadata: any | null;
	currentBlockHeight: number | null;
	arUsdPrice: number | null;
};

type DisplayTag = {
	name: string;
	value: any;
};

const TRANSACTION_OVERVIEW_CACHE_LIMIT = 50;
const transactionOverviewCache = new Map<string, TransactionOverviewData>();
const transactionOverviewRequestCache = new Map<string, Promise<TransactionOverviewData>>();
let arUsdPriceCache: number | null | undefined;
let arUsdPriceRequestCache: Promise<number | null> | null = null;

function sortTagsAlphabetically(tags: DisplayTag[]) {
	return [...tags].sort((a, b) => {
		const nameSort = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
		if (nameSort !== 0) return nameSort;

		return (a.value?.toString?.() ?? '').localeCompare(b.value?.toString?.() ?? '', undefined, {
			sensitivity: 'base',
		});
	});
}

function cacheTransactionOverview(cacheKey: string, data: TransactionOverviewData) {
	transactionOverviewCache.set(cacheKey, data);

	if (transactionOverviewCache.size > TRANSACTION_OVERVIEW_CACHE_LIMIT) {
		const oldestKey = transactionOverviewCache.keys().next().value;
		if (oldestKey) transactionOverviewCache.delete(oldestKey);
	}
}

function getTransactionOverviewCacheKey(id: string, refreshKey: number) {
	return `${id}:${refreshKey}`;
}

function fetchArUsdPrice() {
	if (arUsdPriceCache !== undefined) return Promise.resolve(arUsdPriceCache);
	if (arUsdPriceRequestCache) return arUsdPriceRequestCache;

	arUsdPriceRequestCache = fetch(ARWEAVE_PRICE_ENDPOINT)
		.then(async (response) => {
			if (!response.ok) return null;

			const parsed = await response.json();
			const value = Number(parsed?.arweave?.usd);

			return Number.isFinite(value) ? value : null;
		})
		.catch((e: any) => {
			console.error(e);
			return null;
		})
		.then((price) => {
			arUsdPriceCache = price;

			return price;
		})
		.finally(() => {
			arUsdPriceRequestCache = null;
		});

	return arUsdPriceRequestCache;
}

async function fetchTransactionOverview(id: string, refreshKey: number): Promise<TransactionOverviewData> {
	const cacheKey = getTransactionOverviewCacheKey(id, refreshKey);
	const cached = transactionOverviewCache.get(cacheKey);
	if (cached) return cached;

	const pending = transactionOverviewRequestCache.get(cacheKey);
	if (pending) return pending;

	const request = Promise.all([
		getTransactionById({ id: id }).catch((e: any) => {
			console.error(e);
			return null;
		}),
		getCurrentBlockHeight().catch((e: any) => {
			console.error(e);
			return null;
		}),
		fetchArUsdPrice(),
	])
		.then(([metadata, currentBlockHeight, arUsdPrice]) => {
			const data = { metadata, currentBlockHeight, arUsdPrice };
			cacheTransactionOverview(cacheKey, data);

			return data;
		})
		.finally(() => {
			transactionOverviewRequestCache.delete(cacheKey);
		});

	transactionOverviewRequestCache.set(cacheKey, request);

	return request;
}

// Create a context to provide txResponse to all tab views without recreating them
const TxResponseContext = React.createContext<{
	txResponse: Types.GQLNodeResponseType | null;
	inputTxId: string;
	type: TransactionType | null;
	refreshKey: number;
}>({
	txResponse: null,
	inputTxId: '',
	type: null,
	refreshKey: 0,
});

function checkValidBlockId(id: string | null): boolean {
	if (!id) return false;
	return /^[a-z0-9_-]{64}$/i.test(id);
}

function checkValidBlockHeight(id: string | null): boolean {
	if (!id) return false;
	return /^\d+$/.test(id);
}

function formatMetadataHash(id: string | null) {
	if (!id) return '';
	if (id.length <= 18) return id;

	return `${id.substring(0, 6)}...${id.substring(id.length - 8)}`;
}

function winstonToArString(winston?: string | number | null) {
	if (winston === null || winston === undefined) return null;

	const normalized = winston.toString().trim();
	if (!/^\d+$/.test(normalized)) return null;

	const padded = normalized.padStart(13, '0');
	const integer = padded.slice(0, -12) || '0';
	const decimal = padded.slice(-12);

	return `${integer}.${decimal}`;
}

function formatArDisplay(ar?: string | number | null, winston?: string | number | null) {
	const raw = ar !== null && ar !== undefined ? ar.toString() : winstonToArString(winston);
	if (!raw) return '-';

	const [integerPart, decimalPart = ''] = raw.split('.');
	const integer = formatCount((integerPart || '0').replace(/^0+(?=\d)/, '') || '0');
	const decimal = decimalPart.slice(0, 10).replace(/0+$/, '');

	return `${decimal ? `${integer}.${decimal}` : integer} AR`;
}

function formatUsdDisplay(value: number | null) {
	if (value === null || !Number.isFinite(value)) return null;

	if (value === 0) return '$0.00';
	if (Math.abs(value) < 0.01) return `$${value.toFixed(8)}`;

	return value.toLocaleString(undefined, {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 6,
	});
}

function formatCompactByteSize(bytes: number | null) {
	if (bytes === null || !Number.isFinite(bytes)) return '-';
	if (bytes < 1000) return `${bytes} B`;

	const sizes = ['KB', 'MB', 'GB', 'TB'];
	let value = bytes / 1000;
	let index = 0;

	while (value >= 1000 && index < sizes.length - 1) {
		value /= 1000;
		index += 1;
	}

	return `${Number(value.toFixed(value >= 10 ? 1 : 2))} ${sizes[index]}`;
}

function formatStatusEta(confirmations: number | null) {
	if (confirmations === null || confirmations >= TX_FINALITY_CONFIRMATIONS) return null;

	const remainingConfirmations = Math.max(TX_FINALITY_CONFIRMATIONS - confirmations, 1);
	const remainingMinutes = Math.max(1, Math.round((remainingConfirmations * ARWEAVE_BLOCK_TIME_SECONDS) / 60));

	if (remainingMinutes < 60) return `~${remainingMinutes}m`;

	const hours = Math.floor(remainingMinutes / 60);
	const minutes = remainingMinutes % 60;

	return minutes ? `~${hours}h ${minutes}m` : `~${hours}h`;
}

function Transaction(props: {
	txId: string;
	type: TransactionType | null;
	active: boolean;
	onTxChange?: (newTx: Types.GQLNodeResponseType) => void;
	handleMessageOpen: (id: string) => void;
	tabKey?: string; // Stable key from TransactionTabs to maintain component identity
	onLoadingChange?: (loading: boolean) => void;
}) {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const arProvider = useArweaveProvider();
	const permawebProvider = usePermawebProvider();
	const languageProvider = useLanguageProvider();
	const language = React.useMemo(() => languageProvider.object[languageProvider.current], [languageProvider.current]);
	const { addNotification } = useNotifications();

	const currentHash = window.location.hash.replace('#', '');

	const [inputTxId, setInputTxId] = React.useState<string>(props.txId);
	const [loadingTx, setLoadingTx] = React.useState<boolean>(false);
	const [txResponse, setTxResponse] = React.useState<Types.GQLNodeResponseType | null>(null);

	React.useEffect(() => {
		if (props.onLoadingChange) {
			props.onLoadingChange(loadingTx);
		}
	}, [loadingTx, props.onLoadingChange]);
	const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);

	// Memoize owner address to prevent unnecessary TABS recreation
	const ownerAddress = React.useMemo(() => txResponse?.node?.owner?.address, [txResponse?.node?.owner?.address]);

	const [hasFetched, setHasFetched] = React.useState<boolean>(false);
	const [refreshKey, setRefreshKey] = React.useState<number>(0);
	const [messageResult, setMessageResult] = React.useState<any>(null);

	const [idCopied, setIdCopied] = React.useState<boolean>(false);
	const [urlCopied, setUrlCopied] = React.useState<boolean>(false);
	const [bundleTransactionCount, setBundleTransactionCount] = React.useState<number | null>(null);

	const wrapperRef = React.useRef<HTMLDivElement>(null);
	const messageListRef = React.useRef<HTMLDivElement>(null);
	const messageResultRequestRef = React.useRef<number>(0);
	const mountedRef = React.useRef<boolean>(true);

	React.useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
			messageResultRequestRef.current += 1;
		};
	}, []);

	function isValidExplorerInput(value: string) {
		if (checkValidBlockHeight(value) || checkValidBlockId(value)) return true;

		switch (props.type) {
			case 'bundle':
				return checkValidAddress(value);
			default:
				return checkValidAddress(value);
		}
	}

	function buildBlockResponse(
		block: BlockNode,
		metadata: BlockMetadata | null = null,
		transactionCount: number | null = null,
		currentBlockHeight: number | null = null
	): Types.GQLNodeResponseType {
		const metadataTxCount = Array.isArray(metadata?.txs) ? metadata.txs.length : null;
		const confirmations =
			currentBlockHeight !== null && Number.isFinite(currentBlockHeight)
				? Math.max(currentBlockHeight - block.height, 0)
				: null;

		return {
			cursor: null,
			node: {
				id: inputTxId,
				tags: [
					{ name: 'Type', value: 'Block' },
					{ name: 'Name', value: formatCount(block.height.toString()) },
				],
				data: null,
				owner: {
					address: null,
				},
				block: {
					height: block.height,
					timestamp: metadata?.timestamp ?? block.timestamp,
				},
				blockId: metadata?.indep_hash ?? block.id,
				previous: metadata?.previous_block ?? block.previous,
				txRoot: metadata?.tx_root ?? null,
				blockSize: metadata?.block_size ?? null,
				txCount: transactionCount ?? metadataTxCount,
				miner: metadata?.reward_addr ?? metadata?.miner ?? null,
				minerReward: metadata?.reward ?? null,
				confirmations: confirmations,
			},
		} as any;
	}

	function buildBundleResponse(response: Types.GQLNodeResponseType | null): Types.GQLNodeResponseType {
		const bundleTags = [
			{ name: 'bundle-format', value: 'binary' },
			{ name: 'bundle-version', value: '2.0.0' },
		];
		const existingTags = response?.node?.tags ?? [];
		const tagsWithoutSynthetic = existingTags.filter(
			(tag) =>
				!['Type', 'Name', ...bundleTags.map((bundleTag) => bundleTag.name)].some(
					(tagName) => tag.name.toLowerCase() === tagName.toLowerCase()
				)
		);

		return {
			cursor: response?.cursor ?? null,
			node: {
				...(response?.node ?? {}),
				id: inputTxId,
				tags: [
					{ name: 'Type', value: 'Bundle' },
					{ name: 'Name', value: formatAddress(inputTxId, false) },
					...bundleTags,
					...tagsWithoutSynthetic,
				],
				data: response?.node?.data ?? null,
				owner: response?.node?.owner ?? {
					address: null,
				},
				block: response?.node?.block ?? {
					height: null,
					timestamp: null,
				},
			},
		} as any;
	}

	function isBundleResponse(response: Types.GQLNodeResponseType | null) {
		const tags = response?.node?.tags ?? [];

		return (
			getTagValue(tags, 'bundle-format')?.toLowerCase() === 'binary' && getTagValue(tags, 'bundle-version') === '2.0.0'
		);
	}

	const resolvedType = React.useMemo(() => {
		if (!txResponse) return props.type;

		return getTransactionTypeFromTags(txResponse.node?.tags);
	}, [txResponse, props.type]);

	React.useEffect(() => {
		setBundleTransactionCount(null);
	}, [inputTxId, resolvedType]);

	React.useEffect(() => {
		setInputTxId(props.txId);
	}, [props.txId]);

	React.useEffect(() => {
		setHasFetched(false);
		setTxResponse(null);
		setMessageResult(null);
		messageResultRequestRef.current += 1;
	}, [inputTxId]);

	React.useEffect(() => {
		if (props.active && !hasFetched && inputTxId && isValidExplorerInput(inputTxId)) {
			(async () => {
				await handleSubmit();
				setHasFetched(true);
			})();
		}
	}, [props.active, hasFetched, inputTxId, props.type]);

	async function handleSubmit() {
		if (inputTxId && isValidExplorerInput(inputTxId)) {
			setLoadingTx(true);
			setRefreshKey((prev) => prev + 1);
			const messageResultRequestId = ++messageResultRequestRef.current;
			setMessageResult(null);
			try {
				if (checkValidBlockHeight(inputTxId) || checkValidBlockId(inputTxId)) {
					const block = await getBlock(
						checkValidBlockHeight(inputTxId) ? { height: Number(inputTxId) } : { id: inputTxId }
					);

					if (!block) {
						throw new Error(language.errorFetchingData);
					}

					let blockMetadata: BlockMetadata | null = null;
					let blockTransactionCount: number | null = null;
					let currentBlockHeight: number | null = null;

					await Promise.all([
						getBlockMetadataByHeight(block.height)
							.then((metadata) => {
								blockMetadata = metadata;
							})
							.catch((e: any) => {
								console.error(e);
							}),
						getTransactionCountByBlock({ blockHeight: block.height })
							.then((count) => {
								blockTransactionCount = count;
							})
							.catch((e: any) => {
								console.error(e);
							}),
						getCurrentBlockHeight()
							.then((height) => {
								currentBlockHeight = height;
							})
							.catch((e: any) => {
								console.error(e);
							}),
					]);

					const blockResponse = buildBlockResponse(block, blockMetadata, blockTransactionCount, currentBlockHeight);
					setTxResponse(blockResponse);
					if (props.onTxChange) props.onTxChange(blockResponse);
					setLoadingTx(false);
					setHasFetched(true);
					return;
				}

				if (props.type === 'bundle') {
					let bundleLookup: Types.GQLNodeResponseType | null = null;

					try {
						bundleLookup = await searchTxById({
							txId: inputTxId,
							getGQLData: permawebProvider.libs.getGQLData,
							store: store,
							dispatch: dispatch,
						});
					} catch (e: any) {
						console.error(e);
					}

					const bundleResponse = buildBundleResponse(bundleLookup);
					setTxResponse(bundleResponse);
					if (props.onTxChange) props.onTxChange(bundleResponse);
					setLoadingTx(false);
					setHasFetched(true);
					return;
				}

				const response = await searchTxById({
					txId: inputTxId,
					getGQLData: permawebProvider.libs.getGQLData,
					store: store,
					dispatch: dispatch,
				});

				let responseData = response;
				if (isBundleResponse(responseData)) {
					responseData = buildBundleResponse(responseData);
				}

				setTxResponse(responseData ?? null);
				if (responseData) {
					if (props.onTxChange) props.onTxChange(responseData);

					setLoadingTx(false);
					setHasFetched(true);

					// Fetch message result if this is a message type
					// Check both props.type and the actual transaction tags to determine if it's a message
					const txType = getTransactionTypeFromTags(responseData.node.tags);
					const isMessage = txType === 'message';

					if (isMessage) {
						void (async () => {
							try {
								let variant = getTagValue(responseData.node.tags, 'Variant') as MessageVariantEnum;
								const recipient = responseData.node?.recipient ?? getTagValue(responseData.node?.tags, 'Target');

								if (recipient && checkValidAddress(recipient)) {
									// Find the variant of the recipient process to handle messages between networks
									try {
										const processLookup = await permawebProvider.libs.getGQLData({
											ids: [recipient],
										});

										if (processLookup.data?.length > 0) {
											const node = processLookup.data[0].node;
											const processVariant = getTagValue(node.tags, 'Variant') as MessageVariantEnum;

											if (processVariant) variant = processVariant;
										}
									} catch (e: any) {
										console.error(e);
									}

									const deps = resolveLibDeps({
										variant: variant,
										permawebProvider: permawebProvider,
									});

									const messageId = await resolveMessageId({
										messageId: inputTxId,
										variant: variant,
										target: recipient,
										permawebProvider: permawebProvider,
									});

									const resultResponse = await deps.ao.result({
										process: recipient,
										message: messageId,
									});

									if (mountedRef.current && messageResultRequestRef.current === messageResultRequestId) {
										setMessageResult(removeCommitments(resultResponse));
									}
								}
							} catch (e: any) {
								console.error('Error fetching message result:', e);
								if (mountedRef.current && messageResultRequestRef.current === messageResultRequestId) {
									setMessageResult({ Response: e.message ?? 'Error Getting Result' });
								}
							}
						})();
					}

					return;
				}
			} catch (e: any) {
				addNotification(e.message ?? language.errorFetchingTx, 'warning');
			}
			setLoadingTx(false);
			setHasFetched(true);
		}
	}

	const copyAddress = React.useCallback(async (address: string) => {
		if (address?.length > 0) {
			await navigator.clipboard.writeText(address);
			setIdCopied(true);
			setTimeout(() => setIdCopied(false), 2000);
		}
	}, []);

	const scrollToMessageList = React.useCallback(() => {
		if (messageListRef.current) {
			messageListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}, []);

	const WalletBalanceSection = React.memo(
		({
			balanceSource = 'process',
			processId,
			tokenName,
			denomination,
			walletId,
			shouldFetch,
			useNaOnError = false,
		}: {
			balanceSource?: 'process' | 'arweave';
			processId?: string;
			tokenName: string;
			denomination: number;
			walletId: string;
			shouldFetch: boolean;
			useNaOnError?: boolean;
		}) => {
			const [walletBalance, setWalletBalance] = React.useState<number | string | null>(null);
			const [loadingBalance, setLoadingBalance] = React.useState<boolean>(false);

			const hasFetchedRef = React.useRef(false);
			const currentWalletRef = React.useRef<string>('');

			const fetchBalance = React.useCallback(async () => {
				if (!walletId || !checkValidAddress(walletId)) return;

				setLoadingBalance(true);
				setWalletBalance(null);

				try {
					let response: any = null;

					if (balanceSource === 'arweave') {
						const arResponse = await fetch(getARBalanceEndpoint(walletId));
						if (!arResponse.ok) {
							throw new Error(`AR balance request failed with status ${arResponse.status}`);
						}
						response = await arResponse.text();
					} else {
						if (!processId) {
							setWalletBalance(useNaOnError ? 'N/A' : 'Error');
							return;
						}
						response = await permawebProvider.libs.readProcess({
							processId: processId,
							action: 'Balance',
							tags: [{ name: 'Recipient', value: walletId }],
						});
					}

					if (!isNumeric(response)) {
						setWalletBalance(useNaOnError ? 'N/A' : 'Error');
						return;
					}

					setWalletBalance(((response ?? 0) / Math.pow(10, denomination)).toFixed(denomination));
				} catch (e: any) {
					console.error(e);
					const showZeroBalance = e.toString().includes('Failed to fetch');
					setWalletBalance(useNaOnError ? 'N/A' : showZeroBalance ? '0' : language.errorFetching);
				} finally {
					setLoadingBalance(false);
				}
			}, [walletId, balanceSource, processId, denomination, useNaOnError, language.errorFetching]);

			React.useEffect(() => {
				// Reset when wallet changes
				if (currentWalletRef.current !== walletId) {
					currentWalletRef.current = walletId;
					hasFetchedRef.current = false;
				}

				if (!hasFetchedRef.current && shouldFetch && walletId && checkValidAddress(walletId)) {
					hasFetchedRef.current = true;
					fetchBalance();
				}
			}, [walletId, shouldFetch, fetchBalance]);

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
					<p>{getBalanceDisplay()}</p>
					{icon && (
						<>
							<S.Logo dimensions={dimensions} margin={margin}>
								<ReactSVG src={icon} />
							</S.Logo>
						</>
					)}
					{!icon && <span>{tokenName}</span>}
					<S.Refresh>
						<Button
							type={'primary'}
							handlePress={() => {
								hasFetchedRef.current = false;
								fetchBalance();
							}}
							icon={ASSETS.refresh}
							height={20}
							width={20}
							noMinWidth
							iconSize={12.5}
							disabled={loadingBalance}
							tooltip={loadingBalance ? `${language.loading}...` : language.refresh}
							tooltipPosition={'bottom-right'}
							stopPropagation
							preventDefault
						/>
					</S.Refresh>
				</S.BalanceWrapper>
			);
		},
		(prevProps, nextProps) => {
			// Only re-render if these props actually change
			return (
				prevProps.balanceSource === nextProps.balanceSource &&
				prevProps.processId === nextProps.processId &&
				prevProps.tokenName === nextProps.tokenName &&
				prevProps.denomination === nextProps.denomination &&
				prevProps.walletId === nextProps.walletId &&
				prevProps.shouldFetch === nextProps.shouldFetch &&
				prevProps.useNaOnError === nextProps.useNaOnError
			);
		}
	);

	const OverviewLine = ({ label, value, render }: { label: string; value: any; render?: (v: any) => JSX.Element }) => {
		const defaultRender = (v: any) => {
			if (typeof v === 'string' && checkValidAddress(v)) {
				return <TxAddress address={v} />;
			}
			return <p>{v}</p>;
		};

		const renderContent = render || defaultRender;

		return (
			<S.OverviewLine>
				<span>{label}</span>
				{value ? renderContent(value) : <p>-</p>}
			</S.OverviewLine>
		);
	};

	const TagValue = ({ value, tooltipPlacement = 'top' }: { value: any; tooltipPlacement?: 'top' | 'bottom' }) => {
		const displayValue = value?.toString?.() ?? value;
		const buttonRef = React.useRef<HTMLButtonElement | null>(null);
		const [copied, setCopied] = React.useState<boolean>(false);
		const [tooltipVisible, setTooltipVisible] = React.useState<boolean>(false);
		const [tooltipPosition, setTooltipPosition] = React.useState<{
			top?: number;
			bottom?: number;
			left?: number;
			right?: number;
			maxWidth: number;
		} | null>(null);
		const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

		const updateTooltipPosition = React.useCallback(() => {
			const element = buttonRef.current;
			if (!element) return;

			const rect = element.getBoundingClientRect();
			const viewportPadding = 10;
			const gap = 3.5;
			const minReadableWidth = 160;
			const shouldAlignLeft = rect.right - viewportPadding < minReadableWidth;
			const horizontalPosition = shouldAlignLeft
				? {
						left: Math.max(viewportPadding, Math.min(rect.left, window.innerWidth - viewportPadding)),
						maxWidth: Math.min(400, window.innerWidth - Math.max(viewportPadding, rect.left) - viewportPadding),
				  }
				: {
						right: window.innerWidth - Math.min(rect.right, window.innerWidth - viewportPadding),
						maxWidth: Math.min(400, rect.right - viewportPadding),
				  };

			setTooltipPosition(
				tooltipPlacement === 'bottom'
					? { top: rect.bottom + gap, ...horizontalPosition }
					: { bottom: window.innerHeight - rect.top + gap, ...horizontalPosition }
			);
		}, [tooltipPlacement]);

		React.useEffect(() => {
			return () => {
				if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
			};
		}, []);

		React.useEffect(() => {
			if (!tooltipVisible) return;

			updateTooltipPosition();
			window.addEventListener('resize', updateTooltipPosition);
			window.addEventListener('scroll', updateTooltipPosition, true);

			return () => {
				window.removeEventListener('resize', updateTooltipPosition);
				window.removeEventListener('scroll', updateTooltipPosition, true);
			};
		}, [tooltipVisible, updateTooltipPosition]);

		async function handleCopy(e: React.MouseEvent) {
			e.preventDefault();
			e.stopPropagation();

			if (!displayValue) return;

			await navigator.clipboard.writeText(displayValue);
			setCopied(true);
			setTooltipVisible(true);

			if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
			copyTimeoutRef.current = setTimeout(() => {
				setCopied(false);
				setTooltipVisible(false);
			}, 2000);
		}

		function hideTooltip() {
			setTooltipVisible(false);
		}

		function showTooltip() {
			updateTooltipPosition();
			setTooltipVisible(true);
		}

		return checkValidAddress(value) ? (
			<TxAddress address={value} />
		) : (
			<S.TagValue
				ref={buttonRef}
				type={'button'}
				onBlur={hideTooltip}
				onClick={handleCopy}
				onFocus={showTooltip}
				onMouseEnter={showTooltip}
				onMouseLeave={hideTooltip}
				$tooltipVisible={tooltipVisible}
			>
				<p>{displayValue}</p>
				{tooltipVisible &&
					tooltipPosition &&
					typeof document !== 'undefined' &&
					ReactDOM.createPortal(
						<S.TagValueTooltip $placement={tooltipPlacement} $position={tooltipPosition}>
							{copied ? `${language.copied}!` : displayValue}
						</S.TagValueTooltip>,
						document.body
					)}
			</S.TagValue>
		);
	};

	const renderTagValue = (value: any) => <TagValue value={value} />;
	const renderFirstTagValue = (value: any) => <TagValue value={value} tooltipPlacement={'bottom'} />;

	const TxOverviewValue = ({
		primary,
		secondary,
		indicator,
	}: {
		primary: React.ReactNode;
		secondary?: React.ReactNode;
		indicator?: React.ReactNode;
	}) => {
		return (
			<S.TxOverviewValue>
				<p>{primary}</p>
				{indicator}
				{secondary && <small>({secondary})</small>}
			</S.TxOverviewValue>
		);
	};

	const TxOverviewLine = ({ label, children }: { label: string; children: React.ReactNode }) => {
		return (
			<S.MessageInfoLine>
				<span>{`${label}: `}</span>
				{children}
			</S.MessageInfoLine>
		);
	};

	const CopyableValue = ({ value, label }: { value: string | null | undefined; label: string }) => {
		const [copied, setCopied] = React.useState<boolean>(false);

		const handleCopy = React.useCallback(
			async (e: React.MouseEvent) => {
				e.preventDefault();
				e.stopPropagation();

				if (!value) return;

				await navigator.clipboard.writeText(value);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			},
			[value]
		);

		if (!value) return <p>-</p>;

		return (
			<S.CopyableValue type={'button'} title={value} onClick={handleCopy}>
				<p>{copied ? `${language.copied}!` : label}</p>
				<ReactSVG src={ASSETS.copy} />
			</S.CopyableValue>
		);
	};

	const TransactionOverviewSection = () => {
		const { txResponse, inputTxId, refreshKey } = React.useContext(TxResponseContext);
		const isBundle = resolvedType === 'bundle';

		const [txMetadata, setTxMetadata] = React.useState<any | null>(null);
		const [currentBlockHeight, setCurrentBlockHeight] = React.useState<number | null>(null);
		const [arUsdPrice, setArUsdPrice] = React.useState<number | null>(null);
		const [overviewLoading, setOverviewLoading] = React.useState<boolean>(true);

		React.useEffect(() => {
			if (!inputTxId || !checkValidAddress(inputTxId)) return;

			let active = true;

			setTxMetadata(null);
			setCurrentBlockHeight(null);
			setArUsdPrice(null);
			setOverviewLoading(true);

			(async () => {
				const overview = await fetchTransactionOverview(inputTxId, refreshKey);

				if (!active) return;

				setTxMetadata(overview.metadata);
				setCurrentBlockHeight(overview.currentBlockHeight);
				setArUsdPrice(overview.arUsdPrice);
				setOverviewLoading(false);
			})();

			return () => {
				active = false;
			};
		}, [inputTxId, refreshKey]);

		const node = txMetadata ?? txResponse?.node;
		const tags = node?.tags ?? txResponse?.node?.tags ?? [];
		const from = node?.owner?.address ?? txResponse?.node?.owner?.address;
		const to = node?.recipient || txResponse?.node?.recipient || getTagValue(tags, 'Target') || null;
		const blockHeight = node?.block?.height ?? txResponse?.node?.block?.height ?? null;
		const timestamp = node?.block?.timestamp ?? txResponse?.node?.block?.timestamp ?? null;
		const confirmations =
			currentBlockHeight !== null && blockHeight !== null ? Math.max(currentBlockHeight - blockHeight, 0) : null;
		const notYetFound = !overviewLoading && !txMetadata && blockHeight === null;
		const statusLoading = overviewLoading || (blockHeight !== null && confirmations === null);
		const pending =
			!statusLoading &&
			!notYetFound &&
			(confirmations !== null ? confirmations < TX_FINALITY_CONFIRMATIONS : blockHeight === null);
		const statusLabel = statusLoading
			? `${language.loading}...`
			: notYetFound
			? language.notYetFound
			: pending
			? language.pending
			: language.confirmed;
		const statusEta = pending ? formatStatusEta(confirmations) : null;
		const fee = node?.fee;
		const quantity = node?.quantity;
		const getArUsdValue = (ar?: string | number | null, winston?: string | number | null) => {
			const rawAr = ar !== null && ar !== undefined ? ar.toString() : winstonToArString(winston);
			if (!rawAr || arUsdPrice === null) return null;

			const parsedAr = Number(rawAr);

			return Number.isFinite(parsedAr) ? formatUsdDisplay(parsedAr * arUsdPrice) : null;
		};
		const quantityUsd = getArUsdValue(quantity?.ar, quantity?.winston);
		const feeUsd = getArUsdValue(fee?.ar, fee?.winston);
		const size = node?.data?.size ?? txResponse?.node?.data?.size ?? null;

		function renderAddress(address: string | null | undefined) {
			if (!address) return <p>No Recipient</p>;
			if (checkValidAddress(address)) return <TxAddress address={address} />;

			return <p>{address}</p>;
		}

		return (
			<S.MessageInfo className={'border-wrapper-primary'}>
				<S.MessageInfoHeader>
					<p>{isBundle ? language.bundleOverview : language.transactionOverview}</p>
					<S.MessageInfoID>
						<TxOverviewValue
							primary={`Status: ${statusLabel}`}
							secondary={statusEta}
							indicator={
								statusLoading || notYetFound ? null : (
									<S.TransferInfoStatusIndicator pending={pending} success={!pending}>
										<ReactSVG src={pending ? ASSETS.pending : ASSETS.success} />
									</S.TransferInfoStatusIndicator>
								)
							}
						/>
					</S.MessageInfoID>
				</S.MessageInfoHeader>
				<S.MessageInfoBody $desktopItemCount={9}>
					<TxOverviewLine label={language.value}>
						<TxOverviewValue primary={formatArDisplay(quantity?.ar, quantity?.winston)} secondary={quantityUsd} />
					</TxOverviewLine>
					<TxOverviewLine label={isBundle ? language.bundler : language.from}>{renderAddress(from)}</TxOverviewLine>
					{isBundle ? (
						<TxOverviewLine label={language.transactions}>
							<TxOverviewValue
								primary={
									bundleTransactionCount !== null
										? formatCount(bundleTransactionCount.toString())
										: `${language.loading}...`
								}
							/>
						</TxOverviewLine>
					) : (
						<TxOverviewLine label={language.to}>{renderAddress(to)}</TxOverviewLine>
					)}
					<TxOverviewLine label={language.fee}>
						<TxOverviewValue primary={formatArDisplay(fee?.ar, fee?.winston)} secondary={feeUsd} />
					</TxOverviewLine>
					<TxOverviewLine label={language.date}>
						<TxOverviewValue primary={timestamp ? formatDate(timestamp * 1000, 'timestamp', true) : '-'} />
					</TxOverviewLine>
					<TxOverviewLine label={language.age}>
						<TxOverviewValue
							primary={timestamp ? `~${getRelativeDate(timestamp * 1000).replace(/ ago$/, '')}` : 'Not Yet Available'}
						/>
					</TxOverviewLine>
					<TxOverviewLine label={language.blockHeightActual}>
						<S.Height>
							<ExplorerLink value={blockHeight} type={'block'} />
						</S.Height>
					</TxOverviewLine>
					<TxOverviewLine label={language.confirmations}>
						<TxOverviewValue
							primary={confirmations !== null ? formatCount(confirmations.toString()) : 'Not Yet Available'}
						/>
					</TxOverviewLine>
					<TxOverviewLine label={language.size}>
						<TxOverviewValue primary={formatCompactByteSize(size !== null ? Number(size) : null)} />
					</TxOverviewLine>
				</S.MessageInfoBody>
			</S.MessageInfo>
		);
	};

	const MessageInfoSection = () => {
		const { txResponse } = React.useContext(TxResponseContext);

		const action = txResponse?.node?.tags ? getTagValue(txResponse?.node?.tags, 'Action') || 'None' : 'None';
		const from = txResponse
			? getTagValue(txResponse.node.tags, 'From-Process') ?? txResponse?.node?.owner?.address
			: undefined;
		const target = txResponse?.node?.recipient ?? getTagValue(txResponse?.node?.tags, 'Target');

		const isTransfer = getTagValue(txResponse?.node?.tags, 'Action') === 'Transfer';

		const [targetResponse, setTargetResponse] = React.useState<any>(null);
		const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

		const fetchedTargetRef = React.useRef<string | null>(null);

		React.useEffect(() => {
			if (messageResult?.Response?.includes('Failed to fetch')) {
				setStatusMessage('Failed To Fetch');
			}
		}, [messageResult]);

		React.useEffect(() => {
			if (target && fetchedTargetRef.current !== target) {
				fetchedTargetRef.current = target;
				setTargetResponse(null);
				(async () => {
					try {
						const response = await searchTxById({
							txId: target,
							getGQLData: permawebProvider.libs.getGQLData,
							store: store,
							dispatch: dispatch,
						});
						setTargetResponse(response);
					} catch (e) {
						console.error(e);
					}
				})();
			}
		}, [target]);

		let quantity;
		let recipient;
		let isTransferLoading = !messageResult;
		let isTransferSuccess = false;
		let isTransferPending = false;

		if (isTransfer) {
			quantity = txResponse?.node?.tags ? getTagValue(txResponse?.node?.tags, 'Quantity') || '-' : '-';
			recipient = txResponse?.node?.tags ? getTagValue(txResponse?.node?.tags, 'Recipient') || '-' : '-';

			if (messageResult?.error) {
				isTransferLoading = false;
			}

			if (messageResult?.message?.includes('Compute in progress')) {
				isTransferPending = true;
			}

			if (messageResult?.Messages?.length > 0) {
				const actions = {
					'Debit-Notice': null,
					'Credit-Notice': null,
					'Transfer-Error': null,
				};

				for (const message of messageResult.Messages) {
					const action = getTagValue(message.Tags, 'Action');
					if (action && actions.hasOwnProperty(action) && !actions[action]) {
						actions[action] = message;
					}
				}

				if (actions['Debit-Notice'] && actions['Credit-Notice']) isTransferSuccess = true;
				else if (actions['Transfer-Error']) isTransferSuccess = false;
				else isTransferSuccess = false;
			}
		}

		function getQuantity() {
			if (!isTransfer) return '-';

			let token;
			for (const entry of Object.entries(PROCESSES)) {
				if (entry[1] === target) {
					token = entry[0];
				}
			}

			if (token && TOKEN_DENOMINATIONS[token]) {
				let icon = null;
				let dimensions = 15;
				let margin = '0';
				switch (token) {
					case 'ao':
						icon = ASSETS.ao;
						dimensions = 18.5;
						margin = '7.5px 4.5px 0 0';
						break;
					case 'pi':
						dimensions = 10.5;
						margin = '7.5px 4.5px 0 0';
						icon = ASSETS.pi;
						break;
				}

				if (token === 'arweave') {
					dimensions = 12.5;
					margin = '0 0 4.95px 0';
					icon = ASSETS.arweave;
				}

				try {
					const denomination = TOKEN_DENOMINATIONS[token];
					const formatted = formatUnits(quantity, denomination);
					return (
						<S.TransferInfoAmount isNumber={true}>
							{icon && (
								<S.TransferLogoWrapper>
									<S.TransferLogo dimensions={dimensions} margin={margin}>
										<ReactSVG src={icon} />
									</S.TransferLogo>
								</S.TransferLogoWrapper>
							)}
							<p>{formatted}</p>
						</S.TransferInfoAmount>
					);
				} catch (e) {
					console.error(e);
				}
			}

			// Check targetResponse for denomination and logo
			if (targetResponse && targetResponse.Denomination) {
				try {
					const denomination = targetResponse.Denomination;
					const formatted = formatUnits(quantity, denomination);
					const logoTxId = targetResponse.Logo;

					return (
						<S.TransferInfoAmount isNumber={true}>
							{logoTxId && (
								<S.TransferLogoWrapper>
									<S.TransferLogo dimensions={15} margin={'0'}>
										<img src={getTxEndpoint(logoTxId)} alt={language.tokenLogo} />
									</S.TransferLogo>
								</S.TransferLogoWrapper>
							)}
							<p>{formatted}</p>
						</S.TransferInfoAmount>
					);
				} catch (e) {
					console.error(e);
				}
			}

			return (
				<S.TransferInfoAmount isNumber={true}>
					<p>{quantity}</p>
				</S.TransferInfoAmount>
			);
		}

		return (
			<>
				{isTransfer && (
					<S.TransferInfo className={'border-wrapper-alt4'}>
						<S.TransferInfoHeader>
							<p>{language.tokenTransfer}</p>
							<S.TransferInfoID>
								<span>{`${language.token}: `}</span>
								<TxAddress address={target} />
							</S.TransferInfoID>
						</S.TransferInfoHeader>
						<S.TransferInfoBody>
							<S.TransferInfoLine>
								<S.TransferInfoLineElement>
									<span>{`${language.transferFrom}: `}</span>
									<TxAddress address={from} />
								</S.TransferInfoLineElement>
								<S.TransferInfoLineElement>
									<span>{`${language.to}: `}</span>
									<TxAddress address={recipient} />
								</S.TransferInfoLineElement>
								<S.TransferInfoLineElement>
									<span>{`${language.amount}: `}</span>
									{getQuantity()}
								</S.TransferInfoLineElement>
							</S.TransferInfoLine>
							<S.TransferInfoLine>
								<S.TransferInfoStatus>
									<span>{`${language.status}:`}</span>
									<p>
										{isTransferLoading
											? `${language.loading}...`
											: isTransferPending
											? language.computeInProgress
											: isTransferSuccess
											? language.success
											: statusMessage ?? language.error}
									</p>
									{!isTransferLoading && !isTransferPending && !statusMessage && (
										<S.TransferInfoStatusIndicator pending={isTransferLoading} success={isTransferSuccess}>
											<ReactSVG src={isTransferSuccess ? ASSETS.success : ASSETS.warning} />
										</S.TransferInfoStatusIndicator>
									)}
								</S.TransferInfoStatus>
								<S.TransferInfoLineElement>
									<S.TransferInfoResult disabled={isTransferLoading} onClick={scrollToMessageList}>
										<p>{language.goToResults}</p>
									</S.TransferInfoResult>
								</S.TransferInfoLineElement>
							</S.TransferInfoLine>
						</S.TransferInfoBody>
					</S.TransferInfo>
				)}
				<S.MessageInfo className={'border-wrapper-primary'}>
					<S.MessageInfoHeader>
						<p>{language.messageInfo}</p>
						<S.MessageInfoID>
							<span>{`${language.id}: `}</span>
							<TxAddress address={txResponse?.node?.id} />
						</S.MessageInfoID>
					</S.MessageInfoHeader>
					<S.MessageInfoBody $desktopItemCount={6}>
						<S.MessageInfoLine>
							<span>{`${language.action}: `}</span>
							<p>{action}</p>
						</S.MessageInfoLine>
						<S.MessageInfoLine>
							<span>{`${language.variant}: `}</span>
							<p>{txResponse?.node?.tags ? getTagValue(txResponse?.node?.tags, 'Variant') : '-'}</p>
						</S.MessageInfoLine>
						<S.MessageInfoLine>
							<span>{`${language.dataProtocol}: `}</span>
							<p>{txResponse?.node?.tags ? getTagValue(txResponse?.node?.tags, 'Data-Protocol') : '-'}</p>
						</S.MessageInfoLine>
						<S.MessageInfoLine>
							<span>{`${language.date}: `}</span>
							<p>
								{txResponse?.node?.block?.timestamp
									? formatDate(txResponse.node.block.timestamp * 1000, 'timestamp', true)
									: 'Not Found'}
							</p>
						</S.MessageInfoLine>
						<S.MessageInfoLine>
							<span>{`${language.blockHeight}: `}</span>
							{txResponse?.node?.block?.height ? (
								<S.Height>
									<ExplorerLink value={txResponse.node.block.height} type={'block'} />
								</S.Height>
							) : (
								<p>None</p>
							)}
						</S.MessageInfoLine>
						{txResponse?.node?.slot ? (
							<S.MessageInfoLine>
								<span>{`${language.slot}: `}</span>
								<p>{formatCount(txResponse?.node?.slot.toString())}</p>
							</S.MessageInfoLine>
						) : (
							<S.MessageInfoLine>
								<span>{`${language.size}: `}</span>
								<p>{getByteSizeDisplay(Number(txResponse?.node?.data?.size) ?? 0)}</p>
							</S.MessageInfoLine>
						)}
					</S.MessageInfoBody>
				</S.MessageInfo>
			</>
		);
	};

	const BlockInfoSection = () => {
		const { txResponse } = React.useContext(TxResponseContext);
		const node: any = txResponse?.node;
		const blockId = node?.blockId;
		const previous = node?.previous;
		const txRoot = node?.txRoot;
		const blockSizeValue = node?.blockSize?.toString?.() ?? null;
		const blockSize = blockSizeValue ? Number(blockSizeValue) : null;
		const txCount = typeof node?.txCount === 'number' ? node.txCount : null;
		const miner = node?.miner ?? null;
		const minerReward = node?.minerReward ?? null;
		const confirmations = typeof node?.confirmations === 'number' ? node.confirmations : null;
		const timestamp = txResponse?.node?.block?.timestamp ?? null;

		return (
			<S.MessageInfo className={'border-wrapper-primary'}>
				<S.MessageInfoHeader>
					<p>{language.blockOverview}</p>
					<S.MessageInfoID>
						<span>{`${language.height}: `}</span>
						{txResponse?.node?.block?.height ? (
							<S.Height>
								<ExplorerLink value={txResponse.node.block.height} type={'block'} />
							</S.Height>
						) : (
							<p>-</p>
						)}
					</S.MessageInfoID>
				</S.MessageInfoHeader>
				<S.MessageInfoBody $desktopItemCount={9}>
					<S.MessageInfoLine>
						<span>{`${language.blockId}: `}</span>
						{blockId ? (
							<S.HashLink>
								<ExplorerLink value={blockId} label={formatBlockId(blockId, false)} />
							</S.HashLink>
						) : (
							<p>-</p>
						)}
					</S.MessageInfoLine>
					<S.MessageInfoLine>
						<span>{`${language.previousBlock}: `}</span>
						{previous ? (
							<S.HashLink>
								<ExplorerLink value={previous} label={formatBlockId(previous, false)} />
							</S.HashLink>
						) : (
							<p>-</p>
						)}
					</S.MessageInfoLine>
					<S.MessageInfoLine>
						<span>{`${language.txRoot}: `}</span>
						<CopyableValue value={txRoot} label={txRoot ? formatMetadataHash(txRoot) : '-'} />
					</S.MessageInfoLine>
					<S.MessageInfoLine>
						<span>{`${language.miner}: `}</span>
						{miner ? checkValidAddress(miner) ? <TxAddress address={miner} /> : <p>{miner}</p> : <p>-</p>}
					</S.MessageInfoLine>
					<S.MessageInfoLine>
						<span>{`${language.minerReward}: `}</span>
						<p>{formatArDisplay(null, minerReward)}</p>
					</S.MessageInfoLine>
					<S.MessageInfoLine>
						<span>{`${language.transactions}: `}</span>
						<p>{txCount !== null ? formatCount(txCount.toString()) : '-'}</p>
					</S.MessageInfoLine>
					<S.MessageInfoLine>
						<span>{`${language.date}: `}</span>
						<TxOverviewValue
							primary={timestamp ? formatDate(timestamp * 1000, 'timestamp', true) : '-'}
							secondary={timestamp ? `${getRelativeDate(timestamp * 1000)}` : null}
						/>
					</S.MessageInfoLine>
					<S.MessageInfoLine>
						<span>{`${language.confirmations}: `}</span>
						<p>{confirmations !== null ? formatCount(confirmations.toString()) : '-'}</p>
					</S.MessageInfoLine>
					<S.MessageInfoLine>
						<span>{`${language.blockSize}: `}</span>
						<p title={blockSizeValue ?? undefined}>
							{blockSize !== null && Number.isFinite(blockSize) ? getByteSizeDisplay(blockSize) : blockSizeValue ?? '-'}
						</p>
					</S.MessageInfoLine>
				</S.MessageInfoBody>
			</S.MessageInfo>
		);
	};

	const BundleTagsSection = () => {
		const { txResponse } = React.useContext(TxResponseContext);
		const tags = txResponse?.node?.tags ?? [];
		const filteredTags = sortTagsAlphabetically(
			tags.filter((tag: DisplayTag) => !['type', 'name'].includes(tag.name.toLowerCase()))
		);

		if (filteredTags.length <= 0) return null;

		return (
			<S.Section className={'border-wrapper-alt3'}>
				<S.SectionHeader>
					<p>{language.tags}</p>
				</S.SectionHeader>
				<S.OverviewWrapper className={'scroll-wrapper'}>
					{filteredTags.map((tag: DisplayTag, index: number) => (
						<OverviewLine
							key={`${tag.name}-${index}`}
							label={tag.name}
							value={tag.value}
							render={index === 0 ? renderFirstTagValue : renderTagValue}
						/>
					))}
				</S.OverviewWrapper>
			</S.Section>
		);
	};

	const TagsSection = (props: { fixedHeight?: number } = {}) => {
		const { txResponse } = React.useContext(TxResponseContext);
		const overviewWrapperRef = React.useRef<HTMLDivElement | null>(null);
		const [overviewHasOverflow, setOverviewHasOverflow] = React.useState<boolean>(false);
		const excludedTagNames: string[] = [];
		const filteredTags = sortTagsAlphabetically(
			txResponse?.node?.tags?.filter((tag: DisplayTag) => !excludedTagNames.includes(tag.name)) || []
		);
		const displayTags = txResponse
			? sortTagsAlphabetically([
					...(resolvedType === 'process'
						? [
								{
									name: language.owner,
									value: txResponse?.node?.owner?.address,
								},
						  ]
						: []),
					...filteredTags,
			  ])
			: [];

		React.useEffect(() => {
			const element = overviewWrapperRef.current;
			if (!element) return;

			function updateOverflowState() {
				setOverviewHasOverflow(element.scrollHeight > element.clientHeight);
			}

			updateOverflowState();

			if (typeof ResizeObserver === 'undefined') {
				window.addEventListener('resize', updateOverflowState);
				return () => window.removeEventListener('resize', updateOverflowState);
			}

			const observer = new ResizeObserver(updateOverflowState);
			observer.observe(element);

			return () => observer.disconnect();
		}, [props.fixedHeight, txResponse]);

		return (
			<S.Section className={`border-wrapper-alt3`} $fixedHeight={props.fixedHeight}>
				<S.SectionHeader>
					<p>{language.tags}</p>
					<span>({txResponse ? displayTags.length : '-'})</span>
				</S.SectionHeader>
				<S.OverviewWrapper
					ref={overviewWrapperRef}
					$fixedHeight={props.fixedHeight}
					$hasOverflow={overviewHasOverflow}
					className={'scroll-wrapper'}
				>
					{txResponse ? (
						<>
							{displayTags.length > 0 ? (
								<>
									{displayTags.map((tag: DisplayTag, index: number) => (
										<OverviewLine
											key={index}
											label={tag.name}
											value={tag.value}
											render={index === 0 ? renderFirstTagValue : renderTagValue}
										/>
									))}
								</>
							) : (
								<S.OverviewLine>
									<span>{'None'}</span>
								</S.OverviewLine>
							)}
						</>
					) : (
						<S.OverviewLine>
							<span>{language.processOrMessageTagsInfo}</span>
						</S.OverviewLine>
					)}
				</S.OverviewWrapper>
			</S.Section>
		);
	};

	const DataSection = (props: { dataHeader?: string; fixedHeight?: number }) => {
		const { txResponse, inputTxId } = React.useContext(TxResponseContext);
		const [data, setData] = React.useState<any>(null);
		const [loading, setLoading] = React.useState<boolean>(false);

		const contentType =
			(txResponse?.node?.tags ? getTagValue(txResponse.node.tags, 'Content-Type') : null) ??
			txResponse?.node?.data?.type ??
			null;
		const normalizedContentType = contentType?.split(';')[0].trim().toLowerCase();
		const isMarkdown = ['text/markdown', 'text/x-markdown', 'application/markdown'].includes(
			normalizedContentType ?? ''
		);

		React.useEffect(() => {
			(async function () {
				if (checkValidAddress(inputTxId)) {
					setLoading(true);
					try {
						const messageFetch = await fetch(getTxEndpoint(inputTxId));
						const rawMessage = await messageFetch.text();

						const raw = rawMessage ?? '';
						const trimmed = raw.trim();

						if (trimmed === '') {
							setData(language.noData);
						} else if (isMarkdown) {
							setData(trimmed);
						} else {
							try {
								const parsed = JSONbig({ storeAsString: true }).parse(trimmed);

								const isEmptyArray = Array.isArray(parsed) && parsed.length === 0;
								const isEmptyObject =
									parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length === 0;

								if (isEmptyArray || isEmptyObject) {
									setData(language.noData);
								} else {
									setData(parsed);
								}
							} catch {
								setData(trimmed);
							}
						}
					} catch (e: any) {
						console.error(e);
						setData(language.errorFetchingData || 'Error Fetching Data');
					}
					setLoading(false);
				}
			})();
		}, [inputTxId]);

		function getDataContent() {
			if (loading || !data) {
				return props.fixedHeight ? (
					<S.DataSection className={'border-wrapper-alt3'} $fixedHeight={props.fixedHeight} />
				) : null;
			}

			// Render images
			if (normalizedContentType?.startsWith('image/')) {
				return (
					<S.DataSection $fixedHeight={props.fixedHeight}>
						<img
							src={getTxEndpoint(inputTxId)}
							alt={language.transactionData}
							style={{ maxWidth: '100%', height: 'auto' }}
						/>
					</S.DataSection>
				);
			}

			if (isMarkdown && typeof data === 'string') {
				return (
					<MarkdownViewer
						markdown={data}
						header={props.dataHeader ?? language.data}
						fixedHeight={props.fixedHeight ?? 600}
						embedded
						compact
						className={'border-wrapper-primary'}
					/>
				);
			}

			if (typeof data === 'object') {
				return (
					<JSONReader
						data={data}
						header={props.dataHeader ?? null}
						maxHeight={props.fixedHeight ?? 600}
						fixedHeight={props.fixedHeight}
					/>
				);
			}

			return (
				<Editor
					initialData={data}
					header={'Data'}
					language={'lua'}
					readOnly
					loading={false}
					fixedHeight={props.fixedHeight ?? 600}
				/>
			);
		}

		return <>{getDataContent()}</>;
	};

	const TABS = React.useMemo(() => {
		if (!inputTxId) return null;

		const showOverview = resolvedType === 'message';
		const showMessages = resolvedType === 'message';
		const showTags = resolvedType === 'process';
		const showRead = resolvedType === 'process' || resolvedType === 'message';

		const tabs = [
			{
				label: language.overview,
				icon: ASSETS.overview,
				disabled: false,
				url: URLS.explorerInfo(inputTxId),
				view: () => {
					const { txResponse, refreshKey } = React.useContext(TxResponseContext);

					const variant = txResponse
						? (getTagValue(txResponse?.node?.tags, TAGS.keys.variant) as MessageVariantEnum)
						: undefined;
					const hydrateAoTransferNotices = shouldHydrateAoTransferNotices({
						action: getTagValue(txResponse?.node?.tags, 'Action'),
						variant: variant,
						recipient: txResponse?.node?.recipient ?? getTagValue(txResponse?.node?.tags, 'Target'),
					});

					switch (resolvedType) {
						case 'block':
							return (
								<S.ColumnFlexWrapper>
									<BlockInfoSection />
									<TransactionList
										key={refreshKey}
										mode={'block'}
										blockHeight={txResponse?.node?.block?.height}
										blockId={(txResponse?.node as any)?.blockId}
										header={language.transactions}
									/>
								</S.ColumnFlexWrapper>
							);
						case 'bundle':
							return (
								<S.ColumnFlexWrapper>
									<TransactionOverviewSection />
									<BundleTagsSection />
									<TransactionList
										key={refreshKey}
										mode={'bundle'}
										bundleId={inputTxId}
										header={language.transactions}
										onTotalCountChange={setBundleTransactionCount}
									/>
								</S.ColumnFlexWrapper>
							);
						case 'process':
						case 'message':
							return (
								<S.ColumnFlexWrapper>
									<TransactionOverviewSection />
									{showOverview && <MessageInfoSection />}
									{showRead && (
										<S.InfoWrapper>
											{showTags && (
												<S.TagsWrapper>
													<TagsSection />
												</S.TagsWrapper>
											)}
											<S.ReadWrapper fullWidth={!showTags}>
												{resolvedType === 'process' && (
													<>
														<ProcessRead
															key={refreshKey}
															processId={inputTxId}
															variant={getTagValue(txResponse?.node?.tags, 'Variant') as MessageVariantEnum}
															autoRun={true}
														/>
													</>
												)}
												{resolvedType === 'message' && (
													<MessageResult
														key={refreshKey}
														processId={txResponse?.node?.recipient ?? getTagValue(txResponse?.node?.tags, 'Target')}
														messageId={inputTxId}
														variant={variant}
														tags={txResponse?.node?.tags ?? null}
														result={messageResult}
														skipResultFetch={true}
														active={props.active}
													/>
												)}
											</S.ReadWrapper>
										</S.InfoWrapper>
									)}
									{showMessages && (
										<S.MessageHeaderWrapper ref={messageListRef}>
											{checkValidAddress(inputTxId) && (
												<MessageList
													key={refreshKey}
													header={language.resultingMessages}
													txId={inputTxId}
													variant={variant}
													type={resolvedType}
													recipient={txResponse?.node?.recipient ?? getTagValue(txResponse?.node?.tags, 'Target')}
													parentId={inputTxId}
													authority={getTagValue(txResponse?.node?.tags, 'Authority')}
													handleMessageOpen={(id: string) => props.handleMessageOpen(id)}
													result={messageResult}
													timestamp={txResponse?.node?.block?.timestamp}
													skipResultFetch={true}
													showFilteredMessages={true}
													hydrateAoTransferNotices={hydrateAoTransferNotices}
													showResultMessageLabel={true}
												/>
											)}
										</S.MessageHeaderWrapper>
									)}
								</S.ColumnFlexWrapper>
							);
						case 'wallet':
							return (
								<>
									{checkValidAddress(inputTxId) && (
										<MessageList
											key={refreshKey}
											header={language.transactions}
											txId={inputTxId}
											variant={MessageVariantEnum.Legacynet}
											type={resolvedType}
											recipient={txResponse?.node?.recipient ?? getTagValue(txResponse?.node?.tags, 'Target')}
											parentId={inputTxId}
											handleMessageOpen={(id: string) => props.handleMessageOpen(id)}
										/>
									)}
								</>
							);
						default:
							return (
								<S.ColumnFlexWrapper>
									<TransactionOverviewSection />
									<S.InfoWrapper>
										<S.SectionWrapperFlex>
											<TagsSection />
										</S.SectionWrapperFlex>
										<S.SectionWrapperFlex>
											<DataSection dataHeader={'Data'} />
										</S.SectionWrapperFlex>
									</S.InfoWrapper>
								</S.ColumnFlexWrapper>
							);
					}
				},
			},
		];

		if (resolvedType === 'process') {
			tabs.push(
				{
					label: language.messages,
					icon: ASSETS.message,
					disabled: false,
					url: URLS.explorerMessages(inputTxId),
					view: () => {
						const { txResponse, refreshKey } = React.useContext(TxResponseContext);

						const variant = txResponse
							? (getTagValue(txResponse?.node?.tags, TAGS.keys.variant) as MessageVariantEnum)
							: undefined;

						return (
							<S.MessagesWrapper>
								<S.MessagesSection>
									{checkValidAddress(inputTxId) && (
										<MessageList
											key={refreshKey}
											txId={inputTxId}
											variant={variant}
											type={resolvedType}
											recipient={txResponse?.node?.recipient ?? getTagValue(txResponse?.node?.tags, 'Target')}
											parentId={inputTxId}
											authority={getTagValue(txResponse?.node?.tags, 'Authority')}
											handleMessageOpen={(id: string) => props.handleMessageOpen(id)}
										/>
									)}
								</S.MessagesSection>
							</S.MessagesWrapper>
						);
					},
				},
				{
					label: language.read,
					icon: ASSETS.read,
					disabled: false,
					url: URLS.explorerRead(inputTxId),
					view: () => {
						const { txResponse } = React.useContext(TxResponseContext);

						const variant = txResponse
							? (getTagValue(txResponse?.node?.tags, TAGS.keys.variant) as MessageVariantEnum)
							: undefined;
						return <ProcessEditor processId={inputTxId} variant={variant} type={'read'} isFullscreen={isFullscreen} />;
					},
				},
				{
					label: language.write,
					icon: ASSETS.write,
					disabled: false,
					url: URLS.explorerWrite(inputTxId),
					view: () => {
						const { txResponse } = React.useContext(TxResponseContext);

						const variant = txResponse
							? (getTagValue(txResponse?.node?.tags, TAGS.keys.variant) as MessageVariantEnum)
							: undefined;
						return <ProcessEditor processId={inputTxId} variant={variant} type={'write'} isFullscreen={isFullscreen} />;
					},
				},
				{
					label: language.data || 'Data',
					icon: ASSETS.data,
					disabled: false,
					url: URLS.explorerData(inputTxId),
					view: () => {
						return <DataSection />;
					},
				},
				{
					label: language.source,
					icon: ASSETS.code,
					disabled: false,
					url: URLS.explorerSource(inputTxId),
					view: () => {
						const { txResponse } = React.useContext(TxResponseContext);
						return (
							<ProcessSource
								processId={inputTxId}
								onBoot={txResponse?.node?.tags ? getTagValue(txResponse.node.tags, TAGS.keys.onBoot) : undefined}
							/>
						);
					},
				}
			);

			if (arProvider.walletAddress && ownerAddress === arProvider.walletAddress) {
				tabs.push({
					label: language.aos,
					icon: ASSETS.console,
					disabled: false,
					url: URLS.explorerAOS(inputTxId),
					view: () => {
						const hash = window.location.hash.replace('#', '');
						return <AOS processId={inputTxId} active={hash === URLS.explorerAOS(inputTxId)} />;
					},
				});
			}
		}

		return tabs;
	}, [
		props.type,
		resolvedType,
		inputTxId,
		arProvider.walletAddress,
		ownerAddress,
		language,
		messageResult,
		isFullscreen,
		bundleTransactionCount,
	]);

	const contextValue = React.useMemo(
		() => ({ txResponse, inputTxId, type: resolvedType, refreshKey }),
		[txResponse, inputTxId, resolvedType, refreshKey]
	);

	const balanceSections = React.useMemo(() => {
		if (resolvedType !== 'wallet' && resolvedType !== 'process') return null;
		const shouldFetch = !!txResponse;
		const useNaOnError = false;
		return (
			<>
				<WalletBalanceSection
					balanceSource={'process'}
					processId={PROCESSES.ao}
					tokenName={'AO'}
					denomination={TOKEN_DENOMINATIONS.ao}
					walletId={inputTxId}
					shouldFetch={shouldFetch}
					useNaOnError={useNaOnError}
				/>
				{resolvedType === 'wallet' && (
					<WalletBalanceSection
						balanceSource={'arweave'}
						tokenName={'AR'}
						denomination={TOKEN_DENOMINATIONS.ar}
						walletId={inputTxId}
						shouldFetch={shouldFetch}
					/>
				)}
			</>
		);
	}, [txResponse, inputTxId, resolvedType]);

	const transactionTabs = React.useMemo(() => {
		if (!TABS) return null;
		const currentHashPath = currentHash.split('?')[0];
		const matchingTab = TABS.find((tab) => tab.url === currentHashPath);
		const activeUrl = matchingTab ? matchingTab.url : TABS[0]?.url;
		return <URLTabs key={props.tabKey} tabs={TABS} activeUrl={activeUrl} noUrlCopy isParentActive={props.active} />;
	}, [TABS, currentHash, props.tabKey, props.active]); // Keep URLTabs from recreating

	function getTransaction() {
		const showPlaceholder = !inputTxId || !txResponse;
		const showMissingTransaction = !!inputTxId && hasFetched && !loadingTx && !txResponse;
		const placeholderIcon = showMissingTransaction ? ASSETS.pending : ASSETS.transaction;
		const placeholderTitle = loadingTx
			? `${language.loading}...`
			: showMissingTransaction
			? language.txCannotBeFoundYet ?? 'Transaction cannot be found yet'
			: language.explorerSearchInput;

		return (
			<>
				{showPlaceholder && (
					<S.Placeholder>
						<S.PlaceholderIcon>
							<ReactSVG src={placeholderIcon} />
						</S.PlaceholderIcon>
						<S.PlaceholderDescription>
							<p>{placeholderTitle}</p>
							{showMissingTransaction && (
								<span>
									{language.txCannotBeFoundYetInfo ??
										'It may still be propagating or waiting to be indexed. Try refreshing in a moment.'}
								</span>
							)}
						</S.PlaceholderDescription>
					</S.Placeholder>
				)}
				{/* Always render transactionTabs (with null checks) so URLTabs stays mounted */}
				<TxResponseContext.Provider value={contextValue}>
					<div style={{ display: showPlaceholder ? 'none' : 'block' }}>{transactionTabs}</div>
				</TxResponseContext.Provider>
			</>
		);
	}

	const toggleFullscreen = React.useCallback(async () => {
		const el = wrapperRef.current;
		if (!el) return;

		if (document.fullscreenElement !== el) {
			try {
				// Exit current fullscreen first if needed, then enter fullscreen for this element
				if (document.fullscreenElement) {
					await document.exitFullscreen();
				}
				await el.requestFullscreen();
				setIsFullscreen(true);
			} catch (err) {
				console.error('Error attempting to enable fullscreen:', err);
			}
		} else {
			try {
				await document.exitFullscreen();
				setIsFullscreen(false);
			} catch (err) {
				console.error('Error attempting to exit fullscreen:', err);
			}
		}
	}, []);

	React.useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(document.fullscreenElement === wrapperRef.current);
		};

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
		};
	}, []);

	const handleBlockNavigation = React.useCallback(
		(blockHeight: number) => {
			navigate(`${URLS.explorer}${blockHeight}`);
		},
		[navigate]
	);

	const blockHeight = resolvedType === 'block' ? txResponse?.node?.block?.height : null;
	const blockConfirmations = resolvedType === 'block' ? (txResponse?.node as any)?.confirmations : null;
	const hasBlockNavigation = typeof blockHeight === 'number' && Number.isFinite(blockHeight);
	const previousBlockHeight = hasBlockNavigation && blockHeight > 0 ? blockHeight - 1 : null;
	const nextBlockHeight = hasBlockNavigation ? blockHeight + 1 : null;
	const nextBlockDisabled = blockConfirmations === 0;

	return (
		<>
			<S.Wrapper ref={wrapperRef} style={{ display: props.active ? 'flex' : 'none' }} isFullscreen={isFullscreen}>
				<S.HeaderWrapper>
					<S.SearchWrapper>
						<S.SearchInputWrapper>
							<ReactSVG src={ASSETS.search} />
							<FormField
								value={inputTxId}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputTxId(e.target.value)}
								placeholder={language.explorerSearchInput}
								invalid={{ status: inputTxId ? !isValidExplorerInput(inputTxId) : false, message: null }}
								disabled={loadingTx}
								autoFocus
								hideErrorMessage
								sm
							/>
						</S.SearchInputWrapper>
						<Button
							type={'alt1'}
							icon={ASSETS.copy}
							handlePress={() => copyAddress(inputTxId)}
							disabled={!inputTxId}
							height={32.5}
							width={32.5}
							noMinWidth
							iconSize={14.5}
							tooltip={idCopied ? `${language.copied}!` : language.copyId}
							stopPropagation
							preventDefault
						/>
						<Button
							type={'alt1'}
							icon={ASSETS.link}
							handlePress={async () => {
								await navigator.clipboard.writeText(window.location.href);
								setUrlCopied(true);
								setTimeout(() => setUrlCopied(false), 2000);
							}}
							height={32.5}
							width={32.5}
							noMinWidth
							iconSize={14.5}
							tooltip={urlCopied ? `${language.copied}!` : language.copyUrl || 'Copy URL'}
							stopPropagation
							preventDefault
						/>
						<Button
							type={'alt1'}
							icon={ASSETS.fullscreen}
							handlePress={toggleFullscreen}
							height={32.5}
							width={32.5}
							noMinWidth
							iconSize={14.5}
							tooltip={isFullscreen ? language.exitFullScreen : language.enterFullScreen}
							stopPropagation
							preventDefault
						/>
						<Button
							type={'alt1'}
							icon={ASSETS.refresh}
							handlePress={() => handleSubmit()}
							disabled={loadingTx || !isValidExplorerInput(inputTxId)}
							height={32.5}
							width={32.5}
							noMinWidth
							iconSize={14.5}
							tooltip={loadingTx ? `${language.loading}...` : language.refresh}
							stopPropagation
							preventDefault
						/>
						{hasBlockNavigation && (
							<S.BlockNavigationWrapper>
								{previousBlockHeight !== null && (
									<Button
										type={'primary'}
										icon={ASSETS.arrowLeft}
										iconLeftAlign
										handlePress={() => handleBlockNavigation(previousBlockHeight)}
										disabled={loadingTx}
										height={32.5}
										iconSize={14.5}
										tooltip={`${language.previous}: ${formatCount(previousBlockHeight.toString())}`}
										stopPropagation
										preventDefault
									/>
								)}
								{nextBlockHeight !== null && (
									<Button
										type={'primary'}
										icon={ASSETS.arrowRight}
										handlePress={() => handleBlockNavigation(nextBlockHeight)}
										disabled={loadingTx || nextBlockDisabled}
										height={32.5}
										iconSize={14.5}
										tooltip={`${language.next}: ${formatCount(nextBlockHeight.toString())}`}
										stopPropagation
										preventDefault
									/>
								)}
							</S.BlockNavigationWrapper>
						)}
					</S.SearchWrapper>
					<S.HeaderActionsWrapper>
						{resolvedType && txResponse && (
							<S.TxInfoWrapper>
								<S.UpdateWrapperType>
									<ReactSVG src={ASSETS[resolvedType] ?? ASSETS.transaction} />
									<span>{capitalize(resolvedType)}</span>
								</S.UpdateWrapperType>
								{txResponse?.node?.tags && getTagValue(txResponse.node.tags, 'Variant') && (
									<>
										<S.UpdateWrapper>
											<span>{getTagValue(txResponse.node.tags, 'Variant')}</span>
										</S.UpdateWrapper>
									</>
								)}
								{txResponse?.node?.block?.timestamp && (
									<>
										<S.UpdateWrapper>
											<span>{formatDate(txResponse?.node?.block?.timestamp * 1000, 'timestamp')}</span>
										</S.UpdateWrapper>
									</>
								)}
								{balanceSections}
							</S.TxInfoWrapper>
						)}
					</S.HeaderActionsWrapper>
				</S.HeaderWrapper>
				<S.BodyWrapper>{getTransaction()}</S.BodyWrapper>
			</S.Wrapper>
		</>
	);
}

export default React.memo(Transaction);
