import React from 'react';
import { flushSync } from 'react-dom';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ReactSVG } from 'react-svg';
import { useTheme } from 'styled-components';

import { Types } from '@permaweb/libs';

import { Button } from 'components/atoms/Button';
import { Calendar } from 'components/atoms/Calendar';
import { FormField } from 'components/atoms/FormField';
import { Loader } from 'components/atoms/Loader';
import { Modal } from 'components/atoms/Modal';
import { TransferAmount } from 'components/atoms/TransferAmount';
import { ExplorerLink, TxAddress } from 'components/atoms/TxAddress';
import { Editor } from 'components/molecules/Editor';
import { JSONReader } from 'components/molecules/JSONReader';
import { PaginationControls } from 'components/molecules/PaginationControls';
import {
	ASSETS,
	DEFAULT_ACTIONS,
	DEFAULT_GATEWAYS,
	DEFAULT_LEGACY_AUTHORITY,
	DEFAULT_MESSAGE_TAGS,
	FLAGS,
	MINT_ACTIONS,
	STORAGE,
	TAGS,
	URLS,
} from 'helpers/config';
import { buildCsvFilename, downloadCsv, mapTransactionForCsv } from 'helpers/csv';
import { arweaveEndpoint, getTxEndpoint } from 'helpers/endpoints';
import { getSearchParam, updateSearchParams } from 'helpers/query';
import { searchTxById } from 'helpers/search';
import { MessageFilterType, MessageVariantEnum, ResultMessageType, TransactionType } from 'helpers/types';
import {
	buildSyntheticResultMessageEdge,
	checkValidAddress,
	formatAddress,
	formatCount,
	getRelativeDate,
	getTagValue,
	isNativeArTransfer,
	lowercaseTagKeys,
	removeCommitments,
	resolveLibDeps,
	resolveMessageId,
	resolveResultMessages,
	shouldHydrateAoTransferNotices,
} from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { usePermawebProvider } from 'providers/PermawebProvider';
import { store } from 'store';

import * as S from './styles';

const NON_MESSAGE_ACTION_FALLBACK_TAGS = [
	'App-Name',
	'Content-Type',
	'Name',
	'Title',
	'Protocol-Name',
	'Bundle-Format',
	'Bundle-Version',
];
const GQL_PAGE_CHUNK_SIZE = 100;
const DEFAULT_RESULTS_PER_PAGE = 50;
const MESSAGE_QUERY_KEYS = {
	direction: 'messageDirection',
	action: 'messageAction',
	variant: 'messageVariant',
	recipient: 'messageRecipient',
	from: 'messageFrom',
	start: 'messageStart',
	end: 'messageEnd',
	limit: 'messageLimit',
	after: 'messageAfter',
	page: 'messagePage',
};

function tagValueEquals(tags: any[] | undefined, name: string, value: string) {
	return getTagValue(tags, name)?.toLowerCase() === value.toLowerCase();
}

function isAoMessageTransaction(tags: any[] | undefined) {
	return tagValueEquals(tags, 'Data-Protocol', 'ao') && tagValueEquals(tags, TAGS.keys.type, 'Message');
}

function isMessageElement(tags: any[] | undefined, isAoResultMessage: boolean) {
	return isAoResultMessage || tagValueEquals(tags, TAGS.keys.type, 'Message');
}

function getNonMessageActionFallback(tags: any[] | undefined) {
	const normalizedTags = tags ?? [];

	if (normalizedTags.length === 1) return normalizedTags[0]?.name ?? null;

	for (const tagName of NON_MESSAGE_ACTION_FALLBACK_TAGS) {
		const value = getTagValue(normalizedTags, tagName);
		if (value) return value;
	}

	return null;
}

