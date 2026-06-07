import React from 'react';
import { Link } from 'react-router-dom';

import { BlockNode, getBlocks, GQLEdge } from 'api/blocks';

import { Button } from 'components/atoms/Button';
import { Loader } from 'components/atoms/Loader';
import { ASSETS, URLS } from 'helpers/config';
import { formatAddress, formatCount, formatDate } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';

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

	React.useEffect(() => {
		let cancelled = false;

		(async function () {
			setLoading(true);

			try {
				const response = await getBlocks({
					first: BLOCKS_PER_PAGE,
					after: pageCursor,
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
	}, [pageCursor, refreshTrigger, language.errorFetchingData]);

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
										<Link to={`${URLS.explorer}${edge.node.height}`}>
											<p>{formatCount(edge.node.height.toString())}</p>
										</Link>
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
	);
}
