import React from 'react';
import { useNavigate } from 'react-router-dom';

import { AddressChunk, AddressSnapshot, getAddressChunk, getLatestAddressSnapshot } from 'api/addresses';

import { Button } from 'components/atoms/Button';
import { Loader } from 'components/atoms/Loader';
import { ExplorerLink, TxAddress } from 'components/atoms/TxAddress';
import { ASSETS, TOKEN_DENOMINATIONS, URLS } from 'helpers/config';
import { getArPrice } from 'helpers/prices';
import { formatCount, formatUnits } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { formatArUsdValue } from '../../../model/formatAddressValue';

import * as S from './styles';

const ADDRESSES_PER_PAGE = 50;
const PRICE_REFRESH_INTERVAL = 60 * 1000;

type LoadedAddressChunk = AddressChunk & {
	cursor: string | null;
};

type AddressListData = {
	blockHeight: number;
	walletListRoot: string;
	chunks: LoadedAddressChunk[];
	chunkIndex: number;
	offset: number;
	pageNumber: number;
};

type AddressListState =
	| { status: 'loading' }
	| { status: 'success'; data: AddressListData }
	| { status: 'refreshing'; data: AddressListData }
	| { status: 'loading-next'; data: AddressListData }
	| { status: 'stale'; data: AddressListData; error: string }
	| { status: 'error'; error: string };

function getStateData(state: AddressListState) {
	return 'data' in state ? state.data : null;
}

function getInitialData(snapshot: AddressSnapshot): AddressListData {
	return {
		blockHeight: snapshot.blockHeight,
		walletListRoot: snapshot.walletListRoot,
		chunks: [
			{
				addresses: snapshot.addresses,
				nextCursor: snapshot.nextCursor,
				cursor: null,
			},
		],
		chunkIndex: 0,
		offset: 0,
		pageNumber: 1,
	};
}

function formatArBalance(balance: string) {
	return `${formatUnits(balance, TOKEN_DENOMINATIONS.ar, 6)} AR`;
}

