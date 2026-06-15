import React from 'react';
import { useDispatch } from 'react-redux';

import { DEFAULT_ACTIONS, PROCESSES, TOKEN_DENOMINATIONS } from 'helpers/config';
import { searchTxById } from 'helpers/search';
import { TagType } from 'helpers/types';
import { formatUnits, getTagValue } from 'helpers/utils';
import { useVisibleData } from 'hooks/useVisibleData';
import { usePermawebProvider } from 'providers/PermawebProvider';
import { store } from 'store';
import { selectTransaction } from 'store/transactions/reducer';

import * as S from './styles';

type TransferTokenMetadata = {
	denomination: number | null;
	ticker?: string | null;
};

function getTokenKey(target: string | null | undefined) {
	if (!target) return null;

	for (const [token, processId] of Object.entries(PROCESSES)) {
		if (processId === target) return token;
	}

	return null;
}

function getKnownTokenMetadata(target: string | null | undefined): TransferTokenMetadata | null {
	const token = getTokenKey(target);
	if (!token || !TOKEN_DENOMINATIONS[token]) return null;

	switch (token) {
		case 'ao':
			return {
				denomination: TOKEN_DENOMINATIONS[token],
				ticker: 'AO',
			};
		case 'pi':
			return {
				denomination: TOKEN_DENOMINATIONS[token],
				ticker: 'PI',
			};
		default:
			return {
				denomination: TOKEN_DENOMINATIONS[token],
				ticker: token.toUpperCase(),
			};
	}
}

function getResponseValue(response: any, key: string) {
	const lowerKey = key.toLowerCase();

	return (
		response?.[key] ??
		response?.[lowerKey] ??
		response?.node?.[key] ??
		response?.node?.[lowerKey] ??
		getTagValue(response?.node?.tags, key) ??
		null
	);
}

function getTokenMetadataFromResponse(response: any): TransferTokenMetadata | null {
	if (!response) return null;

	const rawDenomination = getResponseValue(response, 'Denomination');
	const denomination = Number(rawDenomination);
	const ticker = getResponseValue(response, 'Ticker');

	if (!Number.isFinite(denomination) && !ticker) return null;

	return {
		denomination: Number.isFinite(denomination) ? denomination : null,
		ticker: ticker ?? null,
	};
}

function formatTransferQuantity(quantity: string, metadata: TransferTokenMetadata | null) {
	if (!metadata?.denomination && metadata?.denomination !== 0) return quantity;

	try {
		return formatUnits(quantity, metadata.denomination);
	} catch (e: any) {
		console.error(e);
		return quantity;
	}
}

export default function TransferAmount(props: { tags?: TagType[]; target?: string | null }) {
	const dispatch = useDispatch();
	const permawebProvider = usePermawebProvider();

	const action = getTagValue(props.tags, 'Action');
	const quantity = getTagValue(props.tags, 'Quantity');
	const target = props.target ?? getTagValue(props.tags, 'Target');
	const isTransfer = action === DEFAULT_ACTIONS.transfer.name;

	const knownMetadata = React.useMemo(() => getKnownTokenMetadata(target), [target]);
	const cachedMetadata = React.useMemo(() => {
		if (!target || knownMetadata) return null;

		return getTokenMetadataFromResponse(selectTransaction(store.getState(), target));
	}, [knownMetadata, target]);

	const shouldFetchMetadata =
		isTransfer && !!quantity && !!target && !knownMetadata && !cachedMetadata && !!permawebProvider.libs?.getGQLData;

	const fetchTokenMetadata = React.useCallback(async () => {
		if (!target) return null;

		const cached = getTokenMetadataFromResponse(selectTransaction(store.getState(), target));
		if (cached) return cached;
		if (!permawebProvider.libs?.getGQLData) return null;

		const response = await searchTxById({
			txId: target,
			getGQLData: permawebProvider.libs.getGQLData,
			store: store,
			dispatch: dispatch,
		});

		return getTokenMetadataFromResponse(response);
	}, [dispatch, permawebProvider.libs, target]);

	const fetchedMetadata = useVisibleData<TransferTokenMetadata | null, HTMLSpanElement>({
		cacheKey: shouldFetchMetadata ? target : null,
		enabled: shouldFetchMetadata,
		fetchData: fetchTokenMetadata,
		rootMargin: '120px',
	});

	React.useEffect(() => {
		if (fetchedMetadata.error) console.error(fetchedMetadata.error);
	}, [fetchedMetadata.error]);

	if (!isTransfer || !quantity) return null;

	const metadata = knownMetadata ?? cachedMetadata ?? fetchedMetadata.data ?? null;
	const formattedQuantity = formatTransferQuantity(quantity, metadata);
	const title = metadata?.ticker ? `${formattedQuantity} ${metadata.ticker}` : formattedQuantity;

	return (
		<S.Wrapper ref={fetchedMetadata.ref} aria-label={title}>
			<S.Tooltip className={'info'}>
				<span>{title}</span>
			</S.Tooltip>
			<span>(</span>
			<S.Quantity>{formattedQuantity}</S.Quantity>
			{metadata?.ticker && <S.Ticker>{metadata.ticker}</S.Ticker>}
			<span>)</span>
		</S.Wrapper>
	);
}
