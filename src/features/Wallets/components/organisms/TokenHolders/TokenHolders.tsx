import React from 'react';

import { getTokenHolders, type HolderLastTransaction, type TokenHoldersSnapshot } from 'api/holders';
import { getAoPrice } from 'api/prices';

import { Button } from 'components/atoms/Button';
import { formatUnits } from 'helpers/utils';
import { scrollToPageTop } from 'helpers/window';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { useSettingsProvider } from 'providers/SettingsProvider';

import { formatTokenUsdValue } from '../../../model/formatAddressValue';
import { HolderTransaction } from '../../molecules/HolderTransaction';
import { AddressList } from '../AddressList';

import * as S from './styles';

const HOLDERS_PER_PAGE = 50;
const PRICE_REFRESH_INTERVAL = 60 * 1000;
type HoldersState =
	| { status: 'loading' | 'error' }
	| { status: 'success' | 'refreshing' | 'stale'; data: TokenHoldersSnapshot };

export default function TokenHolders() {
	const provider = useLanguageProvider();
	const settingsProvider = useSettingsProvider();
	const language = provider.object[provider.current];
	const graphqlEndpoint = settingsProvider.settings.graphqlEndpoint;
	const [state, setState] = React.useState<HoldersState>({ status: 'loading' });
	const [revision, setRevision] = React.useState(0);
	const [page, setPage] = React.useState(0);
	const [aoUsdPrice, setAoUsdPrice] = React.useState<number | null>(null);
	const [activity, setActivity] = React.useState<{ key: string; transactions: Record<string, HolderLastTransaction> }>({
		key: '',
		transactions: {},
	});
	const snapshot = 'data' in state ? state.data : null;
	const holders = snapshot?.holders ?? [];
	const holdersByAddress = new Map(holders.map((holder) => [holder.address, holder]));
	const totalPages = Math.max(1, Math.ceil(holders.length / HOLDERS_PER_PAGE));
	const currentPage = Math.min(page, totalPages - 1);
	const visibleAddressKey = holders
		.slice(currentPage * HOLDERS_PER_PAGE, (currentPage + 1) * HOLDERS_PER_PAGE)
		.map((holder) => holder.address)
		.join(',');
	const visibleAddresses = React.useMemo(
		() => (visibleAddressKey ? visibleAddressKey.split(',') : []),
		[visibleAddressKey]
	);
	const activityKey = JSON.stringify([graphqlEndpoint, visibleAddresses, revision]);
	const transactions = activity.key === activityKey ? activity.transactions : {};
	const isLoading = state.status === 'loading' || state.status === 'refreshing';
	const error =
		state.status === 'error' || state.status === 'stale'
			? `${language.holdersLoadError}${snapshot ? ` ${language.holdersStale}` : ''}`
			: undefined;

	React.useEffect(() => {
		const controller = new AbortController();
		setState((previous) =>
			'data' in previous ? { status: 'refreshing', data: previous.data } : { status: 'loading' }
		);
		getTokenHolders({ signal: controller.signal }).then(
			(data) => {
				if (!controller.signal.aborted) setState({ status: 'success', data });
			},
			() => {
				if (controller.signal.aborted) return;
				setState((previous) => ('data' in previous ? { status: 'stale', data: previous.data } : { status: 'error' }));
			}
		);
		return () => controller.abort();
	}, [revision]);

	const handleTransactionLoaded = React.useCallback(
		(address: string, transaction: HolderLastTransaction) => {
			setActivity((previous) => ({
				key: activityKey,
				transactions: {
					...(previous.key === activityKey ? previous.transactions : {}),
					[address]: transaction,
				},
			}));
		},
		[activityKey]
	);

	React.useEffect(() => {
		let cancelled = false;

		async function loadAoPrice() {
			const price = await getAoPrice();
			if (!cancelled) setAoUsdPrice(price);
		}

		loadAoPrice();
		const interval = window.setInterval(loadAoPrice, PRICE_REFRESH_INTERVAL);
		return () => {
			cancelled = true;
			window.clearInterval(interval);
		};
	}, [revision]);

	function handleRefresh() {
		setRevision((previous) => previous + 1);
	}

	function getPagination(showCounter: boolean) {
		return (
			<>
				<Button
					type="alt3"
					label={language.previous}
					disabled={isLoading || currentPage === 0}
					onPress={() => {
						setPage(currentPage - 1);
						if (showCounter) scrollToPageTop();
					}}
				/>
				{showCounter && <S.PageCounter>{language.walletsPage(currentPage + 1, totalPages)}</S.PageCounter>}
				<Button
					type="alt3"
					label={language.next}
					disabled={isLoading || currentPage >= totalPages - 1}
					onPress={() => {
						setPage(currentPage + 1);
						if (showCounter) scrollToPageTop();
					}}
				/>
			</>
		);
	}

	return (
		<S.Wrapper>
			{Object.values(transactions).some((transaction) => transaction.status === 'error') && (
				<S.ActivityStatus role="status">{language.holdersTransactionsLoadError}</S.ActivityStatus>
			)}
			<AddressList
				header={language.topHolders}
				count={snapshot?.holders.length}
				source={{
					addresses: visibleAddresses,
					loading: isLoading,
					onRefresh: handleRefresh,
					error,
					emptyMessage: isLoading ? language.holdersLoading : language.holdersEmpty,
					pagination: getPagination,
					columns: [
						{
							label: language.balance,
							align: 'end',
							render: (address) => {
								const holder = holdersByAddress.get(address);
								return holder && snapshot ? (
									<S.Balance title={holder.balance}>
										{formatUnits(holder.balance, snapshot.denomination)} {snapshot.ticker}
									</S.Balance>
								) : (
									'—'
								);
							},
						},
						{
							label: language.value,
							align: 'end',
							render: (address) => {
								const holder = holdersByAddress.get(address);
								return (
									<S.Balance>
										{holder && snapshot ? formatTokenUsdValue(holder.balance, aoUsdPrice, snapshot.denomination) : '—'}
									</S.Balance>
								);
							},
						},
						{
							label: language.lastTransaction,
							description: language.holdersLastTransactionDescription,
							align: 'end',
							render: (address) => (
								<HolderTransaction
									key={JSON.stringify([graphqlEndpoint, address, revision])}
									address={address}
									endpoint={graphqlEndpoint}
									onLoad={handleTransactionLoaded}
								/>
							),
						},
					],
				}}
			/>
		</S.Wrapper>
	);
}
