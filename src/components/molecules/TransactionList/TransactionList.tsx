import React from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from 'styled-components';

import {
	getTransactionsByBlock,
	getTransactionsByBundle,
	GQLEdge,
	isBundleTransaction,
	TransactionNode,
	TransactionTypeFilter,
} from 'api/blocks';

import { Button } from 'components/atoms/Button';
import { Loader } from 'components/atoms/Loader';
import { Modal } from 'components/atoms/Modal';
import { TransferAmount } from 'components/atoms/TransferAmount';
import { ExplorerLink, TxAddress } from 'components/atoms/TxAddress';
import { PaginationControls } from 'components/molecules/PaginationControls';
import { getBundlerLabel } from 'helpers/bundlers';
import { ASSETS, DEFAULT_ACTIONS, FLAGS, URLS } from 'helpers/config';
import { buildCsvFilename, downloadCsv, mapTransactionForCsv } from 'helpers/csv';
import { getSearchParam, updateSearchParams } from 'helpers/query';
import { searchTxById } from 'helpers/search';
import { formatCount, formatDate, getByteSizeDisplay, getTagValue, isNativeArTransfer } from 'helpers/utils';
import { useVisibleData } from 'hooks/useVisibleData';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { usePermawebProvider } from 'providers/PermawebProvider';
import { store } from 'store';

import * as FilterS from '../MessageList/styles';

import * as S from './styles';

const DEFAULT_TRANSACTIONS_PER_PAGE = 50;
const TYPE_FILTER_OPTIONS: TransactionTypeFilter[] = ['message', 'assignment', 'bundle', 'transaction'];
const TRANSACTION_QUERY_KEYS = {
	type: 'txType',
	limit: 'txLimit',
	after: 'txAfter',
	page: 'txPage',
};
const BUNDLE_TRANSACTION_QUERY_KEYS = {
	type: 'bundleTxType',
	limit: 'bundleTxLimit',
	after: 'bundleTxAfter',
	page: 'bundleTxPage',
};

