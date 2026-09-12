import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { BlockMetadata, BlockNode, getBlockMetadataByHeight, getBlocks, GQLEdge } from 'api/blocks';

import { Button } from 'components/atoms/Button';
import { FormField } from 'components/atoms/FormField';
import { Loader } from 'components/atoms/Loader';
import { Modal } from 'components/atoms/Modal';
import { ExplorerLink, TxAddress } from 'components/atoms/TxAddress';
import { PaginationControls } from 'components/molecules/PaginationControls';
import { ASSETS, FLAGS, STORAGE, URLS } from 'helpers/config';
import { buildCsvFilename, downloadCsv, mapBlockForCsv } from 'helpers/csv';
import { getSearchParam, updateSearchParams } from 'helpers/query';
import {
	checkValidAddress,
	formatBlockId,
	formatCount,
	formatDate,
	getByteSizeDisplay,
	getRelativeDate,
} from 'helpers/utils';
import { useVisibleData } from 'hooks/useVisibleData';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as FilterS from '../MessageList/styles';

import * as S from './styles';

const DEFAULT_BLOCKS_PER_PAGE = 50;
const BLOCK_QUERY_KEYS = {
	minHeight: 'blockMinHeight',
	maxHeight: 'blockMaxHeight',
	limit: 'blockLimit',
	after: 'blockAfter',
	page: 'blockPage',
};

export type BlockListEdge = GQLEdge<
	BlockNode & {
		metadata?: BlockMetadata | null;
		transactionCount?: number;
	}
>;