export default function AddressList(props: {
	header?: string;
	count?: number;
	actions?: React.ReactNode;
	source?: {
		addresses: string[];
		columns: { label: string; render: (address: string) => React.ReactNode }[];
		renderRowDetails?: (address: string) => React.ReactNode;
		loading: boolean;
		onRefresh: () => void;
		pagination?: (showCounter: boolean) => React.ReactNode;
		emptyMessage?: string;
	};
}) {
	const navigate = useNavigate();
	const hasSource = props.source !== undefined;
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const activeRequestRef = React.useRef<AbortController | null>(null);
	const isMountedRef = React.useRef(true);

	const [state, setState] = React.useState<AddressListState>({ status: 'loading' });
	const [arUsdPrice, setArUsdPrice] = React.useState<number | null>(null);

	const data = getStateData(state);
	const activeChunk = data?.chunks[data.chunkIndex] ?? null;
	const loadedAddresses =
		activeChunk?.addresses.slice(data?.offset ?? 0, (data?.offset ?? 0) + ADDRESSES_PER_PAGE) ?? [];
	const visibleAddresses: { address: string; balance?: string; lastTransaction?: string | null }[] = props.source
		? props.source.addresses.map((address) => ({ address }))
		: loadedAddresses;
	const isLoading =
		props.source?.loading ??
		(state.status === 'loading' || state.status === 'refreshing' || state.status === 'loading-next');
	const canGoPrevious = !!data && (data.offset > 0 || data.chunkIndex > 0);
	const canGoNext =
		!!data &&
		!!activeChunk &&
		(data.offset + ADDRESSES_PER_PAGE < activeChunk.addresses.length || !!activeChunk.nextCursor);

	const loadSnapshot = React.useCallback(async () => {
		activeRequestRef.current?.abort();
		const controller = new AbortController();
		activeRequestRef.current = controller;

		setState((current) => {
			const currentData = getStateData(current);
			return currentData ? { status: 'refreshing', data: currentData } : { status: 'loading' };
		});

		try {
			const snapshot = await getLatestAddressSnapshot({ signal: controller.signal });

			if (isMountedRef.current && activeRequestRef.current === controller) {
				setState({ status: 'success', data: getInitialData(snapshot) });
			}
		} catch (error) {
			const isAbortError = error instanceof Error && error.name === 'AbortError';
			if (isAbortError || !isMountedRef.current || activeRequestRef.current !== controller) return;

			console.error('Failed to load AR addresses:', error);
			setState((current) => {
				const currentData = getStateData(current);
				return currentData
					? { status: 'stale', data: currentData, error: language.errorFetchingData }
					: { status: 'error', error: language.errorFetchingData };
			});
		}
	}, [language.errorFetchingData]);

	React.useEffect(() => {
		if (hasSource) return;
		isMountedRef.current = true;
		loadSnapshot();

		return () => {
			isMountedRef.current = false;
			activeRequestRef.current?.abort();
		};
	}, [hasSource, loadSnapshot]);

	React.useEffect(() => {
		if (hasSource) return;
		let cancelled = false;

		async function loadArPrice() {
			const price = await getArPrice();
			if (!cancelled) setArUsdPrice(price);
		}

		loadArPrice();
		const interval = window.setInterval(loadArPrice, PRICE_REFRESH_INTERVAL);

		return () => {
			cancelled = true;
			window.clearInterval(interval);
		};
	}, [hasSource]);

	function handlePrevious() {
		if (!data || isLoading) return;

		if (data.offset >= ADDRESSES_PER_PAGE) {
			setState({
				status: 'success',
				data: {
					...data,
					offset: data.offset - ADDRESSES_PER_PAGE,
					pageNumber: Math.max(1, data.pageNumber - 1),
				},
			});
			return;
		}

		if (data.chunkIndex > 0) {
			const previousChunkIndex = data.chunkIndex - 1;
			const previousChunk = data.chunks[previousChunkIndex];
			const previousOffset = Math.max(
				0,
				Math.floor((previousChunk.addresses.length - 1) / ADDRESSES_PER_PAGE) * ADDRESSES_PER_PAGE
			);

			setState({
				status: 'success',
				data: {
					...data,
					chunkIndex: previousChunkIndex,
					offset: previousOffset,
					pageNumber: Math.max(1, data.pageNumber - 1),
				},
			});
		}
	}

	async function handleNext() {
		if (!data || !activeChunk || isLoading) return;

		if (data.offset + ADDRESSES_PER_PAGE < activeChunk.addresses.length) {
			setState({
				status: 'success',
				data: {
					...data,
					offset: data.offset + ADDRESSES_PER_PAGE,
					pageNumber: data.pageNumber + 1,
				},
			});
			return;
		}

		if (!activeChunk.nextCursor) return;

		const cachedNextChunk = data.chunks[data.chunkIndex + 1];
		if (cachedNextChunk?.cursor === activeChunk.nextCursor) {
			setState({
				status: 'success',
				data: {
					...data,
					chunkIndex: data.chunkIndex + 1,
					offset: 0,
					pageNumber: data.pageNumber + 1,
				},
			});
			return;
		}

		activeRequestRef.current?.abort();
		const controller = new AbortController();
		activeRequestRef.current = controller;
		setState({ status: 'loading-next', data: data });

		try {
			const firstCursor = activeChunk.nextCursor;
			let cursor: string | null = firstCursor;
			let nextChunk: AddressChunk | null = null;
			const seenCursors = new Set<string>();

			while (cursor && !nextChunk?.addresses.length) {
				if (seenCursors.has(cursor)) throw new Error('Wallet list returned a repeated cursor');
				seenCursors.add(cursor);

				nextChunk = await getAddressChunk({
					walletListRoot: data.walletListRoot,
					cursor: cursor,
					signal: controller.signal,
				});

				if (nextChunk.addresses.length === 0) cursor = nextChunk.nextCursor;
			}

			if (!isMountedRef.current || activeRequestRef.current !== controller) return;

			if (!nextChunk || nextChunk.addresses.length === 0) {
				const updatedChunks = [...data.chunks];
				updatedChunks[data.chunkIndex] = { ...activeChunk, nextCursor: null };
				setState({ status: 'success', data: { ...data, chunks: updatedChunks } });
				return;
			}

			const loadedChunk: LoadedAddressChunk = {
				...nextChunk,
				cursor: firstCursor,
			};

			setState({
				status: 'success',
				data: {
					...data,
					chunks: [...data.chunks.slice(0, data.chunkIndex + 1), loadedChunk],
					chunkIndex: data.chunkIndex + 1,
					offset: 0,
					pageNumber: data.pageNumber + 1,
				},
			});
		} catch (error) {
			const isAbortError = error instanceof Error && error.name === 'AbortError';
			if (isAbortError || !isMountedRef.current || activeRequestRef.current !== controller) return;

			console.error('Failed to load the next AR address page:', error);
			setState({ status: 'stale', data: data, error: language.errorFetchingData });
		}
	}

	function getMessage() {
		let message = language.addressesNotFound;
		if (state.status === 'loading') message = language.addressesLoading;
		if (state.status === 'error') message = state.error;

		return (
			<S.UpdateWrapper role={state.status === 'loading' ? 'status' : undefined}>
				<p>{message}</p>
			</S.UpdateWrapper>
		);
	}

	function getPaginator(opts?: { showCounter?: boolean }) {
		return (
			<>
				<Button
					type={'alt3'}
					label={language.previous}
					onPress={handlePrevious}
					disabled={!canGoPrevious || isLoading}
				/>
				{opts?.showCounter && (
					<S.PageCounter>
						<p>{`Page (${formatCount(data?.pageNumber.toString() ?? '1')})`}</p>
						<S.Divider />
						<p>{language.perPage(ADDRESSES_PER_PAGE)}</p>
					</S.PageCounter>
				)}
				<Button type={'alt3'} label={language.next} onPress={handleNext} disabled={!canGoNext || isLoading} />
			</>
		);
	}

	return (
		<S.Container>
			<S.Header>
				<S.HeaderMain>
					<p>
						{props.header ??
							(data ? language.addressesAtBlock(formatCount(data.blockHeight.toString())) : language.addresses)}
						{props.count !== undefined && <S.Count>({props.count.toLocaleString()})</S.Count>}
					</p>
					{isLoading && (
						<div className={'loader'}>
							<Loader xSm relative />
						</div>
					)}
				</S.HeaderMain>
				<S.HeaderActions>
					{props.actions}
					<Button
						type={'alt3'}
						label={language.refresh}
						onPress={props.source?.onRefresh ?? loadSnapshot}
						disabled={isLoading}
						icon={ASSETS.refresh}
						iconLeftAlign
					/>
					<S.Divider />
					{props.source ? props.source.pagination?.(false) : getPaginator()}
				</S.HeaderActions>
			</S.Header>

			{visibleAddresses.length > 0 ? (
				<S.Table role={'table'} aria-label={props.header ?? language.addresses}>
					<S.TableHeader role={'row'} $columns={(props.source?.columns.length ?? 3) + 1}>
						<S.AddressColumn role={'columnheader'}>
							<p>{language.walletAddress}</p>
						</S.AddressColumn>
						{props.source ? (
							props.source.columns.map((column) => (
								<S.SourceColumn role={'columnheader'} key={column.label}>
									<p>{column.label}</p>
								</S.SourceColumn>
							))
						) : (
							<>
								<S.BalanceColumn role={'columnheader'}>
									<p>{language.balance}</p>
								</S.BalanceColumn>
								<S.ValueColumn role={'columnheader'}>
									<p>{language.value}</p>
								</S.ValueColumn>
								<S.LastTransactionColumn role={'columnheader'}>
									<p>{language.lastTransaction}</p>
								</S.LastTransactionColumn>
							</>
						)}
					</S.TableHeader>
					<S.TableBody role={'rowgroup'} $columns={(props.source?.columns.length ?? 3) + 1}>
						{visibleAddresses.map((address) => {
							const details = props.source?.renderRowDetails?.(address.address);
							return (
								<React.Fragment key={address.address}>
									<S.TableRow
										$expanded={!!details}
										$columns={(props.source?.columns.length ?? 3) + 1}
										role={'row'}
										tabIndex={0}
										aria-label={`${language.inspect} ${address.address}`}
										onClick={(event) => {
											if (!(event.target as Element).closest('a, button'))
												navigate(`${URLS.explorer}${address.address}`);
										}}
										onKeyDown={(event) => {
											if (event.target === event.currentTarget && event.key === 'Enter') {
												event.preventDefault();
												navigate(`${URLS.explorer}${address.address}`);
											}
										}}
									>
										<S.AddressColumn role={'cell'} title={address.address}>
											<TxAddress address={address.address} tooltipPosition={'right'} />
										</S.AddressColumn>
										{props.source ? (
											props.source.columns.map((column) => (
												<S.SourceColumn role={'cell'} key={column.label}>
													{column.render(address.address)}
												</S.SourceColumn>
											))
										) : (
											<>
												<S.BalanceColumn
													role={'cell'}
													title={address.balance === undefined ? undefined : `${address.balance} winston`}
												>
													<p>{address.balance === undefined ? '—' : formatArBalance(address.balance)}</p>
												</S.BalanceColumn>
												<S.ValueColumn role={'cell'}>
													<p>{address.balance === undefined ? '—' : formatArUsdValue(address.balance, arUsdPrice)}</p>
												</S.ValueColumn>
												<S.LastTransactionColumn role={'cell'} title={address.lastTransaction ?? undefined}>
													<ExplorerLink value={address.lastTransaction} type={'transaction'} tooltipPosition={'left'} />
												</S.LastTransactionColumn>
											</>
										)}
									</S.TableRow>
									{details && (
										<S.DetailsRow role={'row'}>
											<S.DetailsCell role={'cell'} aria-colspan={(props.source?.columns.length ?? 3) + 1}>
												{details}
											</S.DetailsCell>
										</S.DetailsRow>
									)}
								</React.Fragment>
							);
						})}
					</S.TableBody>
				</S.Table>
			) : props.source ? (
				<S.UpdateWrapper role={isLoading ? 'status' : undefined}>
					<p>{props.source.emptyMessage ?? `${language.loading}...`}</p>
				</S.UpdateWrapper>
			) : (
				getMessage()
			)}

			{!props.source && state.status === 'stale' && (
				<S.ErrorStatus role={'status'}>
					<p>{state.error}</p>
				</S.ErrorStatus>
			)}

			<S.Footer $borderTop={visibleAddresses.length <= 0}>
				{props.source ? props.source.pagination?.(true) : getPaginator({ showCounter: true })}
			</S.Footer>
		</S.Container>
	);
}