function parsePositiveInteger(value: string | number) {
	const parsed = Number(value);

	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function isTransactionIdOnly(transaction: TransactionNode) {
	const populatedKeys = Object.keys(transaction).filter((key) => (transaction as any)[key] !== undefined);

	return populatedKeys.length === 1 && populatedKeys[0] === 'id';
}

function mapSearchResponseToTransaction(response: any): TransactionNode | null {
	const node = response?.node;
	if (!node?.id) return null;

	return {
		...node,
		tags: node.tags ?? [],
	};
}

function getTransactionTypeFilterValue(transaction: TransactionNode): TransactionTypeFilter {
	if (isBundleTransaction(transaction)) return 'bundle';

	const type = getTagValue(transaction.tags, 'Type')?.toLowerCase();
	if (type === 'message' || type === 'assignment') return type;

	return 'transaction';
}

function transactionMatchesTypeFilter(transaction: TransactionNode, typeFilter: TransactionTypeFilter | null) {
	if (!typeFilter) return true;

	return getTransactionTypeFilterValue(transaction) === typeFilter;
}

function normalizeTypeFilter(value: string | null): TransactionTypeFilter | null {
	if ((TYPE_FILTER_OPTIONS as string[]).includes(value ?? '')) return value as TransactionTypeFilter;

	return null;
}

function getTransactionQueryKeys(mode: 'block' | 'bundle') {
	return mode === 'bundle' ? BUNDLE_TRANSACTION_QUERY_KEYS : TRANSACTION_QUERY_KEYS;
}

function getTransactionQueryState(searchParams: URLSearchParams, queryKeys: typeof TRANSACTION_QUERY_KEYS) {
	const type = normalizeTypeFilter(getSearchParam(searchParams, queryKeys.type));
	const limit = parsePositiveInteger(getSearchParam(searchParams, queryKeys.limit) ?? '');
	const page = parsePositiveInteger(getSearchParam(searchParams, queryKeys.page) ?? '');
	const after = getSearchParam(searchParams, queryKeys.after);
	const hasQuery = Object.values(queryKeys).some((key) => searchParams.has(key));

	return {
		hasQuery: hasQuery,
		type: type,
		limit: limit,
		page: page,
		after: after,
	};
}

function getHashRouteSearch() {
	if (typeof window === 'undefined') return '';

	const searchIndex = window.location.hash.indexOf('?');

	return searchIndex >= 0 ? window.location.hash.slice(searchIndex) : '';
}

function getRouteSearch(locationSearch: string, searchParamString: string) {
	if (locationSearch) return locationSearch;
	if (searchParamString) return `?${searchParamString}`;

	return getHashRouteSearch();
}

function normalizePathname(pathname: string) {
	return pathname.replace(/\/+$/, '') || '/';
}

function shouldSyncTransactionQueryParams(args: {
	pathname: string;
	mode: 'block' | 'bundle';
	blockHeight?: number;
	blockId?: string;
	bundleId?: string;
}) {
	const parts = normalizePathname(args.pathname).split('/').filter(Boolean);
	if (parts[0] !== 'explorer') return false;

	const routeId = parts[1] ?? '';
	const subPath = parts.slice(2).join('/');
	if (subPath && subPath !== 'info') return false;

	if (args.mode === 'bundle') return !!args.bundleId && routeId === args.bundleId;

	return (
		(args.blockHeight !== undefined && routeId === args.blockHeight.toString()) ||
		(!!args.blockId && routeId === args.blockId)
	);
}

function isTransferTransaction(transaction: TransactionNode) {
	return getTagValue(transaction.tags, 'Action') === DEFAULT_ACTIONS.transfer.name || isNativeArTransfer(transaction);
}

function TransactionRow(props: { edge: GQLEdge<TransactionNode>; onHydrated: (transaction: TransactionNode) => void }) {
	const currentTheme: any = useTheme();
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const permawebProvider = usePermawebProvider();

	const needsHydration = isTransactionIdOnly(props.edge.node);
	const fetchTransaction = React.useCallback(async () => {
		const response = await searchTxById({
			txId: props.edge.node.id,
			getGQLData: permawebProvider.libs.getGQLData,
			store: store,
			dispatch: dispatch,
		});

		return mapSearchResponseToTransaction(response);
	}, [dispatch, permawebProvider.libs, props.edge.node.id]);
	const hydratedTransaction = useVisibleData<TransactionNode | null>({
		cacheKey: props.edge.node.id,
		enabled: needsHydration && !!permawebProvider.libs?.getGQLData,
		fetchData: fetchTransaction,
	});
	const transaction = hydratedTransaction.data ?? props.edge.node;
	const tags = transaction.tags ?? [];
	const transferTarget = transaction.recipient ?? getTagValue(tags, 'Target');
	const pendingHydration = needsHydration && !hydratedTransaction.loaded;
	const failedHydration = needsHydration && hydratedTransaction.loaded && !hydratedTransaction.data;
	const bundlerLabel = getBundlerLabel(transaction.owner?.address, tags);

	React.useEffect(() => {
		if (hydratedTransaction.data) {
			props.onHydrated(hydratedTransaction.data);
		}
	}, [hydratedTransaction.data, props.onHydrated]);

	React.useEffect(() => {
		if (hydratedTransaction.error) {
			console.error(hydratedTransaction.error);
		}
	}, [hydratedTransaction.error]);

	function handleRowClick() {
		navigate(`${URLS.explorer}${transaction.id}`);
	}

	function getPendingLabel() {
		return pendingHydration ? `${language.loading}...` : '-';
	}

	function getTransactionType(transaction: TransactionNode) {
		if (pendingHydration) return `${language.loading}...`;
		if (failedHydration) return '-';
		if (isBundleTransaction(transaction)) return language.bundle;
		if (isTransferTransaction(transaction)) return DEFAULT_ACTIONS.transfer.name;

		return getTagValue(transaction.tags, 'Type') ?? language.transaction;
	}

	function getTypeBackground(transaction: TransactionNode) {
		if (pendingHydration || failedHydration) return currentTheme.colors.container.alt8.background;
		if (isTransferTransaction(transaction)) return currentTheme.colors.actions.transfer;

		const type = getTransactionType(transaction);

		if (type === language.bundle) {
			return currentTheme.colors.actions.debitNotice;
		} else if (type === language.transaction) {
			return currentTheme.colors.actions.balance;
		} else {
			const tagType = getTagValue(tags, 'Type');
			if (tagType === 'Message') {
				return currentTheme.colors.actions.info;
			} else if (tagType === 'Process') {
				return currentTheme.colors.actions.eval;
			} else if (tagType === 'Assignment') {
				return currentTheme.colors.actions.other;
			}
			return currentTheme.colors.actions.other;
		}
	}

	function getSize(transaction: TransactionNode) {
		if (pendingHydration) return `${language.loading}...`;

		const size = Number(transaction.data?.size);

		return Number.isFinite(size) ? getByteSizeDisplay(size) : '-';
	}

	return (
		<S.ElementWrapper ref={hydratedTransaction.ref} className={'transaction-list-element'} onClick={handleRowClick}>
			<S.ID title={transaction.id}>
				<S.LinkLabel>
					<ExplorerLink value={transaction.id} type={'transaction'} />
				</S.LinkLabel>
			</S.ID>
			<S.TypeValue background={getTypeBackground(transaction)}>
				<div className={'type-indicator'} />
				<p>{getTransactionType(transaction)}</p>
				<TransferAmount tags={tags} target={transferTarget} quantity={transaction.quantity} />
			</S.TypeValue>
			<S.Owner>
				{transaction.owner?.address ? (
					<S.LabeledAddress>
						<TxAddress address={transaction.owner.address} />
						{bundlerLabel && <S.AddressLabel>{bundlerLabel}</S.AddressLabel>}
					</S.LabeledAddress>
				) : (
					<p>{getPendingLabel()}</p>
				)}
			</S.Owner>
			<S.Recipient>
				{transaction.recipient ? (
					<TxAddress address={transaction.recipient} />
				) : (
					<p>{pendingHydration ? `${language.loading}...` : 'No Recipient'}</p>
				)}
			</S.Recipient>
			<S.Size>
				<p>{getSize(transaction)}</p>
			</S.Size>
			<S.Time>
				<p>
					{transaction.block?.timestamp
						? formatDate(transaction.block.timestamp * 1000, 'timestamp', true)
						: getPendingLabel()}
				</p>
			</S.Time>
		</S.ElementWrapper>
	);
}

export default function TransactionList(props: {
	mode: 'block' | 'bundle';
	blockHeight?: number;
	blockId?: string;
	bundleId?: string;
	header?: string;
	onTotalCountChange?: (count: number | null) => void;
}) {
	const location = useLocation();
	const [searchParams, setSearchParams] = useSearchParams();
	const dispatch = useDispatch();
	const permawebProvider = usePermawebProvider();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const tableContainerRef = React.useRef<HTMLDivElement | null>(null);
	const transactionQueryKeys = React.useMemo(() => getTransactionQueryKeys(props.mode), [props.mode]);
	const searchParamString = searchParams.toString();
	const routeSearch = React.useMemo(
		() => getRouteSearch(location.search, searchParamString),
		[location.search, searchParamString]
	);
	const routeSearchParams = React.useMemo(() => new URLSearchParams(routeSearch), [routeSearch]);
	const queryFilterState = React.useMemo(
		() => getTransactionQueryState(routeSearchParams, transactionQueryKeys),
		[routeSearchParams, transactionQueryKeys]
	);
	const syncQueryParams = React.useMemo(
		() =>
			shouldSyncTransactionQueryParams({
				pathname: location.pathname,
				mode: props.mode,
				blockHeight: props.blockHeight,
				blockId: props.blockId,
				bundleId: props.bundleId,
			}),
		[location.pathname, props.mode, props.blockHeight, props.blockId, props.bundleId]
	);
	const skipNextQueryWriteRef = React.useRef<boolean>(syncQueryParams && queryFilterState.hasQuery);
	const dataScopeKey = React.useMemo(() => {
		if (props.mode === 'bundle') return `bundle:${props.bundleId ?? ''}`;

		return `block:${props.blockHeight ?? props.blockId ?? ''}`;
	}, [props.mode, props.blockHeight, props.blockId, props.bundleId]);
	const previousDataScopeKeyRef = React.useRef<string>(dataScopeKey);

	const [transactions, setTransactions] = React.useState<GQLEdge<TransactionNode>[]>([]);
	const [loading, setLoading] = React.useState<boolean>(true);
	const [error, setError] = React.useState<string | null>(null);
	const [pageCursor, setPageCursor] = React.useState<string | null>(queryFilterState.after ?? null);
	const [nextCursor, setNextCursor] = React.useState<string | null>(null);
	const [cursorHistory, setCursorHistory] = React.useState<(string | null)[]>([]);
	const [pageNumber, setPageNumber] = React.useState<number>(queryFilterState.page ?? 1);
	const [pageInput, setPageInput] = React.useState<string>((queryFilterState.page ?? 1).toString());
	const [perPage, setPerPage] = React.useState<number>(queryFilterState.limit ?? DEFAULT_TRANSACTIONS_PER_PAGE);
	const [perPageInput, setPerPageInput] = React.useState<string>(
		(queryFilterState.limit ?? DEFAULT_TRANSACTIONS_PER_PAGE).toString()
	);
	const [totalCount, setTotalCount] = React.useState<number | null>(null);
	const [showFilters, setShowFilters] = React.useState<boolean>(false);
	const [typeFilter, setTypeFilter] = React.useState<TransactionTypeFilter | null>(queryFilterState.type ?? null);
	const [activeTypeFilter, setActiveTypeFilter] = React.useState<TransactionTypeFilter | null>(
		queryFilterState.type ?? null
	);
	const totalPages = totalCount !== null ? Math.max(1, Math.ceil(totalCount / perPage)) : null;
	const needsClientTypeFilter = !!activeTypeFilter && (props.mode === 'bundle' || activeTypeFilter === 'transaction');

	const canLoad = props.mode === 'block' ? props.blockHeight !== undefined || !!props.blockId : !!props.bundleId;

	const fetchTransactionsPage = React.useCallback(
		async (after: string | null) => {
			return props.mode === 'block'
				? await getTransactionsByBlock({
						blockHeight: props.blockHeight,
						blockId: props.blockId,
						first: perPage,
						after: after,
						typeFilter: activeTypeFilter,
				  })
				: await getTransactionsByBundle({
						bundleId: props.bundleId,
						first: perPage,
						after: after,
						typeFilter: activeTypeFilter,
						includeCount: !!props.onTotalCountChange || !after,
				  });
		},
		[props.mode, props.blockHeight, props.blockId, props.bundleId, props.onTotalCountChange, perPage, activeTypeFilter]
	);

	const hydrateTransactionForFilter = React.useCallback(
		async (transaction: TransactionNode) => {
			if (!isTransactionIdOnly(transaction)) return transaction;
			if (!permawebProvider.libs?.getGQLData) return null;

			const response = await searchTxById({
				txId: transaction.id,
				getGQLData: permawebProvider.libs.getGQLData,
				store: store,
				dispatch: dispatch,
			});

			return mapSearchResponseToTransaction(response);
		},
		[dispatch, permawebProvider.libs]
	);

	React.useEffect(() => {
		setPageInput(pageNumber.toString());
	}, [pageNumber]);

	React.useEffect(() => {
		if (previousDataScopeKeyRef.current === dataScopeKey) return;

		previousDataScopeKeyRef.current = dataScopeKey;
		skipNextQueryWriteRef.current = true;

		setTransactions([]);
		setTotalCount(null);
		setError(null);
		setCursorHistory([]);
		setPageCursor(null);
		setNextCursor(null);
		setPageNumber(1);
	}, [dataScopeKey]);

	React.useEffect(() => {
		if (!syncQueryParams || !queryFilterState.hasQuery) return;

		skipNextQueryWriteRef.current = true;

		const nextPerPage = queryFilterState.limit ?? DEFAULT_TRANSACTIONS_PER_PAGE;
		const nextPage = queryFilterState.page ?? 1;

		setTypeFilter(queryFilterState.type ?? null);
		setActiveTypeFilter(queryFilterState.type ?? null);
		setPerPage(nextPerPage);
		setPerPageInput(nextPerPage.toString());
		setPageCursor(queryFilterState.after ?? null);
		setPageNumber(nextPage);
	}, [queryFilterState, syncQueryParams]);

	React.useEffect(() => {
		if (!syncQueryParams) return;
		if (skipNextQueryWriteRef.current) {
			skipNextQueryWriteRef.current = false;
			return;
		}

		updateSearchParams(routeSearchParams, setSearchParams, {
			[transactionQueryKeys.type]: activeTypeFilter,
			[transactionQueryKeys.limit]: perPage !== DEFAULT_TRANSACTIONS_PER_PAGE ? perPage : null,
			[transactionQueryKeys.after]: pageCursor,
			[transactionQueryKeys.page]: pageNumber > 1 ? pageNumber : null,
		});
	}, [
		activeTypeFilter,
		pageCursor,
		pageNumber,
		perPage,
		routeSearchParams,
		setSearchParams,
		syncQueryParams,
		transactionQueryKeys,
	]);

	React.useEffect(() => {
		let cancelled = false;

		(async function () {
			if (!canLoad) {
				setTransactions([]);
				setLoading(false);
				props.onTotalCountChange?.(null);
				return;
			}

			setLoading(true);

			try {
				const response = await fetchTransactionsPage(pageCursor);

				if (!cancelled) {
					let edges = response.transactions.edges;

					if (needsClientTypeFilter) {
						const hydratedEdges = await Promise.all(
							edges.map(async (edge) => {
								try {
									const hydratedTransaction = await hydrateTransactionForFilter(edge.node);

									return hydratedTransaction
										? {
												...edge,
												node: hydratedTransaction,
										  }
										: null;
								} catch (e: any) {
									console.error(e);
									return null;
								}
							})
						);

						if (cancelled) return;

						edges = hydratedEdges
							.filter((edge): edge is GQLEdge<TransactionNode> => !!edge)
							.filter((edge) => transactionMatchesTypeFilter(edge.node, activeTypeFilter));
					}

					const lastEdge = response.transactions.edges[response.transactions.edges.length - 1];

					setTransactions(edges);
					setNextCursor(response.transactions.pageInfo.hasNextPage ? lastEdge?.cursor ?? null : null);
					if (response.transactions.count !== undefined) {
						props.onTotalCountChange?.(response.transactions.count ?? null);
						setTotalCount(needsClientTypeFilter ? null : response.transactions.count ?? null);
					} else if (!pageCursor || props.onTotalCountChange) {
						setTotalCount(null);
						props.onTotalCountChange?.(null);
					}
					setError(null);
				}
			} catch (e: any) {
				console.error(e);

				if (!cancelled) {
					setTransactions([]);
					setNextCursor(null);
					setTotalCount(null);
					props.onTotalCountChange?.(null);
					setError(language.errorFetchingData);
				}
			}

			if (!cancelled) {
				setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [
		activeTypeFilter,
		canLoad,
		hydrateTransactionForFilter,
		needsClientTypeFilter,
		pageCursor,
		fetchTransactionsPage,
		language.errorFetchingData,
		props.onTotalCountChange,
	]);

	const scrollToTop = React.useCallback(() => {
		if (tableContainerRef.current) {
			setTimeout(() => {
				tableContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}, 10);
		}
	}, []);

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

	async function handlePageSubmit() {
		const parsedPage = parsePositiveInteger(pageInput);
		if (!parsedPage || !canLoad || loading) {
			setPageInput(pageNumber.toString());
			return;
		}

		const targetPage = totalPages ? Math.min(parsedPage, totalPages) : parsedPage;
		setPageInput(targetPage.toString());
		if (targetPage === pageNumber) return;

		if (targetPage === 1) {
			setCursorHistory([]);
			setPageCursor(null);
			setPageNumber(1);
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

		setLoading(true);
		try {
			let cursor: string | null = null;
			const nextHistory: (string | null)[] = [];

			for (let page = 1; page < targetPage; page++) {
				nextHistory.push(cursor);
				const response = await fetchTransactionsPage(cursor);
				const lastEdge = response.transactions.edges[response.transactions.edges.length - 1];

				if (!response.transactions.pageInfo.hasNextPage || !lastEdge) {
					setPageInput(pageNumber.toString());
					return;
				}

				cursor = lastEdge.cursor;
			}

			setCursorHistory(nextHistory);
			setPageCursor(cursor);
			setPageNumber(targetPage);
			scrollToTop();
		} catch (e: any) {
			console.error(e);
			setPageInput(pageNumber.toString());
			setError(language.errorFetchingData);
		} finally {
			setLoading(false);
		}
	}

	function handlePerPageSubmit() {
		const parsedPerPage = parsePositiveInteger(perPageInput);
		if (!parsedPerPage) {
			setPerPageInput(perPage.toString());
			return;
		}

		setPerPage(parsedPerPage);
		setPerPageInput(parsedPerPage.toString());
		setCursorHistory([]);
		setPageCursor(null);
		setNextCursor(null);
		setPageNumber(1);
		scrollToTop();
	}

	function resetPagination() {
		setCursorHistory([]);
		setPageCursor(null);
		setNextCursor(null);
		setPageNumber(1);
	}

	function getTypeFilterLabel(value: TransactionTypeFilter) {
		switch (value) {
			case 'message':
				return language.message;
			case 'assignment':
				return language.assignment;
			case 'bundle':
				return language.bundle;
			case 'transaction':
				return language.transaction;
		}
	}

	function handleApplyTypeFilter() {
		setActiveTypeFilter(typeFilter);
		resetPagination();
		setShowFilters(false);
		scrollToTop();
	}

	function handleClearTypeFilter() {
		setTypeFilter(null);
		setActiveTypeFilter(null);
		resetPagination();
		scrollToTop();
	}

	function handleExport() {
		const csvRows = transactions.map(mapTransactionForCsv);

		if (csvRows.length <= 0) return;

		const scope =
			props.mode === 'block'
				? props.blockHeight !== undefined
					? `block-height-${props.blockHeight}`
					: props.blockId
					? `block-${props.blockId}`
					: 'block'
				: props.bundleId
				? `bundle-${props.bundleId}`
				: 'bundle';

		downloadCsv(buildCsvFilename(['transactions', scope, `page-${pageNumber}`, `limit-${perPage}`]), csvRows);
	}

	const handleTransactionHydrated = React.useCallback((transaction: TransactionNode) => {
		setTransactions((currentTransactions) =>
			currentTransactions.map((edge) =>
				edge.node.id === transaction.id
					? {
							...edge,
							node: transaction,
					  }
					: edge
			)
		);
	}, []);

	function getPages() {
		return (
			<>
				<p>
					{totalPages
						? `Page (${formatCount(pageNumber.toString())} of ${formatCount(totalPages.toString())})`
						: `Page (${formatCount(pageNumber.toString())})`}
				</p>
				<S.Divider />
				<p>{language.perPage(perPage)}</p>
			</>
		);
	}

	function getMessage() {
		let message = language.transactionsNotFound;
		if (loading) message = `${language.transactionsLoading}...`;
		if (error) message = error;

		return (
			<S.UpdateWrapper>
				<p>{message}</p>
			</S.UpdateWrapper>
		);
	}

	function getPaginator(showPages: boolean) {
		return (
			<>
				<Button
					type={'alt3'}
					label={language.previous}
					handlePress={handlePrevious}
					disabled={cursorHistory.length === 0 || loading}
				/>
				{showPages && FLAGS.CONTROL_PAGINATION && (
					<S.DPageCounter>
						<PaginationControls
							pageInput={pageInput}
							perPageInput={perPageInput}
							totalPages={totalPages}
							disabled={loading}
							onPageInputChange={setPageInput}
							onPageSubmit={handlePageSubmit}
							onPerPageInputChange={setPerPageInput}
							onPerPageSubmit={handlePerPageSubmit}
						/>
					</S.DPageCounter>
				)}
				{showPages && !FLAGS.CONTROL_PAGINATION && <S.DPageCounter>{getPages()}</S.DPageCounter>}
				<Button type={'alt3'} label={language.next} handlePress={handleNext} disabled={!nextCursor || loading} />
				{showPages && FLAGS.CONTROL_PAGINATION && (
					<S.MPageCounter>
						<PaginationControls
							pageInput={pageInput}
							perPageInput={perPageInput}
							totalPages={totalPages}
							disabled={loading}
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

	return (
		<>
			<S.Container ref={tableContainerRef}>
				<S.Header>
					<S.HeaderMain>
						<p>{props.header ?? language.transactions}</p>
						{loading && (
							<div className={'loader'}>
								<Loader xSm relative />
							</div>
						)}
					</S.HeaderMain>
					<S.HeaderActions className={'scroll-wrapper-hidden'}>
						{activeTypeFilter && (
							<Button
								type={'alt3'}
								label={`${language.type} (${getTypeFilterLabel(activeTypeFilter)})`}
								handlePress={handleClearTypeFilter}
								active={true}
								disabled={loading}
								icon={ASSETS.close}
							/>
						)}
						<FilterS.FilterWrapper>
							<Button
								type={'alt3'}
								label={language.filter}
								handlePress={() => setShowFilters((prev) => !prev)}
								active={showFilters}
								disabled={loading}
								icon={ASSETS.filter}
								iconLeftAlign
							/>
						</FilterS.FilterWrapper>
						<S.Divider />
						<Button
							type={'alt3'}
							label={language.download}
							handlePress={handleExport}
							disabled={loading || transactions.length <= 0}
							icon={ASSETS.save}
							iconLeftAlign
						/>
						<S.Divider />
						{getPaginator(false)}
					</S.HeaderActions>
				</S.Header>
				{transactions.length > 0 ? (
					<S.Wrapper>
						<S.HeaderWrapper className={'fade-in'}>
							<S.ID>
								<p>{language.id}</p>
							</S.ID>
							<S.Type>
								<p>{language.type}</p>
							</S.Type>
							<S.Owner>
								<p>{language.owner}</p>
							</S.Owner>
							<S.Recipient>
								<p>{language.recipient}</p>
							</S.Recipient>
							<S.Size>
								<p>{language.size}</p>
							</S.Size>
							<S.Time>
								<p>{language.time}</p>
							</S.Time>
						</S.HeaderWrapper>
						<S.BodyWrapper className={'fade-in'}>
							{transactions.map((edge) => (
								<TransactionRow key={edge.node.id} edge={edge} onHydrated={handleTransactionHydrated} />
							))}
						</S.BodyWrapper>
					</S.Wrapper>
				) : (
					getMessage()
				)}
				<S.FooterWrapper>{getPaginator(true)}</S.FooterWrapper>
			</S.Container>
			{showFilters && (
				<Modal type="panel" width={515} header={language.transactionFilters} handleClose={() => setShowFilters(false)}>
					<FilterS.FilterDropdown>
						<FilterS.FilterDropdownHeader>
							<p>{language.filterByType}</p>
						</FilterS.FilterDropdownHeader>
						<FilterS.FilterDropdownActionSelect>
							<Button
								type={'primary'}
								label={language.all}
								handlePress={() => setTypeFilter(null)}
								disabled={loading}
								active={typeFilter === null}
								height={40}
								fullWidth
							/>
							{TYPE_FILTER_OPTIONS.map((option) => (
								<Button
									key={option}
									type={'primary'}
									label={getTypeFilterLabel(option)}
									handlePress={() => setTypeFilter(typeFilter === option ? null : option)}
									disabled={loading}
									active={typeFilter === option}
									icon={typeFilter === option ? ASSETS.close : null}
									height={40}
									fullWidth
								/>
							))}
						</FilterS.FilterDropdownActionSelect>
						<FilterS.FilterApply>
							<Button
								type={'alt1'}
								label={language.applyFilters}
								handlePress={handleApplyTypeFilter}
								disabled={loading}
								active={false}
								height={42.5}
								fullWidth
							/>
						</FilterS.FilterApply>
					</FilterS.FilterDropdown>
				</Modal>
			)}
		</>
	);
}