function parseHeightInput(value: string | number | null | undefined) {
	const trimmed = value?.toString().trim() ?? '';
	if (!trimmed) return null;

	const parsed = Number(trimmed);

	return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function parsePositiveInteger(value: string | number) {
	const parsed = Number(value);

	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getStoredBlockFilterState() {
	try {
		const saved = localStorage.getItem(STORAGE.blockFilters);
		if (!saved) return null;

		const parsed = JSON.parse(saved);
		const minHeight = parseHeightInput(parsed.minHeight);
		const maxHeight = parseHeightInput(parsed.maxHeight);

		return {
			minHeight: minHeight,
			maxHeight: maxHeight,
			minHeightInput: minHeight !== null ? minHeight.toString() : '',
			maxHeightInput: maxHeight !== null ? maxHeight.toString() : '',
		};
	} catch (e) {
		console.error('Failed to load block filters:', e);
		return null;
	}
}

function getBlockQueryState(searchParams: URLSearchParams) {
	const minHeight = parseHeightInput(getSearchParam(searchParams, BLOCK_QUERY_KEYS.minHeight));
	const maxHeight = parseHeightInput(getSearchParam(searchParams, BLOCK_QUERY_KEYS.maxHeight));
	const limit = parsePositiveInteger(getSearchParam(searchParams, BLOCK_QUERY_KEYS.limit) ?? '');
	const page = parsePositiveInteger(getSearchParam(searchParams, BLOCK_QUERY_KEYS.page) ?? '');
	const after = getSearchParam(searchParams, BLOCK_QUERY_KEYS.after);
	const hasQuery =
		searchParams.has(BLOCK_QUERY_KEYS.minHeight) ||
		searchParams.has(BLOCK_QUERY_KEYS.maxHeight) ||
		searchParams.has(BLOCK_QUERY_KEYS.limit) ||
		searchParams.has(BLOCK_QUERY_KEYS.after) ||
		searchParams.has(BLOCK_QUERY_KEYS.page);

	return {
		hasQuery: hasQuery,
		minHeight: minHeight,
		maxHeight: maxHeight,
		minHeightInput: minHeight !== null ? minHeight.toString() : '',
		maxHeightInput: maxHeight !== null ? maxHeight.toString() : '',
		limit: limit,
		after: after,
		page: page,
	};
}

function BlockRow(props: {
	edge: BlockListEdge;
	onMetadataLoaded: (height: number, metadata: BlockMetadata | null) => void;
	supplied?: boolean;
	preview?: boolean;
}) {
	const navigate = useNavigate();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const shouldLoadMetadata = !props.supplied && props.edge.node.metadata === undefined;
	const blockLinkValue = props.supplied ? props.edge.node.id : props.edge.node.height;
	const fetchMetadata = React.useCallback(
		() => getBlockMetadataByHeight(props.edge.node.height),
		[props.edge.node.height]
	);
	const metadataResponse = useVisibleData<BlockMetadata>({
		cacheKey: props.edge.node.height,
		enabled: shouldLoadMetadata,
		fetchData: fetchMetadata,
	});
	const metadata =
		props.edge.node.metadata !== undefined ? props.edge.node.metadata : metadataResponse.data ?? undefined;
	const metadataPending = metadata === undefined;
	const blockId = metadata?.indep_hash ?? props.edge.node.id;
	const previous = metadata?.previous_block ?? props.edge.node.previous;
	const blockSizeValue = metadata?.block_size?.toString?.() ?? null;
	const blockSize = blockSizeValue ? Number(blockSizeValue) : null;
	const miner = metadata?.reward_addr ?? metadata?.miner ?? null;
	const txs = metadata?.txs;
	const txCount = props.edge.node.transactionCount ?? (Array.isArray(txs) ? txs.length : null);
	const timestamp = metadata?.timestamp ?? props.edge.node.timestamp;

	React.useEffect(() => {
		if (metadataResponse.data) {
			props.onMetadataLoaded(props.edge.node.height, metadataResponse.data);
		}
	}, [metadataResponse.data, props.edge.node.height, props.onMetadataLoaded]);

	React.useEffect(() => {
		if (metadataResponse.error) {
			console.error(metadataResponse.error);
			props.onMetadataLoaded(props.edge.node.height, null);
		}
	}, [metadataResponse.error, props.edge.node.height, props.onMetadataLoaded]);

	function handleRowClick() {
		navigate(`${URLS.explorer}${blockLinkValue}`);
	}

	return (
		<S.ElementWrapper
			ref={metadataResponse.ref}
			className={'block-list-element'}
			onClick={handleRowClick}
			$preview={props.preview}
		>
			<S.Height $preview={props.preview}>
				<ExplorerLink
					value={blockLinkValue}
					label={props.supplied ? formatCount(props.edge.node.height.toString()) : undefined}
					type={'block'}
					tooltipPosition={'right'}
				/>
			</S.Height>
			<S.ID title={blockId} $preview={props.preview}>
				<ExplorerLink value={blockId} label={formatBlockId(blockId, false)} tooltipPosition={'right'} />
			</S.ID>
			{!props.preview && (
				<>
					<S.Previous title={previous}>
						<ExplorerLink value={previous} label={formatBlockId(previous, false)} tooltipPosition={'right'} />
					</S.Previous>
					<S.Miner title={miner ?? undefined}>
						{miner ? (
							checkValidAddress(miner) ? (
								<TxAddress address={miner} tooltipPosition={'right'} />
							) : (
								<p>{miner}</p>
							)
						) : (
							<p>-</p>
						)}
					</S.Miner>
					<S.Size title={blockSizeValue ?? undefined}>
						<p>{blockSize !== null && Number.isFinite(blockSize) ? getByteSizeDisplay(blockSize) : '-'}</p>
					</S.Size>
				</>
			)}
			<S.Transactions $preview={props.preview}>
				<p>{metadataPending ? `${language.loading}...` : txCount !== null ? formatCount(txCount.toString()) : '-'}</p>
			</S.Transactions>
			<S.Time $preview={props.preview}>
				<p>{props.preview ? getRelativeDate(timestamp * 1000) : formatDate(timestamp * 1000, 'timestamp', true)}</p>
			</S.Time>
		</S.ElementWrapper>
	);
}

export default function BlockList(props: {
	header?: string;
	embedded?: boolean;
	pageSize?: number;
	preview?: boolean;
	source?: {
		edges: BlockListEdge[];
		loading: boolean;
		loadingMessage?: string;
		onRefresh: () => void;
		pagination?: (showCounter: boolean) => React.ReactNode;
	};
}) {
	const hasSource = props.source !== undefined;
	const [searchParams, setSearchParams] = useSearchParams();
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const tableContainerRef = React.useRef<HTMLDivElement | null>(null);
	const queryFilterState = React.useMemo(
		() =>
			props.preview || hasSource
				? {
						hasQuery: false,
						minHeight: null,
						maxHeight: null,
						minHeightInput: '',
						maxHeightInput: '',
						limit: null,
						after: null,
						page: null,
				  }
				: getBlockQueryState(searchParams),
		[props.preview, hasSource, searchParams]
	);
	const loadedFilterState = React.useMemo(
		() => (props.preview || hasSource ? null : getStoredBlockFilterState()),
		[props.preview, hasSource]
	);
	const initialFilterState = queryFilterState.hasQuery ? queryFilterState : loadedFilterState;

	const [loadedBlocks, setBlocks] = React.useState<BlockListEdge[]>([]);
	const [internalLoading, setLoading] = React.useState<boolean>(true);
	const blocks = props.source?.edges ?? loadedBlocks;
	const loading = props.source?.loading ?? internalLoading;
	const [error, setError] = React.useState<string | null>(null);
	const [pageCursor, setPageCursor] = React.useState<string | null>(queryFilterState.after ?? null);
	const [nextCursor, setNextCursor] = React.useState<string | null>(null);
	const [cursorHistory, setCursorHistory] = React.useState<(string | null)[]>([]);
	const [pageNumber, setPageNumber] = React.useState<number>(queryFilterState.page ?? 1);
	const [pageInput, setPageInput] = React.useState<string>((queryFilterState.page ?? 1).toString());
	const [perPage, setPerPage] = React.useState<number>(
		props.pageSize ?? queryFilterState.limit ?? DEFAULT_BLOCKS_PER_PAGE
	);
	const [perPageInput, setPerPageInput] = React.useState<string>(
		(props.pageSize ?? queryFilterState.limit ?? DEFAULT_BLOCKS_PER_PAGE).toString()
	);
	const [totalCount, setTotalCount] = React.useState<number | null>(null);
	const [refreshTrigger, setRefreshTrigger] = React.useState<boolean>(false);
	const [showFilters, setShowFilters] = React.useState<boolean>(false);
	const [minHeightInput, setMinHeightInput] = React.useState<string>(initialFilterState?.minHeightInput ?? '');
	const [maxHeightInput, setMaxHeightInput] = React.useState<string>(initialFilterState?.maxHeightInput ?? '');
	const [activeRange, setActiveRange] = React.useState<{ minHeight: number | null; maxHeight: number | null }>({
		minHeight: initialFilterState?.minHeight ?? null,
		maxHeight: initialFilterState?.maxHeight ?? null,
	});

	const parsedMinHeight = parseHeightInput(minHeightInput);
	const parsedMaxHeight = parseHeightInput(maxHeightInput);
	const invalidMinHeight = !!minHeightInput.trim() && parsedMinHeight === null;
	const invalidMaxHeight = !!maxHeightInput.trim() && parsedMaxHeight === null;
	const invalidRange = parsedMinHeight !== null && parsedMaxHeight !== null && parsedMinHeight > parsedMaxHeight;
	const totalPages = totalCount !== null ? Math.max(1, Math.ceil(totalCount / perPage)) : null;

	const fetchBlocksPage = React.useCallback(
		(after: string | null) =>
			getBlocks({
				first: perPage,
				after: after,
				minHeight: activeRange.minHeight,
				maxHeight: activeRange.maxHeight,
			}),
		[activeRange.minHeight, activeRange.maxHeight, perPage]
	);

	React.useEffect(() => {
		setPageInput(pageNumber.toString());
	}, [pageNumber]);

	React.useEffect(() => {
		if (props.preview || hasSource) return;

		updateSearchParams(searchParams, setSearchParams, {
			[BLOCK_QUERY_KEYS.minHeight]: activeRange.minHeight,
			[BLOCK_QUERY_KEYS.maxHeight]: activeRange.maxHeight,
			[BLOCK_QUERY_KEYS.limit]: perPage !== DEFAULT_BLOCKS_PER_PAGE ? perPage : null,
			[BLOCK_QUERY_KEYS.after]: pageCursor,
			[BLOCK_QUERY_KEYS.page]: pageNumber > 1 ? pageNumber : null,
		});
	}, [
		activeRange.minHeight,
		activeRange.maxHeight,
		pageCursor,
		pageNumber,
		perPage,
		props.preview,
		hasSource,
		searchParams,
		setSearchParams,
	]);

	React.useEffect(() => {
		if (props.preview || hasSource) return;

		try {
			localStorage.setItem(
				STORAGE.blockFilters,
				JSON.stringify({
					minHeight: activeRange.minHeight,
					maxHeight: activeRange.maxHeight,
				})
			);
		} catch (e) {
			console.error('Failed to save block filters:', e);
		}
	}, [activeRange.minHeight, activeRange.maxHeight, props.preview, hasSource]);

	React.useEffect(() => {
		if (hasSource) return;
		let cancelled = false;

		(async function () {
			setLoading(true);

			try {
				const response = await fetchBlocksPage(pageCursor);

				if (!cancelled) {
					const visibleEdges = response.blocks.edges.map((edge) => ({
						...edge,
						node: {
							...edge.node,
							metadata: undefined,
						},
					}));
					const lastEdge = visibleEdges[visibleEdges.length - 1];

					setBlocks(visibleEdges);
					setNextCursor(response.blocks.pageInfo.hasNextPage ? lastEdge?.cursor ?? null : null);
					setTotalCount(response.blocks.count ?? null);
					setError(null);
				}
			} catch (e: any) {
				console.error(e);

				if (!cancelled) {
					setBlocks([]);
					setNextCursor(null);
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
	}, [hasSource, pageCursor, refreshTrigger, fetchBlocksPage, language.errorFetchingData]);

	function resetPagination() {
		setPageCursor(null);
		setNextCursor(null);
		setCursorHistory([]);
		setPageNumber(1);
	}

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

	function handleRefresh() {
		setRefreshTrigger((prev) => !prev);
	}

	async function handlePageSubmit() {
		const parsedPage = parsePositiveInteger(pageInput);
		if (!parsedPage || loading) {
			setPageInput(pageNumber.toString());
			return;
		}

		const targetPage = totalPages ? Math.min(parsedPage, totalPages) : parsedPage;
		setPageInput(targetPage.toString());
		if (targetPage === pageNumber) return;

		if (targetPage === 1) {
			resetPagination();
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
				const response = await fetchBlocksPage(cursor);
				const lastEdge = response.blocks.edges[response.blocks.edges.length - 1];

				if (!response.blocks.pageInfo.hasNextPage || !lastEdge) {
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
		resetPagination();
		scrollToTop();
	}

	function handleApplyRange() {
		if (invalidMinHeight || invalidMaxHeight || invalidRange) return;

		resetPagination();
		setActiveRange({
			minHeight: parsedMinHeight,
			maxHeight: parsedMaxHeight,
		});
		setShowFilters(false);
	}

	function handleClearRange() {
		setMinHeightInput('');
		setMaxHeightInput('');
		resetPagination();
		setActiveRange({
			minHeight: null,
			maxHeight: null,
		});
	}

	function handleClearMinHeight() {
		setMinHeightInput('');
		resetPagination();
		setActiveRange((prev) => ({
			...prev,
			minHeight: null,
		}));
	}

	function handleClearMaxHeight() {
		setMaxHeightInput('');
		resetPagination();
		setActiveRange((prev) => ({
			...prev,
			maxHeight: null,
		}));
	}

	function handleExport() {
		const csvRows = blocks.map(mapBlockForCsv);

		if (csvRows.length <= 0) return;

		const visibleHeights = blocks
			.map((edge) => edge.node.metadata?.height ?? edge.node.height)
			.filter((height): height is number => Number.isFinite(height));
		const minVisibleHeight = visibleHeights.length > 0 ? Math.min(...visibleHeights) : null;
		const maxVisibleHeight = visibleHeights.length > 0 ? Math.max(...visibleHeights) : null;

		downloadCsv(
			buildCsvFilename([
				'blocks',
				minVisibleHeight !== null && maxVisibleHeight !== null
					? `visible-heights-${minVisibleHeight}-to-${maxVisibleHeight}`
					: null,
				`page-${pageNumber}`,
				`limit-${perPage}`,
			]),
			csvRows
		);
	}

	const handleBlockMetadataLoaded = React.useCallback((height: number, metadata: BlockMetadata | null) => {
		setBlocks((currentBlocks) =>
			currentBlocks.map((edge) =>
				edge.node.height === height
					? {
							...edge,
							node: {
								...edge.node,
								metadata: metadata,
							},
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
		let message = language.blocksNotFound;
		if (loading) message = props.source?.loadingMessage ?? language.blocksLoading;
		if (error) message = error;

		return (
			<S.UpdateWrapper $preview={props.preview} role={loading ? 'status' : undefined}>
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
					onPress={handlePrevious}
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
				<Button type={'alt3'} label={language.next} onPress={handleNext} disabled={!nextCursor || loading} />
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
			<S.Container ref={tableContainerRef} $preview={props.preview}>
				{!props.embedded && (
					<S.Header>
						<S.HeaderMain>
							<p>{props.header ?? language.blocks}</p>
							{loading && (
								<div className={'loader'}>
									<Loader xSm relative />
								</div>
							)}
						</S.HeaderMain>
						{props.source && (
							<S.HeaderActions>
								<Button
									type={'alt3'}
									label={language.refresh}
									icon={ASSETS.refresh}
									iconLeftAlign
									onPress={props.source.onRefresh}
									disabled={loading}
								/>
								{props.source.pagination?.(false)}
							</S.HeaderActions>
						)}
						{!props.preview && !props.source && (
							<S.HeaderActions className={'scroll-wrapper-hidden'}>
								{activeRange.minHeight !== null && (
									<Button
										type={'alt3'}
										label={`${language.minHeight} (${formatCount(activeRange.minHeight.toString())})`}
										onPress={handleClearMinHeight}
										active={true}
										disabled={loading}
										icon={ASSETS.close}
									/>
								)}
								{activeRange.maxHeight !== null && (
									<Button
										type={'alt3'}
										label={`${language.maxHeight} (${formatCount(activeRange.maxHeight.toString())})`}
										onPress={handleClearMaxHeight}
										active={true}
										disabled={loading}
										icon={ASSETS.close}
									/>
								)}
								<FilterS.FilterWrapper>
									<Button
										type={'alt3'}
										label={language.filter}
										onPress={() => setShowFilters((prev) => !prev)}
										active={showFilters}
										disabled={loading}
										icon={ASSETS.filter}
										iconLeftAlign
									/>
								</FilterS.FilterWrapper>
								<S.Divider />
								<Button
									type={'alt3'}
									label={language.refresh}
									onPress={handleRefresh}
									disabled={loading}
									icon={ASSETS.refresh}
									iconLeftAlign
								/>
								<Button
									type={'alt3'}
									label={language.download}
									onPress={handleExport}
									disabled={loading || blocks.length <= 0}
									icon={ASSETS.save}
									iconLeftAlign
								/>
								<S.Divider />
								{getPaginator(false)}
							</S.HeaderActions>
						)}
					</S.Header>
				)}
				{blocks.length > 0 ? (
					<S.Wrapper $preview={props.preview}>
						<S.HeaderWrapper className={'fade-in'} $preview={props.preview}>
							<S.Height $preview={props.preview}>
								<p>{language.height}</p>
							</S.Height>
							<S.ID $preview={props.preview}>
								<p>{language.blockId}</p>
							</S.ID>
							{!props.preview && (
								<>
									<S.Previous>
										<p>{language.previousBlock}</p>
									</S.Previous>
									<S.Miner>
										<p>{language.miner}</p>
									</S.Miner>
									<S.Size>
										<p>{language.size}</p>
									</S.Size>
								</>
							)}
							<S.Transactions $preview={props.preview}>
								<p>{props.preview ? language.txCount : language.transactions}</p>
							</S.Transactions>
							<S.Time $preview={props.preview}>
								<p>{language.time}</p>
							</S.Time>
						</S.HeaderWrapper>
						<S.BodyWrapper className={'fade-in'} $preview={props.preview}>
							{blocks.map((edge) => (
								<BlockRow
									key={edge.node.id}
									edge={edge}
									onMetadataLoaded={handleBlockMetadataLoaded}
									supplied={!!props.source}
									preview={props.preview}
								/>
							))}
						</S.BodyWrapper>
					</S.Wrapper>
				) : (
					getMessage()
				)}
				{!props.embedded && !props.preview && (!props.source || props.source.pagination) && (
					<S.FooterWrapper>{props.source ? props.source.pagination?.(true) : getPaginator(true)}</S.FooterWrapper>
				)}
			</S.Container>
			{!props.preview && !props.source && showFilters && (
				<Modal type="panel" width={515} header={language.blockFilters} onClose={() => setShowFilters(false)}>
					<FilterS.FilterDropdown>
						<FilterS.FilterDropdownHeader>
							<p>{language.filterByHeight}</p>
						</FilterS.FilterDropdownHeader>
						<FilterS.FilterDropdownActionSelect>
							<FormField
								label={language.minHeight}
								value={minHeightInput}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinHeightInput(e.target.value)}
								disabled={loading}
								type={'number'}
								invalid={{
									status: invalidMinHeight || invalidRange,
									message: null,
								}}
								hideErrorMessage
							/>
							<FormField
								label={language.maxHeight}
								value={maxHeightInput}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxHeightInput(e.target.value)}
								disabled={loading}
								type={'number'}
								invalid={{
									status: invalidMaxHeight || invalidRange,
									message: null,
								}}
								hideErrorMessage
							/>
							<Button
								type={'primary'}
								label={language.clear}
								onPress={handleClearRange}
								disabled={
									loading ||
									(!minHeightInput &&
										!maxHeightInput &&
										activeRange.minHeight === null &&
										activeRange.maxHeight === null)
								}
								height={40}
								fullWidth
							/>
						</FilterS.FilterDropdownActionSelect>
						<FilterS.FilterApply>
							<Button
								type={'alt1'}
								label={language.applyFilters}
								onPress={handleApplyRange}
								disabled={invalidMinHeight || invalidMaxHeight || invalidRange}
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
