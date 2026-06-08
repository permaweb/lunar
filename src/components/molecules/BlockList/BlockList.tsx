import React from 'react';

import { BlockNode, getBlocks, GQLEdge } from 'api/blocks';

import { Button } from 'components/atoms/Button';
import { FormField } from 'components/atoms/FormField';
import { Loader } from 'components/atoms/Loader';
import { Modal } from 'components/atoms/Modal';
import { ExplorerLink } from 'components/atoms/TxAddress';
import { ASSETS } from 'helpers/config';
import { formatAddress, formatCount, formatDate } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as FilterS from '../MessageList/styles';

import * as S from './styles';

const BLOCKS_PER_PAGE = 50;

export default function BlockList(props: { header?: string }) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const tableContainerRef = React.useRef<HTMLDivElement | null>(null);

	const [blocks, setBlocks] = React.useState<GQLEdge<BlockNode>[]>([]);
	const [loading, setLoading] = React.useState<boolean>(true);
	const [error, setError] = React.useState<string | null>(null);
	const [pageCursor, setPageCursor] = React.useState<string | null>(null);
	const [nextCursor, setNextCursor] = React.useState<string | null>(null);
	const [cursorHistory, setCursorHistory] = React.useState<(string | null)[]>([]);
	const [pageNumber, setPageNumber] = React.useState<number>(1);
	const [totalCount, setTotalCount] = React.useState<number | null>(null);
	const [refreshTrigger, setRefreshTrigger] = React.useState<boolean>(false);
	const [showFilters, setShowFilters] = React.useState<boolean>(false);
	const [minHeightInput, setMinHeightInput] = React.useState<string>('');
	const [maxHeightInput, setMaxHeightInput] = React.useState<string>('');
	const [activeRange, setActiveRange] = React.useState<{ minHeight: number | null; maxHeight: number | null }>({
		minHeight: null,
		maxHeight: null,
	});

	const parsedMinHeight = parseHeightInput(minHeightInput);
	const parsedMaxHeight = parseHeightInput(maxHeightInput);
	const invalidMinHeight = !!minHeightInput.trim() && parsedMinHeight === null;
	const invalidMaxHeight = !!maxHeightInput.trim() && parsedMaxHeight === null;
	const invalidRange = parsedMinHeight !== null && parsedMaxHeight !== null && parsedMinHeight > parsedMaxHeight;

	React.useEffect(() => {
		let cancelled = false;

		(async function () {
			setLoading(true);

			try {
				const response = await getBlocks({
					first: BLOCKS_PER_PAGE,
					after: pageCursor,
					minHeight: activeRange.minHeight,
					maxHeight: activeRange.maxHeight,
				});

				if (!cancelled) {
					const lastEdge = response.blocks.edges[response.blocks.edges.length - 1];

					setBlocks(response.blocks.edges);
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
	}, [pageCursor, refreshTrigger, activeRange.minHeight, activeRange.maxHeight, language.errorFetchingData]);

	function parseHeightInput(value: string) {
		const trimmed = value.trim();
		if (!trimmed) return null;

		const parsed = Number(trimmed);

		return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
	}

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

	function getPages() {
		const totalPages = totalCount ? Math.ceil(totalCount / BLOCKS_PER_PAGE) : null;

		return (
			<>
				<p>
					{totalPages
						? `Page (${formatCount(pageNumber.toString())} of ${formatCount(totalPages.toString())})`
						: `Page (${formatCount(pageNumber.toString())})`}
				</p>
				<S.Divider />
				<p>{language.perPage(BLOCKS_PER_PAGE)}</p>
			</>
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
				{showPages && <S.DPageCounter>{getPages()}</S.DPageCounter>}
				<Button type={'alt3'} label={language.next} handlePress={handleNext} disabled={!nextCursor || loading} />
				{showPages && <S.MPageCounter>{getPages()}</S.MPageCounter>}
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
							<S.Time>
								<p>{language.time}</p>
							</S.Time>
						</S.HeaderWrapper>
						<S.BodyWrapper className={'fade-in'}>
							{blocks.map((edge) => {
								return (
									<S.ElementWrapper key={edge.node.id} className={'block-list-element'}>
										<S.Height>
											<ExplorerLink value={edge.node.height} type={'block'} tooltipPosition={'right'} />
										</S.Height>
										<S.ID title={edge.node.id}>
											<p>{formatAddress(edge.node.id, false)}</p>
										</S.ID>
										<S.Previous title={edge.node.previous}>
											<p>{formatAddress(edge.node.previous, false)}</p>
										</S.Previous>
										<S.Time>
											<p>{formatDate(edge.node.timestamp * 1000, 'timestamp', true)}</p>
										</S.Time>
									</S.ElementWrapper>
								);
							})}
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
