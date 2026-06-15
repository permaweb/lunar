import React from 'react';

import { BlockMetadata, BlockNode, getBlockMetadataByHeight, getBlocks, GQLEdge } from 'api/blocks';

import { Button } from 'components/atoms/Button';
import { FormField } from 'components/atoms/FormField';
import { Loader } from 'components/atoms/Loader';
import { Modal } from 'components/atoms/Modal';
import { ExplorerLink, TxAddress } from 'components/atoms/TxAddress';
import { PaginationControls } from 'components/molecules/PaginationControls';
import { ASSETS, FLAGS, STORAGE } from 'helpers/config';
import { downloadCsv, getCsvTimestamp, mapBlockForCsv } from 'helpers/csv';
import { checkValidAddress, formatBlockId, formatCount, formatDate, getByteSizeDisplay } from 'helpers/utils';
import { useVisibleData } from 'hooks/useVisibleData';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as FilterS from '../MessageList/styles';

import * as S from './styles';

const DEFAULT_BLOCKS_PER_PAGE = 50;

type BlockListEdge = GQLEdge<
	BlockNode & {
		metadata?: BlockMetadata | null;
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

function BlockRow(props: {
	edge: BlockListEdge;
	onMetadataLoaded: (height: number, metadata: BlockMetadata | null) => void;
}) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const shouldLoadMetadata = props.edge.node.metadata === undefined;
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
	const txCount = Array.isArray(txs) ? txs.length : null;
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

	return (
		<S.ElementWrapper ref={metadataResponse.ref} className={'block-list-element'}>
			<S.Height>
				<ExplorerLink value={props.edge.node.height} type={'block'} tooltipPosition={'right'} />
			</S.Height>
			<S.ID title={blockId}>
				<ExplorerLink value={blockId} label={formatBlockId(blockId, false)} tooltipPosition={'right'} />
			</S.ID>
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
			<S.Transactions>
				<p>{metadataPending ? `${language.loading}...` : txCount !== null ? formatCount(txCount.toString()) : '-'}</p>
			</S.Transactions>
			<S.Time>
				<p>{formatDate(timestamp * 1000, 'timestamp', true)}</p>
			</S.Time>
		</S.ElementWrapper>
	);
}

export default function BlockList(props: { header?: string }) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const tableContainerRef = React.useRef<HTMLDivElement | null>(null);
	const loadedFilterState = React.useMemo(() => getStoredBlockFilterState(), []);

	const [blocks, setBlocks] = React.useState<BlockListEdge[]>([]);
	const [loading, setLoading] = React.useState<boolean>(true);
	const [error, setError] = React.useState<string | null>(null);
	const [pageCursor, setPageCursor] = React.useState<string | null>(null);
	const [nextCursor, setNextCursor] = React.useState<string | null>(null);
	const [cursorHistory, setCursorHistory] = React.useState<(string | null)[]>([]);
	const [pageNumber, setPageNumber] = React.useState<number>(1);
	const [pageInput, setPageInput] = React.useState<string>('1');
	const [perPage, setPerPage] = React.useState<number>(DEFAULT_BLOCKS_PER_PAGE);
	const [perPageInput, setPerPageInput] = React.useState<string>(DEFAULT_BLOCKS_PER_PAGE.toString());
	const [totalCount, setTotalCount] = React.useState<number | null>(null);
	const [refreshTrigger, setRefreshTrigger] = React.useState<boolean>(false);
	const [showFilters, setShowFilters] = React.useState<boolean>(false);
	const [minHeightInput, setMinHeightInput] = React.useState<string>(loadedFilterState?.minHeightInput ?? '');
	const [maxHeightInput, setMaxHeightInput] = React.useState<string>(loadedFilterState?.maxHeightInput ?? '');
	const [activeRange, setActiveRange] = React.useState<{ minHeight: number | null; maxHeight: number | null }>({
		minHeight: loadedFilterState?.minHeight ?? null,
		maxHeight: loadedFilterState?.maxHeight ?? null,
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
	}, [activeRange.minHeight, activeRange.maxHeight]);

	React.useEffect(() => {
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
	}, [pageCursor, refreshTrigger, fetchBlocksPage, language.errorFetchingData]);

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

		downloadCsv(`lunar-blocks-${getCsvTimestamp()}.csv`, csvRows);
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
		if (loading) message = `${language.blocksLoading}...`;
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
						<p>{props.header ?? language.blocks}</p>
						{loading && (
							<div className={'loader'}>
								<Loader xSm relative />
							</div>
						)}
					</S.HeaderMain>
					<S.HeaderActions className={'scroll-wrapper-hidden'}>
						{activeRange.minHeight !== null && (
							<Button
								type={'alt3'}
								label={`${language.minHeight} (${formatCount(activeRange.minHeight.toString())})`}
								handlePress={handleClearMinHeight}
								active={true}
								disabled={loading}
								icon={ASSETS.close}
							/>
						)}
						{activeRange.maxHeight !== null && (
							<Button
								type={'alt3'}
								label={`${language.maxHeight} (${formatCount(activeRange.maxHeight.toString())})`}
								handlePress={handleClearMaxHeight}
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
							label={language.refresh}
							handlePress={handleRefresh}
							disabled={loading}
							icon={ASSETS.refresh}
							iconLeftAlign
						/>
						<Button
							type={'alt3'}
							label={language.download}
							handlePress={handleExport}
							disabled={loading || blocks.length <= 0}
							icon={ASSETS.save}
							iconLeftAlign
						/>
						<S.Divider />
						{getPaginator(false)}
					</S.HeaderActions>
				</S.Header>
				{blocks.length > 0 ? (
					<S.Wrapper>
						<S.HeaderWrapper className={'fade-in'}>
							<S.Height>
								<p>{language.height}</p>
							</S.Height>
							<S.ID>
								<p>{language.blockId}</p>
							</S.ID>
							<S.Previous>
								<p>{language.previousBlock}</p>
							</S.Previous>
							<S.Miner>
								<p>{language.miner}</p>
							</S.Miner>
							<S.Size>
								<p>{language.size}</p>
							</S.Size>
							<S.Transactions>
								<p>{language.transactions}</p>
							</S.Transactions>
							<S.Time>
								<p>{language.time}</p>
							</S.Time>
						</S.HeaderWrapper>
						<S.BodyWrapper className={'fade-in'}>
							{blocks.map((edge) => (
								<BlockRow key={edge.node.id} edge={edge} onMetadataLoaded={handleBlockMetadataLoaded} />
							))}
						</S.BodyWrapper>
					</S.Wrapper>
				) : (
					getMessage()
				)}
				<S.FooterWrapper>{getPaginator(true)}</S.FooterWrapper>
			</S.Container>
			{showFilters && (
				<Modal type="panel" width={515} header={language.blockFilters} handleClose={() => setShowFilters(false)}>
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
								handlePress={handleClearRange}
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
								handlePress={handleApplyRange}
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
