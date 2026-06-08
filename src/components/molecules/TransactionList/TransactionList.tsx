import React from 'react';
import { useTheme } from 'styled-components';

import {
	getTransactionsByBlock,
	getTransactionsByBundle,
	GQLEdge,
	isBundleTransaction,
	TransactionNode,
} from 'api/blocks';

import { Button } from 'components/atoms/Button';
import { Loader } from 'components/atoms/Loader';
import { ExplorerLink, TxAddress } from 'components/atoms/TxAddress';
import { formatCount, formatDate, getByteSizeDisplay, getTagValue } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

const TRANSACTIONS_PER_PAGE = 50;

export default function TransactionList(props: {
	mode: 'block' | 'bundle';
	blockHeight?: number;
	blockId?: string;
	bundleId?: string;
	header?: string;
}) {
	const currentTheme: any = useTheme();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const tableContainerRef = React.useRef<HTMLDivElement | null>(null);

	const [transactions, setTransactions] = React.useState<GQLEdge<TransactionNode>[]>([]);
	const [loading, setLoading] = React.useState<boolean>(true);
	const [error, setError] = React.useState<string | null>(null);
	const [pageCursor, setPageCursor] = React.useState<string | null>(null);
	const [nextCursor, setNextCursor] = React.useState<string | null>(null);
	const [cursorHistory, setCursorHistory] = React.useState<(string | null)[]>([]);
	const [pageNumber, setPageNumber] = React.useState<number>(1);
	const [totalCount, setTotalCount] = React.useState<number | null>(null);

	React.useEffect(() => {
		let cancelled = false;

		(async function () {
			const canLoad = props.mode === 'block' ? props.blockHeight !== undefined || !!props.blockId : !!props.bundleId;
			if (!canLoad) {
				setTransactions([]);
				setLoading(false);
				return;
			}

			setLoading(true);

			try {
				const response =
					props.mode === 'block'
						? await getTransactionsByBlock({
								blockHeight: props.blockHeight,
								blockId: props.blockId,
								first: TRANSACTIONS_PER_PAGE,
								after: pageCursor,
						  })
						: await getTransactionsByBundle({
								bundleId: props.bundleId,
								first: TRANSACTIONS_PER_PAGE,
								after: pageCursor,
						  });

				if (!cancelled) {
					const lastEdge = response.transactions.edges[response.transactions.edges.length - 1];

					setTransactions(response.transactions.edges);
					setNextCursor(response.transactions.pageInfo.hasNextPage ? lastEdge?.cursor ?? null : null);
					if (response.transactions.count !== undefined) {
						setTotalCount(response.transactions.count ?? null);
					}
					setError(null);
				}
			} catch (e: any) {
				console.error(e);

				if (!cancelled) {
					setTransactions([]);
					setNextCursor(null);
					setTotalCount(null);
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
	}, [props.mode, props.blockHeight, props.blockId, props.bundleId, pageCursor, language.errorFetchingData]);

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

	function getTransactionType(transaction: TransactionNode) {
		if (isBundleTransaction(transaction)) return language.bundle;

		return getTagValue(transaction.tags, 'Type') ?? language.transaction;
	}

	function getTypeBackground(transaction: TransactionNode) {
		const type = getTransactionType(transaction);

		// Use the same color scheme as MessageList actions
		if (type === language.bundle) {
			return currentTheme.colors.actions.transfer; // Orange for bundles
		} else if (type === language.transaction) {
			return currentTheme.colors.actions.balance; // Blue for transactions
		} else {
			// Check if it's a specific transaction type from tags
			const tagType = getTagValue(transaction.tags, 'Type');
			if (tagType === 'Message') {
				return currentTheme.colors.actions.info; // Purple for messages
			} else if (tagType === 'Process') {
				return currentTheme.colors.actions.eval; // Teal for processes
			}
			return currentTheme.colors.actions.other; // Default blue
		}
	}

	function getSize(transaction: TransactionNode) {
		const size = Number(transaction.data?.size);

		return Number.isFinite(size) ? getByteSizeDisplay(size) : '-';
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

	function getPages() {
		const totalPages = totalCount ? Math.ceil(totalCount / TRANSACTIONS_PER_PAGE) : null;

		return (
			<>
				<p>
					{totalPages
						? `Page (${formatCount(pageNumber.toString())} of ${formatCount(totalPages.toString())})`
						: `Page (${formatCount(pageNumber.toString())})`}
				</p>
				<S.Divider />
				<p>{language.perPage(TRANSACTIONS_PER_PAGE)}</p>
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
					<p>{props.header ?? language.transactions}</p>
					{loading && (
						<div className={'loader'}>
							<Loader xSm relative />
						</div>
					)}
				</S.HeaderMain>
				<S.HeaderActions className={'scroll-wrapper-hidden'}>{getPaginator(false)}</S.HeaderActions>
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
						{transactions.map((edge) => {
							const transaction = edge.node;

							return (
								<S.ElementWrapper key={transaction.id} className={'transaction-list-element'}>
									<S.ID title={transaction.id}>
										<S.LinkLabel>
											<ExplorerLink value={transaction.id} type={'transaction'} />
										</S.LinkLabel>
									</S.ID>
									<S.TypeValue background={getTypeBackground(transaction)}>
										<div className={'type-indicator'}>
											<p>{getTransactionType(transaction)}</p>
										</div>
									</S.TypeValue>
									<S.Owner>
										{transaction.owner?.address ? <TxAddress address={transaction.owner.address} /> : <p>-</p>}
									</S.Owner>
									<S.Recipient>
										{transaction.recipient ? <TxAddress address={transaction.recipient} /> : <p>No Recipient</p>}
									</S.Recipient>
									<S.Size>
										<p>{getSize(transaction)}</p>
									</S.Size>
									<S.Time>
										<p>
											{transaction.block?.timestamp
												? formatDate(transaction.block.timestamp * 1000, 'timestamp', true)
												: '-'}
										</p>
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