function Message(props: {
	element: Types.GQLNodeResponseType;
	type: TransactionType;
	variant?: MessageVariantEnum;
	currentFilter: MessageFilterType;
	parentId: string;
	handleOpen: (id: string) => void;
	lastChild?: boolean;
	isOverallLast?: boolean;
	timestamp?: number;
	showFilteredMessages?: boolean;
	childList?: boolean;
	nestingLevel?: number;
	showResultMessageLabel?: boolean;
}) {
	const currentTheme: any = useTheme();
	const navigate = useNavigate();

	const permawebProvider = usePermawebProvider();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const [open, setOpen] = React.useState<boolean>(false);

	const [data, setData] = React.useState<any>(null);
	const [showViewData, setShowViewData] = React.useState<boolean>(false);

	const [result, setResult] = React.useState<any>(null);
	const [showViewResult, setShowViewResult] = React.useState<boolean>(false);
	const [filterMessage, setFilterMessage] = React.useState<boolean>(false);

	const hasAoMessageTags = isAoMessageTransaction(props.element.node?.tags);
	const isAoResultMessage = Boolean(props.showResultMessageLabel && props.variant);
	const isAoMessage = hasAoMessageTags || isAoResultMessage;
	const shouldUseMessageActionFallback = !isMessageElement(props.element.node?.tags, isAoResultMessage);
	const canFetchAoResult = isAoMessage && !!props.element.node.recipient;

	React.useEffect(() => {
		if (props.element && props.variant === MessageVariantEnum.Legacynet) {
			const fromProcess = getTagValue(props.element.node?.tags, 'From-Process');

			if (
				!props.showFilteredMessages &&
				fromProcess &&
				props.element.node?.owner?.address !== DEFAULT_LEGACY_AUTHORITY
			) {
				setFilterMessage(true);
			}
		}
	}, [props.element]);

	React.useEffect(() => {
		(async function () {
			if ((open || showViewResult) && !result && !filterMessage && canFetchAoResult) {
				let processId: string = props.element.node.recipient;
				let variant = getTagValue(props.element.node.tags, 'Variant') as MessageVariantEnum;

				if (processId) {
					/* Find the variant of the recipient process to handle messages between networks */
					try {
						const processLookup = await permawebProvider.libs.getGQLData({
							ids: [processId],
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
						messageId: props.element.node.id,
						variant: variant,
						target: props.element.node.recipient,
						permawebProvider: permawebProvider,
					});

					try {
						const messageResult = await deps.ao.result({
							process: processId,
							message: messageId,
						});

						setResult(removeCommitments(messageResult));
					} catch (e: any) {
						console.error(e);
						setResult({ Result: e.message ?? 'Error Getting Result' });
					}
				}
			}
		})();
	}, [open, result, showViewResult, props.currentFilter, filterMessage, canFetchAoResult]);

	React.useEffect(() => {
		(async function () {
			if (!data && showViewData && !filterMessage) {
				try {
					const messageFetch = await fetch(getTxEndpoint(props.element.node.id));
					const rawMessage = await messageFetch.text();

					const raw = rawMessage ?? '';
					const trimmed = raw.trim();

					if (trimmed === '') {
						setData(language.noData);
					} else {
						try {
							const parsed = JSON.parse(trimmed);

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
				}
			}
		})();
	}, [data, showViewData, filterMessage]);

	const excludedTagNames = ['Type', 'Authority', 'Module', 'Scheduler'];
	const filteredTags =
		props?.element?.node?.tags?.filter((tag: { name: string }) => !excludedTagNames.includes(tag.name)) || [];

	function handleShowViewData(e: any) {
		e.preventDefault();
		e.stopPropagation();
		setShowViewData((prev) => !prev);
	}

	function handleShowViewResult(e: any) {
		e.preventDefault();
		e.stopPropagation();
		setShowViewResult((prev) => !prev);
	}

	function getActionLabel() {
		if (isNativeArTransfer(props.element.node)) return DEFAULT_ACTIONS.transfer.name;

		const action = getTagValue(props.element.node.tags, 'Action');
		if (action) return action;
		if (shouldUseMessageActionFallback) return getNonMessageActionFallback(props.element.node.tags) ?? language.none;

		return language.none;
	}

	function getFrom() {
		const from = getTagValue(props.element.node.tags, 'From-Process') ?? props.element.node.owner.address;

		return <S.From>{from ? <TxAddress address={from} tooltipPosition={'right'} /> : <p>-</p>}</S.From>;
	}

	function getTo() {
		return (
			<S.To>
				{props.element.node.recipient ? (
					<TxAddress address={props.element.node.recipient} tooltipPosition={'right'} />
				) : (
					<p>No Recipient</p>
				)}
			</S.To>
		);
	}

	function getActionBackground() {
		const action = getActionLabel();

		if (action.toLowerCase().includes('error')) {
			return currentTheme.colors.warning.alt1;
		}

		switch (action) {
			case DEFAULT_ACTIONS.eval.name:
				return currentTheme.colors.actions.eval;
			case DEFAULT_ACTIONS.info.name:
				return currentTheme.colors.actions.info;
			case DEFAULT_ACTIONS.balance.name:
				return currentTheme.colors.actions.balance;
			case DEFAULT_ACTIONS.transfer.name:
				return currentTheme.colors.actions.transfer;
			case DEFAULT_ACTIONS.debitNotice.name:
				return currentTheme.colors.actions.debitNotice;
			case DEFAULT_ACTIONS.creditNotice.name:
				return currentTheme.colors.actions.creditNotice;
			case MINT_ACTIONS.mint.name:
				return currentTheme.colors.actions.mint;
			case MINT_ACTIONS.piDelegationRecords.name:
				return currentTheme.colors.actions.piDelegationRecords;
			case MINT_ACTIONS.reportMint.name:
				return currentTheme.colors.actions.reportMint;
			case MINT_ACTIONS.setPiIndexWeights.name:
				return currentTheme.colors.actions.setPiIndexWeights;
			case MINT_ACTIONS.saveDelegationSummary.name:
				return currentTheme.colors.actions.saveDelegationSummary;
			case MINT_ACTIONS.nextPiDelegationPage.name:
				return currentTheme.colors.actions.nextPiDelegationPage;
			case 'None':
				return currentTheme.colors.actions.none;
			default:
				return currentTheme.colors.actions.other;
		}
	}

	function getAction(useMaxWidth: boolean) {
		const actionLabel = getActionLabel();
		const target = props.element.node.recipient ?? getTagValue(props.element.node.tags, 'Target');

		return (
			<S.ActionValue background={getActionBackground()} useMaxWidth={useMaxWidth}>
				<div className={'action-indicator'} />
				<p>{actionLabel}</p>
				<TransferAmount tags={props.element.node.tags} target={target} quantity={props.element.node.quantity} />
				<S.ActionTooltip className={'info'}>
					<span>{actionLabel}</span>
				</S.ActionTooltip>
			</S.ActionValue>
		);
	}

	function getData() {
		if (!data) return null;

		if (typeof data === 'object') {
			return <JSONReader data={data} header={language.data} maxHeight={600} noFullScreen />;
		}

		return (
			<Editor initialData={data} header={language.data} language={'lua'} readOnly loading={false} fixedHeight={450} />
		);
	}

	const OverlayLine = ({ label, value, render }: { label: string; value: any; render?: (v: any) => JSX.Element }) => {
		const defaultRender = (v: any) => {
			if (typeof v === 'string' && checkValidAddress(v)) {
				return (
					<TxAddress
						address={v}
						tooltipPosition={'top-right'}
						handlePress={() => {
							setShowViewData(false);
							setShowViewResult(false);
						}}
					/>
				);
			}
			return <p>{v}</p>;
		};

		const renderContent = render || defaultRender;

		return (
			<S.OverlayLine>
				<span>{label}</span>
				{value ? renderContent(value) : <p>-</p>}
			</S.OverlayLine>
		);
	};

	const OverlayTagValue = ({ value }: { value: any }) => {
		const displayValue = value?.toString?.() ?? value;
		const [copied, setCopied] = React.useState<boolean>(false);
		const [tooltipVisible, setTooltipVisible] = React.useState<boolean>(false);
		const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

		React.useEffect(() => {
			return () => {
				if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
			};
		}, []);

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
			setTooltipVisible(true);
		}

		return (
			<S.OverlayTagValue
				type={'button'}
				onBlur={hideTooltip}
				onClick={handleCopy}
				onFocus={showTooltip}
				onMouseEnter={showTooltip}
				onMouseLeave={hideTooltip}
				$tooltipVisible={tooltipVisible}
			>
				<p>{displayValue}</p>
				<S.OverlayTagValueTooltip>{copied ? `${language.copied}!` : displayValue}</S.OverlayTagValueTooltip>
			</S.OverlayTagValue>
		);
	};

	const renderOverlayTagValue = (value: any) => <OverlayTagValue value={value} />;

	function getMessageOverlay() {
		let open = false;
		let header = null;
		let handleClose = () => {};
		let content = null;
		let loading = true;

		if (showViewData) {
			open = true;
			header = language.input;
			handleClose = () => setShowViewData(false);
			content = getData();
			if (data) loading = false;
		} else if (showViewResult) {
			open = true;
			header = language.result;
			handleClose = () => setShowViewResult(false);
			content = <JSONReader data={result} header={language.output} noWrapper noFullScreen />;
			if (result) loading = false;
		}

		return open ? (
			<Modal type="panel" width={750} header={header} handleClose={handleClose}>
				<S.OverlayWrapper>
					<S.OverlayInfo>
						<S.OverlayInfoLine>
							<S.OverlayInfoLineValue>
								<p>{`${language.message}: `}</p>
							</S.OverlayInfoLineValue>
							<TxAddress
								address={props.element.node.id}
								tooltipPosition={'bottom-right'}
								handlePress={() => {
									setShowViewData(false);
									setShowViewResult(false);
								}}
							/>
						</S.OverlayInfoLine>
						<S.OverlayInfoLine>
							<S.OverlayInfoLineValue>
								<p>{`${language.owner}: `}</p>
							</S.OverlayInfoLineValue>
							<TxAddress
								address={props.element.node.owner?.address ?? '-'}
								tooltipPosition={'bottom-right'}
								handlePress={() => {
									setShowViewData(false);
									setShowViewResult(false);
								}}
							/>
						</S.OverlayInfoLine>
						<S.OverlayInfoLine>{getAction(false)}</S.OverlayInfoLine>
						{showViewData && (
							<S.OverlayTagsWrapper>
								<S.OverlayTagsHeader>
									<p>{language.tags}</p>
								</S.OverlayTagsHeader>
								{filteredTags.map((tag: { name: string; value: string }, index: number) => (
									<OverlayLine key={index} label={tag.name} value={tag.value} render={renderOverlayTagValue} />
								))}
							</S.OverlayTagsWrapper>
						)}
					</S.OverlayInfo>
					<S.OverlayOutput>{loading ? <p>{`${language.loading}...`}</p> : <>{content}</>}</S.OverlayOutput>
					<S.OverlayActions>
						<Button type={'primary'} label={language.close} handlePress={handleClose} />
					</S.OverlayActions>
				</S.OverlayWrapper>
			</Modal>
		) : null;
	}

	function getID() {
		if (props.showResultMessageLabel) {
			if (props.element.node.id) {
				return (
					<S.ResultMessage>
						<ExplorerLink
							value={props.element.node.id}
							type={'transaction'}
							label={'Result Message'}
							tooltipPosition={'right'}
							handlePress={props.handleOpen ? () => props.handleOpen(props.element.node.id) : undefined}
						/>
					</S.ResultMessage>
				);
			}

			return (
				<S.ResultMessage>
					<span>Result Message</span>
				</S.ResultMessage>
			);
		}

		if (props.element.node.id) {
			return (
				<S.TxAddress>
					<TxAddress address={props.element.node.id} tooltipPosition={'right'} />
				</S.TxAddress>
			);
		}

		return (
			<S.ResultMessage>
				<span>Result Message</span>
			</S.ResultMessage>
		);
	}

	function getTransactionTypeLabel() {
		if (!isAoMessage) return language.transaction;

		const variant = getTagValue(props.element.node.tags, TAGS.keys.variant) ?? props.variant;

		return variant ? `${language.message} (${variant})` : language.message;
	}

	const hydrateNestedAoTransferNotices = shouldHydrateAoTransferNotices({
		action: getTagValue(props.element.node.tags, 'Action'),
		variant: props.variant,
		recipient: props.element.node.recipient,
	});
	const rowClickable = Boolean(props.element.node.id);

	function handleRowClick() {
		if (!props.element.node.id) return;

		if (canFetchAoResult) {
			setOpen((prev) => !prev);
			return;
		}

		navigate(`${URLS.explorer}${props.element.node.id}`);
	}

	return filterMessage ? (
		<S.ElementWrapper
			key={props.element.node.id}
			className={'message-list-element'}
			onClick={() => {}}
			disabled={true}
			clickable={false}
			open={false}
			lastChild={props.lastChild}
			$nestingLevel={(props.nestingLevel ?? 0) + 1}
			style={{ pointerEvents: 'none' }}
		>
			<S.InfoWrapper>
				<p>Message marked as spam</p>
			</S.InfoWrapper>
		</S.ElementWrapper>
	) : (
		<>
			<S.ElementWrapper
				key={props.element.node.id}
				className={'message-list-element'}
				onClick={rowClickable ? handleRowClick : undefined}
				disabled={!props.element.node.id}
				clickable={rowClickable}
				open={open && canFetchAoResult}
				lastChild={props.lastChild}
				childList={props.childList}
				$nestingLevel={(props.nestingLevel ?? 0) + 1}
			>
				<S.ID>{getID()}</S.ID>
				<S.TypeValue>
					<p>{getTransactionTypeLabel()}</p>
				</S.TypeValue>
				{getAction(true)}
				{getFrom()}
				{getTo()}
				<S.Input>
					<Button
						type={'alt3'}
						label={language.input}
						handlePress={(e) => handleShowViewData(e)}
						disabled={!props.element.node.id}
					/>
				</S.Input>
				<S.Output>
					<Button
						type={'alt3'}
						label={language.output}
						handlePress={(e) => handleShowViewResult(e)}
						disabled={!props.element.node.id || !canFetchAoResult}
					/>
				</S.Output>
				<S.Time>
					<p>
						{props.element.node?.block?.timestamp
							? getRelativeDate(props.element.node.block.timestamp * 1000)
							: 'Processing'}
					</p>
				</S.Time>
				<S.Results open={open}>{canFetchAoResult ? <ReactSVG src={ASSETS.arrow} /> : <p>None</p>}</S.Results>
			</S.ElementWrapper>
			{open && canFetchAoResult && (
				<MessageList
					txId={props.element.node.id}
					variant={props.variant}
					type={props.type}
					currentFilter={props.currentFilter}
					recipient={props.element.node.recipient}
					parentId={props.parentId}
					result={result}
					willHaveResult={false}
					timestamp={props.element?.node?.block?.timestamp}
					authority={getTagValue(props.element.node.tags, 'Authority')}
					showFilteredMessages
					hydrateAoTransferNotices={hydrateNestedAoTransferNotices}
					showResultMessageLabel={true}
					handleMessageOpen={props.handleOpen ? (id: string) => props.handleOpen(id) : null}
					childList
					nestingLevel={(props.nestingLevel ?? 0) + 1}
					isOverallLast={props.isOverallLast && props.lastChild}
				/>
			)}
			{getMessageOverlay()}
		</>
	);
}

function normalizeVariantFilter(variant: any): MessageVariantEnum | null {
	if ((Object.values(MessageVariantEnum) as string[]).includes(variant)) return variant as MessageVariantEnum;

	return null;
}

function normalizePerPageFilter(perPage: any) {
	const parsed = Number(perPage);

	return Number.isInteger(parsed) && parsed > 0 ? parsed.toString() : DEFAULT_RESULTS_PER_PAGE.toString();
}

function parsePositiveInteger(value: string | number) {
	const parsed = Number(value);

	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeDirectionFilter(value: string | null): MessageFilterType | null {
	return value === 'incoming' || value === 'outgoing' ? value : null;
}

function parseDateFilter(value: string | null) {
	if (!value) return null;

	const [year, month, day] = value.split('-').map((part) => Number(part));
	if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;

	const date = new Date(year, month - 1, day);
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;

	return { year, month, day };
}

function formatDateFilter(date: { year: number; month: number; day: number } | null) {
	if (!date) return null;

	return [date.year, date.month.toString().padStart(2, '0'), date.day.toString().padStart(2, '0')].join('-');
}

function getMessageQueryState(searchParams: URLSearchParams) {
	const direction = normalizeDirectionFilter(getSearchParam(searchParams, MESSAGE_QUERY_KEYS.direction));
	const action = getSearchParam(searchParams, MESSAGE_QUERY_KEYS.action);
	const variant = normalizeVariantFilter(getSearchParam(searchParams, MESSAGE_QUERY_KEYS.variant));
	const recipient = getSearchParam(searchParams, MESSAGE_QUERY_KEYS.recipient) ?? '';
	const fromAddress = getSearchParam(searchParams, MESSAGE_QUERY_KEYS.from) ?? '';
	const startDate = parseDateFilter(getSearchParam(searchParams, MESSAGE_QUERY_KEYS.start));
	const endDate = parseDateFilter(getSearchParam(searchParams, MESSAGE_QUERY_KEYS.end));
	const perPage = normalizePerPageFilter(getSearchParam(searchParams, MESSAGE_QUERY_KEYS.limit));
	const page = parsePositiveInteger(getSearchParam(searchParams, MESSAGE_QUERY_KEYS.page) ?? '');
	const after = getSearchParam(searchParams, MESSAGE_QUERY_KEYS.after);
	const hasQuery = Object.values(MESSAGE_QUERY_KEYS).some((key) => searchParams.has(key));

	return {
		hasQuery: hasQuery,
		filter: direction,
		action: action,
		variant: variant,
		recipient: recipient,
		fromAddress: fromAddress,
		startDate: startDate,
		endDate: endDate,
		perPage: perPage,
		page: page,
		after: after,
	};
}

function getHashRouteSearch() {
	if (typeof window === 'undefined') return '';

	const searchIndex = window.location.hash.indexOf('?');

	return searchIndex >= 0 ? window.location.hash.slice(searchIndex) : '';
}

function getRouteSearch(locationSearch: string, searchParams: URLSearchParams) {
	if (locationSearch) return locationSearch;

	const searchParamString = searchParams.toString();
	if (searchParamString) return `?${searchParamString}`;

	return getHashRouteSearch();
}

function normalizePathname(pathname: string) {
	return pathname.replace(/\/+$/, '') || '/';
}

function shouldSyncMessageQueryParams(args: {
	pathname: string;
	txId?: string;
	type?: TransactionType;
	childList?: boolean;
	result?: any;
}) {
	if (args.childList || args.result) return false;

	const pathname = normalizePathname(args.pathname);
	if (!args.txId) return pathname === normalizePathname(URLS.base);

	const explorerPath = normalizePathname(`${URLS.explorer}${args.txId}`);

	if (args.type === 'process') return pathname === `${explorerPath}/messages`;
	if (args.type === 'wallet') return pathname === explorerPath || pathname === `${explorerPath}/info`;

	return false;
}

export default function MessageList(props: {
	header?: string;
	txId?: string;
	variant: MessageVariantEnum;
	type?: TransactionType;
	currentFilter?: MessageFilterType;
	recipient?: string | null;
	parentId?: string;
	handleMessageOpen?: (id: string) => void;
	childList?: boolean;
	nestingLevel?: number;
	isOverallLast?: boolean;
	result?: any;
	willHaveResult?: boolean;
	timestamp?: number;
	authority?: string;
	skipResultFetch?: boolean;
	showFilteredMessages?: boolean;
	hydrateAoTransferNotices?: boolean;
	showResultMessageLabel?: boolean;
}) {
	const location = useLocation();
	const [searchParams, setSearchParams] = useSearchParams();
	const dispatch = useDispatch();

	const permawebProvider = usePermawebProvider();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const tableContainerRef = React.useRef(null);
	const syncQueryParams = shouldSyncMessageQueryParams({
		pathname: location.pathname,
		txId: props.txId,
		type: props.type,
		childList: props.childList,
		result: props.result,
	});
	const routeSearch = React.useMemo(
		() => getRouteSearch(location.search, searchParams),
		[location.search, searchParams]
	);
	const routeSearchParams = React.useMemo(() => new URLSearchParams(routeSearch), [routeSearch]);
	const queryFilterState = React.useMemo(
		() => (syncQueryParams ? getMessageQueryState(routeSearchParams) : null),
		[syncQueryParams, routeSearch]
	);
	const skipNextQueryWriteRef = React.useRef<boolean>(queryFilterState?.hasQuery ?? false);

	const [showFilters, setShowFilters] = React.useState<boolean>(false);
	const filterStorageKey = React.useMemo(() => {
		if (props.childList || props.result) return null;

		return STORAGE.messageFilter(props.txId || 'global');
	}, [props.txId, props.childList, props.result]);

	const loadedFilterState = React.useMemo(() => {
		if (filterStorageKey) {
			try {
				const saved = localStorage.getItem(filterStorageKey);
				if (saved) {
					const parsed = JSON.parse(saved);
					return {
						filter: parsed.filter,
						action: parsed.action || null,
						variant: normalizeVariantFilter(parsed.variant),
						recipient: parsed.recipient || '',
						fromAddress: parsed.fromAddress || '',
						startDate: parsed.startDate || null,
						endDate: parsed.endDate || null,
						perPage: normalizePerPageFilter(parsed.perPage),
					};
				}
			} catch (e) {
				console.error('Failed to load message filter:', e);
			}
		}
		return null;
	}, [filterStorageKey]);
	const initialFilterState = queryFilterState?.hasQuery ? queryFilterState : loadedFilterState;

	const [currentFilter, setCurrentFilter] = React.useState<MessageFilterType>(
		props.currentFilter ?? initialFilterState?.filter ?? 'outgoing'
	);
	const [currentAction, setCurrentAction] = React.useState<string | null>(initialFilterState?.action ?? null);
	const [currentVariant, setCurrentVariant] = React.useState<MessageVariantEnum | null>(
		initialFilterState?.variant ?? null
	);
	const [actionOptions, setActionOptions] = React.useState<string[]>(() => {
		const defaultActions = Object.keys(DEFAULT_ACTIONS).map((action) => DEFAULT_ACTIONS[action].name);
		try {
			const savedCustomActions = localStorage.getItem(STORAGE.customActions);
			if (savedCustomActions) {
				const customActions = JSON.parse(savedCustomActions);
				return [...defaultActions, ...customActions];
			}
		} catch (e) {
			console.error('Failed to load custom actions:', e);
		}
		return defaultActions;
	});
	const [customAction, setCustomAction] = React.useState<string>('');
	const [toggleFilterChange, setToggleFilterChange] = React.useState<boolean>(false);

	const [currentData, setCurrentData] = React.useState<any[] | null>(null);
	const [loadingMessages, setLoadingMessages] = React.useState<boolean>(false);

	const [incomingCount, setIncomingCount] = React.useState<number | null>(null);
	const [outgoingCount, setOutgoingCount] = React.useState<number | null>(null);
	const [totalCount, setTotalCount] = React.useState<number | null>(null);

	const [pageCursor, setPageCursor] = React.useState<string | null>(queryFilterState?.after ?? null);
	const [cursorHistory, setCursorHistory] = React.useState<(string | null)[]>([]);
	const [nextCursor, setNextCursor] = React.useState<string | null>(null);
	const [pageNumber, setPageNumber] = React.useState(queryFilterState?.page ?? 1);
	const [pageInput, setPageInput] = React.useState<string>((queryFilterState?.page ?? 1).toString());
	const [perPage, setPerPage] = React.useState<string>(
		initialFilterState?.perPage ?? DEFAULT_RESULTS_PER_PAGE.toString()
	);
	const [perPageInput, setPerPageInput] = React.useState<string>(
		initialFilterState?.perPage ?? DEFAULT_RESULTS_PER_PAGE.toString()
	);
	const [recipient, setRecipient] = React.useState<string>(initialFilterState?.recipient ?? '');
	const [fromAddress, setFromAddress] = React.useState<string>(initialFilterState?.fromAddress ?? '');
	const [fromAddressIsProcess, setFromAddressIsProcess] = React.useState<boolean>(false);

	// Time range filter states
	const [startDate, setStartDate] = React.useState<{ year: number; month: number; day: number } | null>(
		initialFilterState?.startDate ?? null
	);
	const [endDate, setEndDate] = React.useState<{ year: number; month: number; day: number } | null>(
		initialFilterState?.endDate ?? null
	);
	const [showStartCalendar, setShowStartCalendar] = React.useState<boolean>(false);
	const [showEndCalendar, setShowEndCalendar] = React.useState<boolean>(false);

	// Applied filter states (only updated when "Apply Filters" is clicked)
	const [appliedAction, setAppliedAction] = React.useState<string | null>(initialFilterState?.action ?? null);
	const [appliedVariant, setAppliedVariant] = React.useState<MessageVariantEnum | null>(
		initialFilterState?.variant ?? null
	);
	const [appliedRecipient, setAppliedRecipient] = React.useState<string>(initialFilterState?.recipient ?? '');
	const [appliedFromAddress, setAppliedFromAddress] = React.useState<string>(initialFilterState?.fromAddress ?? '');
	const [appliedFromAddressIsProcess, setAppliedFromAddressIsProcess] = React.useState<boolean>(false);
	const [appliedStartDate, setAppliedStartDate] = React.useState<{ year: number; month: number; day: number } | null>(
		initialFilterState?.startDate ?? null
	);
	const [appliedEndDate, setAppliedEndDate] = React.useState<{ year: number; month: number; day: number } | null>(
		initialFilterState?.endDate ?? null
	);

	const parsedPerPage = React.useMemo(() => {
		const parsed = Number(perPage);

		return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
	}, [perPage]);
	const parsedPerPageInput = React.useMemo(() => {
		const parsed = Number(perPageInput);

		return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
	}, [perPageInput]);
	const invalidPerPage = parsedPerPageInput === null;
	const showLargeFetchWarning = parsedPerPageInput !== null && parsedPerPageInput > GQL_PAGE_CHUNK_SIZE;
	const usingCustomPerPage = parsedPerPage !== null && parsedPerPage !== DEFAULT_RESULTS_PER_PAGE;
	const hasAppliedFilters = Boolean(
		appliedAction ||
			appliedVariant ||
			(appliedRecipient && checkValidAddress(appliedRecipient)) ||
			(appliedFromAddress && checkValidAddress(appliedFromAddress)) ||
			appliedStartDate ||
			appliedEndDate ||
			usingCustomPerPage
	);

	React.useEffect(() => {
		setPageInput(pageNumber.toString());
	}, [pageNumber]);

	React.useEffect(() => {
		if (!syncQueryParams || !queryFilterState?.hasQuery) return;

		skipNextQueryWriteRef.current = true;

		const nextFilter = props.currentFilter ?? queryFilterState.filter ?? 'outgoing';

		setCurrentFilter(nextFilter);
		setCurrentAction(queryFilterState.action);
		setCurrentVariant(queryFilterState.variant);
		setRecipient(queryFilterState.recipient);
		setAppliedRecipient(queryFilterState.recipient);
		setFromAddress(queryFilterState.fromAddress);
		setAppliedFromAddress(queryFilterState.fromAddress);
		setStartDate(queryFilterState.startDate);
		setAppliedStartDate(queryFilterState.startDate);
		setEndDate(queryFilterState.endDate);
		setAppliedEndDate(queryFilterState.endDate);
		setPerPage(queryFilterState.perPage);
		setPerPageInput(queryFilterState.perPage);
		setPageCursor(queryFilterState.after);
		setPageNumber(queryFilterState.page ?? 1);
	}, [props.currentFilter, queryFilterState, syncQueryParams]);

	React.useEffect(() => {
		if (!syncQueryParams) return;
		if (skipNextQueryWriteRef.current) {
			skipNextQueryWriteRef.current = false;
			return;
		}

		const directionAffectsQuery = !!props.type && props.type !== 'message';
		const recipientAffectsQuery = currentFilter !== 'incoming' || !props.txId;
		const fromAffectsQuery = currentFilter === 'incoming' && !!props.txId;

		updateSearchParams(routeSearchParams, setSearchParams, {
			[MESSAGE_QUERY_KEYS.direction]: directionAffectsQuery ? currentFilter : null,
			[MESSAGE_QUERY_KEYS.action]: appliedAction,
			[MESSAGE_QUERY_KEYS.variant]: appliedVariant,
			[MESSAGE_QUERY_KEYS.recipient]: recipientAffectsQuery ? appliedRecipient : null,
			[MESSAGE_QUERY_KEYS.from]: fromAffectsQuery ? appliedFromAddress : null,
			[MESSAGE_QUERY_KEYS.start]: formatDateFilter(appliedStartDate),
			[MESSAGE_QUERY_KEYS.end]: formatDateFilter(appliedEndDate),
			[MESSAGE_QUERY_KEYS.limit]:
				parsedPerPage !== null && parsedPerPage !== DEFAULT_RESULTS_PER_PAGE ? parsedPerPage : null,
			[MESSAGE_QUERY_KEYS.after]: pageCursor,
			[MESSAGE_QUERY_KEYS.page]: pageNumber > 1 ? pageNumber : null,
		});
	}, [
		appliedAction,
		appliedEndDate,
		appliedFromAddress,
		appliedRecipient,
		appliedStartDate,
		appliedVariant,
		currentFilter,
		pageCursor,
		pageNumber,
		parsedPerPage,
		props.txId,
		props.type,
		routeSearchParams,
		setSearchParams,
		syncQueryParams,
	]);

	function dateToTimestamp(date: { year: number; month: number; day: number }): number {
		return Math.floor(new Date(date.year, date.month - 1, date.day).getTime() / 1000);
	}

	function formatDateLabel(date: { year: number; month: number; day: number } | null): string {
		if (!date) return '';
		return `${date.month}/${date.day}/${date.year}`;
	}

	function getVariantFilterLabel(variant: MessageVariantEnum | null) {
		switch (variant) {
			case MessageVariantEnum.Legacynet:
				return `${language.aoLegacynet} (${MessageVariantEnum.Legacynet})`;
			case MessageVariantEnum.Mainnet:
				return `${language.aoMainnet} (${MessageVariantEnum.Mainnet})`;
			default:
				return language.all;
		}
	}

	function buildQueryTags(tags: { name: string; values: string[] }[]) {
		const nextTags = appliedVariant ? [...tags, { name: 'Variant', values: [appliedVariant] }] : [...tags];
		const variantForQuery = appliedVariant ?? props.variant;

		return variantForQuery === MessageVariantEnum.Mainnet ? lowercaseTagKeys(nextTags) : nextTags;
	}

	function getQueryTagsArg(tags: { name: string; values: string[] }[]) {
		const queryTags = buildQueryTags(tags);

		return queryTags.length > 0 ? { tags: queryTags } : {};
	}

	function withProcessMessageGateway<T extends Record<string, any>>(args: T): T & { gateway?: string } {
		return props.type === 'process' ? { ...args, gateway: DEFAULT_GATEWAYS.legacy } : args;
	}

	function withProcessMessageTags(tags: { name: string; values: string[] }[]) {
		return props.type === 'process' ? [...DEFAULT_MESSAGE_TAGS, ...tags] : tags;
	}

	async function timestampToBlockHeight(timestamp: number): Promise<number> {
		try {
			// Fetch current network height
			const networkResponse = await fetch(arweaveEndpoint);
			const networkData = await networkResponse.json();
			const currentBlockHeight = networkData.height;

			// Fetch current block data to get timestamp
			const blockResponse = await fetch(`${arweaveEndpoint}/block/current`);
			const currentBlockData = await blockResponse.json();
			const currentBlockTimestamp = currentBlockData.timestamp;

			// Arweave block time is approximately 2 minutes (120 seconds)
			const BLOCK_TIME = 120;

			// Calculate block height based on time difference from current block
			const timeDifference = currentBlockTimestamp - timestamp;
			const blockDifference = Math.floor(timeDifference / BLOCK_TIME);
			const estimatedBlock = currentBlockHeight - blockDifference;

			return Math.max(0, estimatedBlock);
		} catch (e) {
			console.error('Error converting timestamp to block height:', e);
			return 0;
		}
	}

	async function checkIsProcess(address: string): Promise<boolean> {
		try {
			const response = await searchTxById({
				txId: address,
				getGQLData: permawebProvider.libs.getGQLData,
				store: store,
				dispatch: dispatch,
			});

			const type = getTagValue(response.node?.tags, 'Type');
			return type === 'Process';

			return false;
		} catch (e) {
			console.error('Error checking if address is process:', e);
			return false;
		}
	}

	function saveFilterState() {
		if (filterStorageKey) {
			try {
				const filterState = {
					filter: currentFilter,
					action: currentAction,
					variant: currentVariant,
					recipient: recipient,
					fromAddress: fromAddress,
					startDate: startDate,
					endDate: endDate,
					perPage: parsedPerPage?.toString() ?? undefined,
				};
				localStorage.setItem(filterStorageKey, JSON.stringify(filterState));
			} catch (e) {
				console.error('Failed to save message filter:', e);
			}
		}
	}

	async function getOutgoingGQLArgs(outgoingTags) {
		switch (props.type) {
			case 'process':
			case 'message':
				let tags = withProcessMessageTags(outgoingTags);

				tags.push({ name: 'From-Process', values: [props.txId] });

				return {
					...getQueryTagsArg(tags),
					owners: [props.authority ?? ''],
				};
			case 'wallet':
				return {
					...getQueryTagsArg(outgoingTags),
					owners: [props.txId],
				};
		}
	}

	async function fetchGqlDataPage(queryArgs: any, amount: number) {
		const { cursor: initialCursor, paginator: _paginator, ...baseArgs } = queryArgs;
		const rows: any[] = [];
		let cursor: string | null = initialCursor ?? null;
		let nextCursorValue: string | null = null;
		let count: number | null = null;

		while (rows.length < amount) {
			const response = await permawebProvider.libs.getGQLData(
				withProcessMessageGateway({
					...baseArgs,
					paginator: Math.min(GQL_PAGE_CHUNK_SIZE, amount - rows.length),
					...(cursor ? { cursor } : {}),
				})
			);
			const pageRows = response?.data ?? [];
			const responseNextCursor = response?.nextCursor && response.nextCursor !== 'END' ? response.nextCursor : null;

			if (count === null && response?.count !== undefined) count = response.count;

			rows.push(...pageRows);
			nextCursorValue = responseNextCursor;

			if (pageRows.length <= 0 || !responseNextCursor) break;
			cursor = responseNextCursor;
		}

		return {
			count,
			data: rows.slice(0, amount),
			nextCursor: nextCursorValue,
		};
	}

	async function getMessagePageQueryArgs(cursor: string | null) {
		let tags = [];
		if (appliedAction) tags.push({ name: 'Action', values: [appliedAction] });
		const cursorArg = cursor ? { cursor: cursor } : {};

		if (props.txId) {
			if (props.childList || props.type === 'message') return null;

			switch (currentFilter) {
				case 'incoming': {
					let incomingQueryArgs: any = {
						...getQueryTagsArg(withProcessMessageTags(tags)),
						recipients: [props.txId],
						...cursorArg,
						// sort: 'descending',
					};

					if (appliedFromAddress && checkValidAddress(appliedFromAddress)) {
						if (appliedFromAddressIsProcess) {
							incomingQueryArgs = {
								...incomingQueryArgs,
								...getQueryTagsArg([
									...withProcessMessageTags(tags),
									{ name: 'From-Process', values: [appliedFromAddress] },
								]),
							};
						} else {
							incomingQueryArgs.owners = [appliedFromAddress];
						}
					}

					if (appliedStartDate) {
						incomingQueryArgs.minBlock = await timestampToBlockHeight(dateToTimestamp(appliedStartDate));
					}
					if (appliedEndDate) {
						incomingQueryArgs.maxBlock = await timestampToBlockHeight(
							dateToTimestamp({
								...appliedEndDate,
								day: appliedEndDate.day + 1,
							})
						);
					}

					return incomingQueryArgs;
				}
				case 'outgoing': {
					let outgoingArgs: any = {
						...(appliedRecipient && checkValidAddress(appliedRecipient) ? { recipients: [appliedRecipient] } : {}),
						...cursorArg,
						// sort: 'descending',
						...(await getOutgoingGQLArgs(tags)),
					};

					if (appliedStartDate) {
						outgoingArgs.minBlock = await timestampToBlockHeight(dateToTimestamp(appliedStartDate));
					}
					if (appliedEndDate) {
						outgoingArgs.maxBlock = await timestampToBlockHeight(
							dateToTimestamp({
								...appliedEndDate,
								day: appliedEndDate.day + 1,
							})
						);
					}

					return outgoingArgs;
				}
				default:
					return null;
			}
		}

		tags = [...DEFAULT_MESSAGE_TAGS, ...tags];

		let globalQueryArgs: any = {
			...getQueryTagsArg(tags),
			...(appliedRecipient && checkValidAddress(appliedRecipient) ? { recipients: [appliedRecipient] } : {}),
			...cursorArg,
		};

		if (appliedStartDate) {
			globalQueryArgs.minBlock = await timestampToBlockHeight(dateToTimestamp(appliedStartDate));
		}
		if (appliedEndDate) {
			globalQueryArgs.maxBlock = await timestampToBlockHeight(
				dateToTimestamp({
					...appliedEndDate,
					day: appliedEndDate.day + 1,
				})
			);
		}

		return globalQueryArgs;
	}

	function handleExport() {
		const csvRows = (currentData ?? []).map(mapTransactionForCsv);

		if (csvRows.length <= 0) return;

		const exportType = props.type === 'wallet' ? 'wallet-transactions' : props.txId ? 'messages' : 'recent-messages';
		const source = props.txId ? `${props.type ?? 'source'}-${props.txId}` : 'global';

		downloadCsv(
			buildCsvFilename([exportType, source, `page-${pageNumber}`, parsedPerPage ? `limit-${parsedPerPage}` : null]),
			csvRows
		);
	}

	// Check if fromAddress is a process whenever it changes
	React.useEffect(() => {
		(async function () {
			if (fromAddress && checkValidAddress(fromAddress)) {
				const isProcess = await checkIsProcess(fromAddress);
				setFromAddressIsProcess(isProcess);
			} else {
				setFromAddressIsProcess(false);
			}
		})();
	}, [fromAddress]);

	// Initialize appliedFromAddressIsProcess on mount if there's a loaded fromAddress
	React.useEffect(() => {
		(async function () {
			if (initialFilterState?.fromAddress && checkValidAddress(initialFilterState.fromAddress)) {
				const isProcess = await checkIsProcess(initialFilterState.fromAddress);
				setAppliedFromAddressIsProcess(isProcess);
				setFromAddressIsProcess(isProcess);
			}
		})();
	}, []);

	// Save filter state whenever it changes
	React.useEffect(() => {
		saveFilterState();
	}, [currentFilter, currentAction, currentVariant, recipient, fromAddress, startDate, endDate, perPage]);

	React.useEffect(() => {
		(async function () {
			if (props.type === 'wallet') return;

			const baseTags = [];
			if (appliedAction) baseTags.push({ name: 'Action', values: [appliedAction] });

			if (props.txId) {
				try {
					// Build incoming query args
					let incomingQueryArgs: any = {
						...getQueryTagsArg(withProcessMessageTags(baseTags)),
						recipients: [props.txId],
					};

					// Add fromAddress filter if applicable
					if (appliedFromAddress && checkValidAddress(appliedFromAddress)) {
						if (appliedFromAddressIsProcess) {
							incomingQueryArgs = {
								...incomingQueryArgs,
								...getQueryTagsArg([
									...withProcessMessageTags(baseTags),
									{ name: 'From-Process', values: [appliedFromAddress] },
								]),
							};
						} else {
							incomingQueryArgs.owners = [appliedFromAddress];
						}
					}

					// Add time range filters
					if (appliedStartDate) {
						incomingQueryArgs.minBlock = await timestampToBlockHeight(dateToTimestamp(appliedStartDate));
					}
					if (appliedEndDate) {
						incomingQueryArgs.maxBlock = await timestampToBlockHeight(
							dateToTimestamp({
								...appliedEndDate,
								day: appliedEndDate.day + 1,
							})
						);
					}

					let outgoingQueryArgs: any = {
						...(appliedRecipient && checkValidAddress(appliedRecipient) ? { recipients: [appliedRecipient] } : {}),
						...(await getOutgoingGQLArgs(baseTags)),
					};

					// Add time range filters for outgoing
					if (appliedStartDate) {
						outgoingQueryArgs.minBlock = await timestampToBlockHeight(dateToTimestamp(appliedStartDate));
					}
					if (appliedEndDate) {
						outgoingQueryArgs.maxBlock = await timestampToBlockHeight(
							dateToTimestamp({
								...appliedEndDate,
								day: appliedEndDate.day + 1,
							})
						);
					}

					const [gqlResponseIncoming, gqlResponseOutgoing] = await Promise.all([
						permawebProvider.libs.getGQLData(withProcessMessageGateway(incomingQueryArgs)),
						permawebProvider.libs.getGQLData(withProcessMessageGateway(outgoingQueryArgs)),
					]);
					setIncomingCount(gqlResponseIncoming.count);
					setOutgoingCount(gqlResponseOutgoing.count);
				} catch (e: any) {
					console.error(e);
				}
			}
		})();
	}, [props.txId, props.type, props.variant, toggleFilterChange]);

	React.useEffect(() => {
		(async function () {
			let tags = [];
			if (appliedAction) tags.push({ name: 'Action', values: [appliedAction] });

			setLoadingMessages(true);
			if (!parsedPerPage) {
				setCurrentData([]);
				setNextCursor(null);
				setLoadingMessages(false);
				return;
			}

			if (props.txId) {
				try {
					if (!props.childList && props.type !== 'message') {
						let gqlResponse: any;
						switch (currentFilter) {
							case 'incoming':
								let incomingQueryArgs: any = {
									...getQueryTagsArg(withProcessMessageTags(tags)),
									recipients: [props.txId],
									...(pageCursor ? { cursor: pageCursor } : {}),
									// sort: 'descending',
								};

								// Add fromAddress filter if applicable
								if (appliedFromAddress && checkValidAddress(appliedFromAddress)) {
									if (appliedFromAddressIsProcess) {
										incomingQueryArgs = {
											...incomingQueryArgs,
											...getQueryTagsArg([
												...withProcessMessageTags(tags),
												{ name: 'From-Process', values: [appliedFromAddress] },
											]),
										};
									} else {
										incomingQueryArgs.owners = [appliedFromAddress];
									}
								}

								// Add time range filters
								if (appliedStartDate) {
									incomingQueryArgs.minBlock = await timestampToBlockHeight(dateToTimestamp(appliedStartDate));
								}
								if (appliedEndDate) {
									incomingQueryArgs.maxBlock = await timestampToBlockHeight(
										dateToTimestamp({
											...appliedEndDate,
											day: appliedEndDate.day + 1,
										})
									);
								}

								gqlResponse = await fetchGqlDataPage(incomingQueryArgs, parsedPerPage);
								break;
							case 'outgoing':
								let outgoingArgs: any = {
									...(appliedRecipient && checkValidAddress(appliedRecipient)
										? { recipients: [appliedRecipient] }
										: {}),
									...(pageCursor ? { cursor: pageCursor } : {}),
									// sort: 'descending',
									...(await getOutgoingGQLArgs(tags)),
								};

								// Add time range filters
								if (appliedStartDate) {
									outgoingArgs.minBlock = await timestampToBlockHeight(dateToTimestamp(appliedStartDate));
								}
								if (appliedEndDate) {
									outgoingArgs.maxBlock = await timestampToBlockHeight(
										dateToTimestamp({
											...appliedEndDate,
											day: appliedEndDate.day + 1,
										})
									);
								}

								gqlResponse = await fetchGqlDataPage(outgoingArgs, parsedPerPage);
								break;
							default:
								break;
						}

						setCurrentData(gqlResponse.data);
						setNextCursor(gqlResponse.nextCursor);
						if (props.type === 'wallet' && !pageCursor) {
							if (currentFilter === 'incoming') {
								setIncomingCount(gqlResponse.count);
							} else {
								setOutgoingCount(gqlResponse.count);
							}
						}
					} else {
						if (props.recipient) {
							try {
								// Use the result prop if provided, otherwise fetch it (unless skipResultFetch is true)
								let resultResponse = props.result;

								if (!resultResponse) {
									if (props.willHaveResult) {
										return;
									}

									// If skipResultFetch is true and props.result is not yet available, keep loading
									if (!props.result && props.skipResultFetch) {
										// Don't set currentData to empty - keep loading state
										return;
									}

									if (!props.result && !props.skipResultFetch) {
										const deps = resolveLibDeps({
											variant: props.variant,
											permawebProvider: permawebProvider,
										});

										const messageId = await resolveMessageId({
											messageId: props.txId,
											variant: props.variant,
											target: props.recipient,
											permawebProvider: permawebProvider,
										});

										resultResponse = await deps.ao.result({
											process: props.recipient,
											message: messageId,
										});
									}
								}

								if (resultResponse && !resultResponse.error && resultResponse.Messages?.length > 0) {
									if (props.hydrateAoTransferNotices) {
										const resolvedMessages = await resolveResultMessages({
											messages: resultResponse.Messages,
											txId: props.txId,
											fromProcess: props.recipient,
											timestamp: props.timestamp,
											variant: props.variant,
											authority: props.authority,
											permawebProvider: permawebProvider,
										});

										setCurrentData(resolvedMessages.filter((edge) => !!edge?.node?.recipient));
									} else {
										const normalizedMessages = resultResponse.Messages.map((message: ResultMessageType) =>
											buildSyntheticResultMessageEdge({
												message: message,
												fromProcess: props.recipient,
												timestamp: props.timestamp,
												mapFromProcessCase: permawebProvider.libs.mapFromProcessCase,
											})
										).filter((edge) => !!edge?.node?.recipient);

										setCurrentData(normalizedMessages);
									}
								} else if (!props.willHaveResult) {
									setCurrentData([]);
								}
							} catch (e: any) {
								setLoadingMessages(false);
							}
						}
					}
				} catch (e: any) {
					console.error(e);
				}
			} else {
				tags = [...DEFAULT_MESSAGE_TAGS, ...tags];

				let globalQueryArgs: any = {
					...getQueryTagsArg(tags),
					...(appliedRecipient && checkValidAddress(appliedRecipient) ? { recipients: [appliedRecipient] } : {}),
					...(pageCursor ? { cursor: pageCursor } : {}),
				};

				// Add time range filters
				if (appliedStartDate) {
					globalQueryArgs.minBlock = await timestampToBlockHeight(dateToTimestamp(appliedStartDate));
				}
				if (appliedEndDate) {
					globalQueryArgs.maxBlock = await timestampToBlockHeight(
						dateToTimestamp({
							...appliedEndDate,
							day: appliedEndDate.day + 1,
						})
					);
				}

				const gqlResponse = await fetchGqlDataPage(globalQueryArgs, parsedPerPage);

				if (!pageCursor) setTotalCount(gqlResponse.count);
				setCurrentData(gqlResponse.data);
				setNextCursor(gqlResponse.nextCursor);
			}
			setLoadingMessages(false);
		})();
	}, [
		props.txId,
		props.type,
		props.variant,
		props.recipient,
		props.result,
		props.willHaveResult,
		currentFilter,
		toggleFilterChange,
		pageCursor,
		permawebProvider.libs,
	]);

	const scrollToTop = () => {
		if (tableContainerRef.current) {
			setTimeout(() => {
				tableContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}, 10);
		}
	};

	function handleNext() {
		if (nextCursor) {
			setCursorHistory((prevHistory) => [...prevHistory, pageCursor]);
			setPageCursor(nextCursor);
			setPageNumber((prevPage) => prevPage + 1);
			scrollToTop();
		}
	}

	function handlePrevious() {
		if (cursorHistory.length > 0) {
			const newHistory = [...cursorHistory];
			const previousCursor = newHistory.pop();
			setCursorHistory(newHistory);
			setPageCursor(previousCursor);
			setPageNumber((prevPage) => Math.max(prevPage - 1, 1));
			scrollToTop();
		}
	}

	function handleClear() {
		setPageNumber(1);
		setPageCursor(null);
		setNextCursor(null);
		setCursorHistory([]);
	}

	function handleFilterChange(filter: MessageFilterType) {
		if (filter === 'incoming') {
			setRecipient('');
		} else {
			setFromAddress('');
		}
		setCurrentFilter(filter);
		handleClear();
	}

	function handlePerPageReset() {
		setPerPage(DEFAULT_RESULTS_PER_PAGE.toString());
		setPerPageInput(DEFAULT_RESULTS_PER_PAGE.toString());
		setToggleFilterChange((prev) => !prev);
		handleClear();
	}

	function getActiveTotalCount() {
		if (props.result || props.childList) return null;
		if (props.txId) return currentFilter === 'incoming' ? incomingCount : outgoingCount;

		return totalCount;
	}

	function getTotalPages() {
		const count = getActiveTotalCount();
		if (count === null || !parsedPerPage) return null;

		return Math.max(1, Math.ceil(count / parsedPerPage));
	}

	function canUsePaginationControls() {
		return !props.result && (!props.txId || (!props.childList && props.type !== 'message'));
	}

	async function handlePageSubmit() {
		const parsedPage = parsePositiveInteger(pageInput);
		if (!parsedPage || !parsedPerPage || !canUsePaginationControls() || loadingMessages) {
			setPageInput(pageNumber.toString());
			return;
		}

		const totalPages = getTotalPages();
		const targetPage = totalPages ? Math.min(parsedPage, totalPages) : parsedPage;
		setPageInput(targetPage.toString());
		if (targetPage === pageNumber) return;

		if (targetPage === 1) {
			handleClear();
			scrollToTop();
			return;
		}

		const knownCursorIndex = targetPage - 1;
		if (knownCursorIndex < cursorHistory.length) {
			setCursorHistory(cursorHistory.slice(0, knownCursorIndex));
			setPageCursor(cursorHistory[knownCursorIndex]);
			setPageNumber(targetPage);
			scrollToTop();
			return;
		}

		setLoadingMessages(true);
		try {
			let cursor: string | null = null;
			const nextHistory: (string | null)[] = [];

			for (let page = 1; page < targetPage; page++) {
				nextHistory.push(cursor);
				const queryArgs = await getMessagePageQueryArgs(cursor);
				if (!queryArgs) {
					setPageInput(pageNumber.toString());
					return;
				}

				const response = await fetchGqlDataPage(queryArgs, parsedPerPage);
				if (!response.nextCursor) {
					setPageInput(pageNumber.toString());
					return;
				}

				cursor = response.nextCursor;
			}

			setCursorHistory(nextHistory);
			setPageCursor(cursor);
			setPageNumber(targetPage);
			scrollToTop();
		} catch (e: any) {
			console.error(e);
			setPageInput(pageNumber.toString());
		} finally {
			setLoadingMessages(false);
		}
	}

	function handlePerPageSubmit() {
		if (!parsedPerPageInput) {
			setPerPageInput(perPage);
			return;
		}

		setPerPage(parsedPerPageInput.toString());
		setPerPageInput(parsedPerPageInput.toString());
		setToggleFilterChange((prev) => !prev);
		handleClear();
		scrollToTop();
	}

	function handleActionChange(action: string) {
		setCurrentAction(currentAction === action ? null : action);
	}

	function handleFilterUpdate() {
		if (!parsedPerPageInput) return;

		// Update applied filter states
		setAppliedAction(currentAction);
		setAppliedVariant(currentVariant);
		setAppliedRecipient(recipient);
		setAppliedFromAddress(fromAddress);
		setAppliedFromAddressIsProcess(fromAddressIsProcess);
		setAppliedStartDate(startDate);
		setAppliedEndDate(endDate);
		setPerPage(parsedPerPageInput.toString());
		setPerPageInput(parsedPerPageInput.toString());

		setToggleFilterChange((prev) => !prev);
		setShowFilters(false);
		handleClear();
	}

	function handleActionAdd() {
		flushSync(() => {
			const newActionOptions = [...actionOptions, customAction];
			setActionOptions(newActionOptions);
			handleActionChange(customAction);
			setCustomAction('');

			// Save custom actions to localStorage
			try {
				const defaultActions = Object.keys(DEFAULT_ACTIONS).map((action) => DEFAULT_ACTIONS[action].name);
				const customActionsOnly = newActionOptions.filter((action) => !defaultActions.includes(action));
				localStorage.setItem(STORAGE.customActions, JSON.stringify(customActionsOnly));
			} catch (e) {
				console.error('Failed to save custom actions:', e);
			}
		});
	}

	function handleActionRemove() {
		flushSync(() => {
			const newActionOptions = actionOptions.filter((action) => action !== currentAction);
			setActionOptions(newActionOptions);
			handleActionChange(currentAction);

			// Update custom actions in localStorage
			try {
				const defaultActions = Object.keys(DEFAULT_ACTIONS).map((action) => DEFAULT_ACTIONS[action].name);
				const customActionsOnly = newActionOptions.filter((action) => !defaultActions.includes(action));
				localStorage.setItem(STORAGE.customActions, JSON.stringify(customActionsOnly));
			} catch (e) {
				console.error('Failed to save custom actions:', e);
			}
		});
	}

	function getMessage() {
		const isTransactionView = props.type === 'wallet';
		let message: string = isTransactionView ? language.transactionsNotFound : language.associatedMessagesInfo;
		if (loadingMessages || props.willHaveResult) {
			message = `${isTransactionView ? language.transactionsLoading : language.associatedMessagesLoading}...`;
		}
		if (currentData?.length <= 0)
			message = isTransactionView ? language.transactionsNotFound : language.associatedMessagesNotFound;
		return (
			<S.UpdateWrapper childList={props.childList}>
				<p>{message}</p>
			</S.UpdateWrapper>
		);
	}

	function getPages() {
		const totalPages = getTotalPages();
		const activePerPage = parsedPerPage ?? 1;

		return (
			<>
				<p>
					{totalPages
						? `Page (${formatCount(pageNumber.toString())} of ${formatCount(totalPages.toString())})`
						: `Page (${formatCount(pageNumber.toString())})`}
				</p>
				<S.Divider />
				<p>{language.perPage(!showFilters ? formatCount(activePerPage.toString()) : '-')}</p>
			</>
		);
	}

	function getPaginator(showPages: boolean) {
		const paginationControlsDisabled = !canUsePaginationControls();

		return (
			<>
				<Button
					type={'alt3'}
					label={language.previous}
					handlePress={handlePrevious}
					disabled={cursorHistory.length === 0 || loadingMessages}
				/>
				{showPages && FLAGS.CONTROL_PAGINATION && (
					<S.DPageCounter>
						<PaginationControls
							pageInput={pageInput}
							perPageInput={perPageInput}
							totalPages={getTotalPages()}
							disabled={loadingMessages}
							pageDisabled={paginationControlsDisabled}
							perPageDisabled={paginationControlsDisabled}
							perPageSubmitDisabled={invalidPerPage}
							onPageInputChange={setPageInput}
							onPageSubmit={handlePageSubmit}
							onPerPageInputChange={setPerPageInput}
							onPerPageSubmit={handlePerPageSubmit}
						/>
					</S.DPageCounter>
				)}
				{showPages && !FLAGS.CONTROL_PAGINATION && <S.DPageCounter>{getPages()}</S.DPageCounter>}
				<Button
					type={'alt3'}
					label={language.next}
					handlePress={handleNext}
					disabled={!nextCursor || loadingMessages}
				/>
				{showPages && FLAGS.CONTROL_PAGINATION && (
					<S.MPageCounter>
						<PaginationControls
							pageInput={pageInput}
							perPageInput={perPageInput}
							totalPages={getTotalPages()}
							disabled={loadingMessages}
							pageDisabled={paginationControlsDisabled}
							perPageDisabled={paginationControlsDisabled}
							perPageSubmitDisabled={invalidPerPage}
							onPageInputChange={setPageInput}
							onPageSubmit={handlePageSubmit}
							onPerPageInputChange={setPerPageInput}
							onPerPageSubmit={handlePerPageSubmit}
						/>
					</S.MPageCounter>
				)}
				{showPages && !FLAGS.CONTROL_PAGINATION && <S.MPageCounter>{getPages()}</S.MPageCounter>}
			</>
		);
	}

	const customActionSelected = currentAction && actionOptions.some((action) => action === currentAction);
	const variantOptions = [null, MessageVariantEnum.Legacynet, MessageVariantEnum.Mainnet];
	const canExport = !props.childList && !props.result && (props.type !== 'message' || !props.txId);

	return (
		<>
			<S.Container ref={tableContainerRef}>
				{!props.childList && (
					<S.Header>
						<S.HeaderMain>
							<p>{props.header ?? (props.type === 'wallet' ? language.transactions : language.messages)}</p>
							{loadingMessages && (
								<div className={'loader'}>
									<Loader xSm relative />
								</div>
							)}
						</S.HeaderMain>
						{!props.result && (
							<S.HeaderActions className={'scroll-wrapper-hidden'}>
								{props.type && props.type !== 'message' && (
									<>
										<Button
											type={'alt3'}
											label={`${language.outgoing}${
												outgoingCount ? ` (${formatCount(outgoingCount.toString())})` : ''
											}`}
											handlePress={() => handleFilterChange('outgoing')}
											active={currentFilter === 'outgoing'}
											disabled={loadingMessages}
										/>
										<Button
											type={'alt3'}
											label={`${language.incoming}${
												incomingCount ? ` (${formatCount(incomingCount.toString())})` : ''
											}`}
											handlePress={() => handleFilterChange('incoming')}
											active={currentFilter === 'incoming'}
											disabled={loadingMessages}
										/>
										<S.Divider />
									</>
								)}
								<S.AppliedActionsWrapper className={'scroll-wrapper-hidden'}>
									{!hasAppliedFilters && (
										<Button type={'alt2'} label={'No Filters Applied'} handlePress={() => {}} disabled={true} noFocus />
									)}
									{appliedAction && (
										<Button
											type={'alt3'}
											label={`Action (${appliedAction})`}
											handlePress={() => {
												setCurrentAction(null);
												setAppliedAction(null);
												setToggleFilterChange((prev) => !prev);
												handleClear();
											}}
											active={true}
											disabled={loadingMessages}
											icon={ASSETS.close}
										/>
									)}
									{appliedVariant && (
										<Button
											type={'alt3'}
											label={`${language.variant} (${appliedVariant})`}
											handlePress={() => {
												setCurrentVariant(null);
												setAppliedVariant(null);
												setToggleFilterChange((prev) => !prev);
												handleClear();
											}}
											active={true}
											disabled={loadingMessages}
											icon={ASSETS.close}
										/>
									)}
									{appliedRecipient && checkValidAddress(appliedRecipient) && (
										<Button
											type={'alt3'}
											label={`To (${formatAddress(appliedRecipient, false)})`}
											handlePress={() => {
												setRecipient('');
												setAppliedRecipient('');
												setToggleFilterChange((prev) => !prev);
												handleClear();
											}}
											active={true}
											disabled={loadingMessages}
											icon={ASSETS.close}
										/>
									)}
									{appliedFromAddress && checkValidAddress(appliedFromAddress) && (
										<Button
											type={'alt3'}
											label={`From (${formatAddress(appliedFromAddress, false)})`}
											handlePress={() => {
												setFromAddress('');
												setAppliedFromAddress('');
												setAppliedFromAddressIsProcess(false);
												setToggleFilterChange((prev) => !prev);
												handleClear();
											}}
											active={true}
											disabled={loadingMessages}
											icon={ASSETS.close}
										/>
									)}
									{appliedStartDate && (
										<Button
											type={'alt3'}
											label={`Start (${
												appliedStartDate
													? `${appliedStartDate.month}-${appliedStartDate.day}-${appliedStartDate.year}`
													: '-'
											})`}
											handlePress={() => {
												setStartDate(null);
												setAppliedStartDate(null);
												setToggleFilterChange((prev) => !prev);
												handleClear();
											}}
											active={true}
											disabled={loadingMessages}
											icon={ASSETS.close}
										/>
									)}
									{appliedEndDate && (
										<Button
											type={'alt3'}
											label={`End (${
												appliedEndDate ? `${appliedEndDate.month}-${appliedEndDate.day}-${appliedEndDate.year}` : '-'
											})`}
											handlePress={() => {
												setEndDate(null);
												setAppliedEndDate(null);
												setToggleFilterChange((prev) => !prev);
												handleClear();
											}}
											active={true}
											disabled={loadingMessages}
											icon={ASSETS.close}
										/>
									)}
									{usingCustomPerPage && (
										<Button
											type={'alt3'}
											label={`${language.resultsPerPage} (${formatCount(parsedPerPage.toString())})`}
											handlePress={handlePerPageReset}
											active={true}
											disabled={loadingMessages}
											icon={ASSETS.close}
										/>
									)}
								</S.AppliedActionsWrapper>
								<S.Divider />
								<S.FilterWrapper>
									<Button
										type={'alt3'}
										label={language.filter}
										handlePress={() => setShowFilters((prev) => !prev)}
										active={showFilters}
										disabled={loadingMessages}
										icon={ASSETS.filter}
										iconLeftAlign
									/>
								</S.FilterWrapper>
								{canExport && (
									<Button
										type={'alt3'}
										label={language.download}
										handlePress={handleExport}
										disabled={loadingMessages || !currentData?.length}
										icon={ASSETS.save}
										iconLeftAlign
									/>
								)}
								<S.Divider />
								{getPaginator(false)}
							</S.HeaderActions>
						)}
					</S.Header>
				)}
				{currentData?.length > 0 ? (
					<S.Wrapper childList={props.childList}>
						{!props.childList && (
							<S.HeaderWrapper className={'fade-in'}>
								<S.ID>
									<p>{language.id}</p>
								</S.ID>
								<S.Type>
									<p>{language.type}</p>
								</S.Type>
								<S.Action>
									<p>{language.action}</p>
								</S.Action>
								<S.From>
									<p>{language.from}</p>
								</S.From>
								<S.To>
									<p>{language.to}</p>
								</S.To>

								<S.Input>
									<p>{language.input}</p>
								</S.Input>
								<S.Output>
									<p>{language.output}</p>
								</S.Output>
								<S.Time>
									<p>{language.time}</p>
								</S.Time>

								<S.Results>
									<p>{language.results}</p>
								</S.Results>
							</S.HeaderWrapper>
						)}
						<S.BodyWrapper
							childList={props.childList}
							isOverallLast={props.isOverallLast}
							$nestingLevel={props.nestingLevel}
							className={'fade-in'}
						>
							{currentData.map((element: any, index: number) => {
								const isLastChild = index === currentData.length - 1;

								return (
									<Message
										key={element.node.id || `message-${index}`}
										element={element}
										type={props.type}
										variant={getTagValue(element.node.tags, TAGS.keys.variant) as MessageVariantEnum}
										currentFilter={currentFilter}
										parentId={props.parentId}
										handleOpen={props.handleMessageOpen ? (id: string) => props.handleMessageOpen(id) : null}
										lastChild={isLastChild}
										isOverallLast={props.isOverallLast && isLastChild}
										showFilteredMessages={props.showFilteredMessages}
										childList={props.childList}
										nestingLevel={props.nestingLevel}
										showResultMessageLabel={props.showResultMessageLabel}
									/>
								);
							})}
						</S.BodyWrapper>
					</S.Wrapper>
				) : (
					getMessage()
				)}
				{!props.childList && <S.FooterWrapper>{getPaginator(true)}</S.FooterWrapper>}
			</S.Container>
			{!props.childList && showFilters && (
				<Modal type="panel" width={515} header={language.messageFilters} handleClose={() => setShowFilters(false)}>
					<S.FilterDropdown>
						<S.FilterDropdownHeader>
							<p>{language.filterByAction}</p>
						</S.FilterDropdownHeader>
						<S.FilterDropdownActionSelect>
							{actionOptions.map((action) => {
								return (
									<Button
										key={action}
										type={'primary'}
										label={action}
										handlePress={() => handleActionChange(action)}
										disabled={loadingMessages}
										active={currentAction === action}
										icon={currentAction === action ? ASSETS.close : null}
										height={40}
										fullWidth
									/>
								);
							})}
							<FormField
								label={language.customAction}
								value={customAction}
								onChange={(e: any) => setCustomAction(e.target.value)}
								disabled={loadingMessages}
								invalid={{ status: actionOptions.some((action) => action === customAction), message: null }}
								hideErrorMessage
							/>
							<Button
								type={customActionSelected ? 'primary' : 'alt1'}
								label={customActionSelected ? language.remove : language.submit}
								handlePress={() => (customActionSelected ? handleActionRemove() : handleActionAdd())}
								disabled={
									customActionSelected
										? false
										: !customAction || actionOptions.some((action) => action === customAction) || loadingMessages
								}
								active={false}
								height={40}
								fullWidth
							/>
						</S.FilterDropdownActionSelect>
						<S.FilterDivider />
						<S.FilterDropdownHeader>
							<p>{language.filterByVariant}</p>
						</S.FilterDropdownHeader>
						<S.FilterDropdownActionSelect>
							{variantOptions.map((variant) => {
								const optionId = variant ?? 'all';

								return (
									<Button
										key={optionId}
										type={'primary'}
										label={getVariantFilterLabel(variant)}
										handlePress={() => setCurrentVariant(currentVariant === variant ? null : variant)}
										disabled={loadingMessages}
										active={currentVariant === variant}
										icon={currentVariant === variant && variant ? ASSETS.close : null}
										height={40}
										fullWidth
									/>
								);
							})}
						</S.FilterDropdownActionSelect>
						<S.FilterDivider />
						{(currentFilter !== 'incoming' || !props.txId) && (
							<FormField
								label={language.recipient}
								value={recipient}
								onChange={(e: any) => setRecipient(e.target.value)}
								disabled={loadingMessages}
								invalid={{ status: recipient ? !checkValidAddress(recipient) : null, message: null }}
								hideErrorMessage
							/>
						)}

						{currentFilter === 'incoming' && props.txId && (
							<FormField
								label={language.from}
								value={fromAddress}
								onChange={(e: any) => setFromAddress(e.target.value)}
								disabled={loadingMessages}
								invalid={{ status: fromAddress ? !checkValidAddress(fromAddress) : null, message: null }}
								hideErrorMessage
							/>
						)}
						<S.FilterDivider />
						<S.FilterDropdownHeader>
							<p>{language.dateFilter}</p>
						</S.FilterDropdownHeader>
						<S.DateRangeWrapper>
							<S.DateRangeSection>
								<S.DateRangeHeader>
									<Button
										type={'primary'}
										label={startDate ? `${language.startDate}: ${formatDateLabel(startDate)}` : language.startDate}
										handlePress={() => setShowStartCalendar((prev) => !prev)}
										active={showStartCalendar}
										height={40}
										fullWidth
									/>
									{startDate && (
										<Button
											type={'alt3'}
											label={language.clear}
											handlePress={() => {
												setStartDate(null);
												setShowStartCalendar(false);
											}}
										/>
									)}
								</S.DateRangeHeader>
								{showStartCalendar && (
									<Calendar
										selectedDate={startDate}
										onDateSelect={(date) => {
											setStartDate(date);
											setShowStartCalendar(false);
										}}
									/>
								)}
							</S.DateRangeSection>
							<S.DateRangeSection>
								<S.DateRangeHeader>
									<Button
										type={'primary'}
										label={endDate ? `${language.endDate}: ${formatDateLabel(endDate)}` : language.endDate}
										handlePress={() => setShowEndCalendar((prev) => !prev)}
										active={showEndCalendar}
										height={40}
										fullWidth
									/>
									{endDate && (
										<Button
											type={'alt3'}
											label={language.clear}
											handlePress={() => {
												setEndDate(null);
												setShowEndCalendar(false);
											}}
										/>
									)}
								</S.DateRangeHeader>
								{showEndCalendar && (
									<Calendar
										selectedDate={endDate}
										onDateSelect={(date) => {
											setEndDate(date);
											setShowEndCalendar(false);
										}}
										minDate={startDate ? new Date(startDate.year, startDate.month - 1, startDate.day) : undefined}
									/>
								)}
							</S.DateRangeSection>
						</S.DateRangeWrapper>
						<S.FilterDivider />
						<FormField
							type={'number'}
							label={language.resultsPerPage}
							value={perPageInput}
							onChange={(e: any) => setPerPageInput(e.target.value)}
							disabled={loadingMessages}
							invalid={{ status: invalidPerPage, message: invalidPerPage ? language.valueGreaterThan0 : null }}
						/>
						{showLargeFetchWarning && (
							<S.FilterWarning>
								<p>{language.largeResultSetWarning}</p>
							</S.FilterWarning>
						)}
						<S.FilterApply>
							<Button
								type={'alt1'}
								label={language.applyFilters}
								handlePress={() => handleFilterUpdate()}
								disabled={invalidPerPage}
								active={false}
								height={42.5}
								fullWidth
							/>
						</S.FilterApply>
					</S.FilterDropdown>
				</Modal>
			)}
		</>
	);
}
