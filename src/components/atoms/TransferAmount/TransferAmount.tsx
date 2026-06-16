import React from 'react';
import { useDispatch } from 'react-redux';

import { DEFAULT_ACTIONS, PROCESSES, TOKEN_DENOMINATIONS } from 'helpers/config';
import { searchTxById } from 'helpers/search';
import { TagType } from 'helpers/types';
import { formatUnits, getTagValue, removeCommitments } from 'helpers/utils';
import { useVisibleData } from 'hooks/useVisibleData';
import { usePermawebProvider } from 'providers/PermawebProvider';
import { store } from 'store';
import { addTransaction, selectTransaction } from 'store/transactions/reducer';

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
	const hasRawDenomination = rawDenomination !== null && rawDenomination !== undefined && rawDenomination !== '';
	const denomination = hasRawDenomination ? Number(rawDenomination) : null;
	const ticker = getResponseValue(response, 'Ticker');

	if ((!hasRawDenomination || !Number.isFinite(denomination)) && !ticker) return null;

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

function hasDenomination(metadata: TransferTokenMetadata | null) {
	return metadata?.denomination !== null && metadata?.denomination !== undefined;
}

function mergeTokenMetadata(...metadataEntries: (TransferTokenMetadata | null)[]): TransferTokenMetadata | null {
	const metadata = metadataEntries.reduce<TransferTokenMetadata | null>((acc, entry) => {
		if (!entry) return acc;

		return {
			denomination: entry.denomination ?? acc?.denomination ?? null,
			ticker: entry.ticker ?? acc?.ticker ?? null,
		};
	}, null);

	if (!metadata?.ticker && metadata?.denomination === null) return null;

	return metadata;
}

function mergeTargetResponse(cachedTarget: any, response: any) {
	if (!cachedTarget) return response;
	if (!response) return cachedTarget;

	const mergedResponse = {
		...cachedTarget,
		...response,
		node: {
			...cachedTarget.node,
			...response.node,
			tags: response.node?.tags?.length ? response.node.tags : cachedTarget.node?.tags,
		},
	};

	for (const key of ['Denomination', 'denomination', 'Ticker', 'ticker', 'Logo', 'logo']) {
		if (mergedResponse[key] === null || mergedResponse[key] === undefined) {
			mergedResponse[key] = cachedTarget[key];
		}
	}

	return mergedResponse;
}

function safelyParseInfoResponse(response: any): any {
	if (typeof response !== 'string') return removeCommitments(response);

	const trimmed = response.trim();
	if (!trimmed) return response;

	try {
		return removeCommitments(JSON.parse(trimmed));
	} catch {
		return response;
	}
}

async function readTokenInfo(processId: string, permawebProvider: any) {
	if (!permawebProvider.libs?.readProcess) return null;

	try {
		const response = await permawebProvider.libs.readProcess({
			processId: processId,
			action: 'Info',
		});

		return safelyParseInfoResponse(response);
	} catch (e: any) {
		console.error(e);
		return null;
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
	const cachedTarget = React.useMemo(() => {
		if (!target) return null;

		return selectTransaction(store.getState(), target);
	}, [target]);
	const cachedMetadata = React.useMemo(() => getTokenMetadataFromResponse(cachedTarget), [cachedTarget]);
	const cachedHasDenomination = hasDenomination(cachedMetadata);
	const knownHasDenomination = hasDenomination(knownMetadata);

	const shouldFetchMetadata =
		isTransfer &&
		!!quantity &&
		!!target &&
		(!cachedTarget || (!cachedHasDenomination && !knownHasDenomination)) &&
		!!permawebProvider.libs?.getGQLData;

	const fetchTarget = React.useCallback(async () => {
		if (!target) return null;

		const cached = selectTransaction(store.getState(), target);
		const cachedMetadata = getTokenMetadataFromResponse(cached);
		const knownMetadata = getKnownTokenMetadata(target);
		const cachedHasDenomination = hasDenomination(cachedMetadata);
		const knownHasDenomination = hasDenomination(knownMetadata);

		if (cached && (cachedHasDenomination || knownHasDenomination)) return cached;
		if (!permawebProvider.libs?.getGQLData) return null;

		const shouldBypassCache = !!cached && !cachedHasDenomination && !knownHasDenomination;
		const response = await searchTxById({
			txId: target,
			getGQLData: permawebProvider.libs.getGQLData,
			store: shouldBypassCache ? undefined : store,
			dispatch: shouldBypassCache ? undefined : dispatch,
		});

		let mergedResponse = mergeTargetResponse(cached, response);
		const mergedMetadata = mergeTokenMetadata(
			knownMetadata,
			getTokenMetadataFromResponse(cached),
			getTokenMetadataFromResponse(mergedResponse)
		);

		if (!hasDenomination(mergedMetadata)) {
			const infoResponse = await readTokenInfo(target, permawebProvider);
			mergedResponse = mergeTargetResponse(mergedResponse, infoResponse);
		}

		if (mergedResponse?.node) dispatch(addTransaction(target, mergedResponse));

		return mergedResponse;
	}, [dispatch, permawebProvider.libs, target]);

	const fetchedTarget = useVisibleData<any | null, HTMLSpanElement>({
		cacheKey: shouldFetchMetadata ? target : null,
		enabled: shouldFetchMetadata,
		fetchData: fetchTarget,
		rootMargin: '120px',
	});
	const fetchedMetadata = React.useMemo(() => getTokenMetadataFromResponse(fetchedTarget.data), [fetchedTarget.data]);

	React.useEffect(() => {
		if (fetchedTarget.error) console.error(fetchedTarget.error);
	}, [fetchedTarget.error]);

	if (!isTransfer || !quantity) return null;

	const metadata = mergeTokenMetadata(knownMetadata, cachedMetadata, fetchedMetadata);
	const formattedQuantity = formatTransferQuantity(quantity, metadata);
	const title = metadata?.ticker ? `${formattedQuantity} ${metadata.ticker}` : formattedQuantity;

	return (
		<S.Wrapper ref={fetchedTarget.ref} aria-label={title}>
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
