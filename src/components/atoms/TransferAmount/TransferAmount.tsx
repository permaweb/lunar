import React from 'react';
import { useDispatch } from 'react-redux';

import { TOKEN_DENOMINATIONS } from 'helpers/config';
import { searchTxById } from 'helpers/search';
import {
	formatTokenQuantity,
	getKnownTokenMetadata,
	getTokenMetadataFromResponse,
	hasDenomination,
	mergeTokenMetadata,
	TokenMetadata,
} from 'helpers/tokens';
import { TagType } from 'helpers/types';
import { getTagValue, hasPositiveAmount, isTransferAction, removeCommitments } from 'helpers/utils';
import { useVisibleData } from 'hooks/useVisibleData';
import { usePermawebProvider } from 'providers/PermawebProvider';
import { store } from 'store';
import { addTransaction, selectTransaction } from 'store/transactions/reducer';

import * as S from './styles';

type NativeArQuantity = {
	winston?: string | number | null;
	ar?: string | number | null;
};

type TransferQuantity = {
	value: string;
	metadata: TokenMetadata;
};

function getNativeArQuantity(quantity: NativeArQuantity | null | undefined): TransferQuantity | null {
	if (!quantity) return null;

	const metadata = {
		denomination: TOKEN_DENOMINATIONS.ar,
		ticker: 'AR',
	};

	if (hasPositiveAmount(quantity.winston)) {
		return {
			value: quantity.winston.toString(),
			metadata: metadata,
		};
	}

	if (hasPositiveAmount(quantity.ar)) {
		return {
			value: quantity.ar.toString(),
			metadata: {
				...metadata,
				denomination: null,
			},
		};
	}

	return null;
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
	if (!permawebProvider.legacyApi?.readProcess) return null;

	try {
		const response = await permawebProvider.legacyApi.readProcess({
			processId: processId,
			action: 'Info',
		});

		return safelyParseInfoResponse(response);
	} catch (e: any) {
		console.error(e);
		return null;
	}
}

export default function TransferAmount(props: {
	tags?: TagType[];
	target?: string | null;
	quantity?: NativeArQuantity | null;
}) {
	const dispatch = useDispatch();
	const permawebProvider = usePermawebProvider();

	const action = getTagValue(props.tags, 'Action');
	const nativeArQuantity = getNativeArQuantity(props.quantity);
	const quantity = nativeArQuantity?.value ?? getTagValue(props.tags, 'Quantity');
	const target = props.target ?? getTagValue(props.tags, 'Target');
	const isTaggedTransfer = isTransferAction(action);
	const isTransfer = isTaggedTransfer || !!nativeArQuantity;

	const knownMetadata = React.useMemo(() => getKnownTokenMetadata(target), [target]);
	const cachedTarget = React.useMemo(() => {
		if (!target) return null;

		return selectTransaction(store.getState(), target);
	}, [target]);
	const cachedMetadata = React.useMemo(() => getTokenMetadataFromResponse(cachedTarget), [cachedTarget]);
	const cachedHasDenomination = hasDenomination(cachedMetadata);
	const knownHasDenomination = hasDenomination(knownMetadata);

	const shouldFetchMetadata =
		isTaggedTransfer &&
		!!quantity &&
		!!target &&
		(!cachedTarget || (!cachedHasDenomination && !knownHasDenomination)) &&
		!!permawebProvider.legacyApi?.getGQLData;

	const fetchTarget = React.useCallback(async () => {
		if (!target) return null;

		const cached = selectTransaction(store.getState(), target);
		const cachedMetadata = getTokenMetadataFromResponse(cached);
		const knownMetadata = getKnownTokenMetadata(target);
		const cachedHasDenomination = hasDenomination(cachedMetadata);
		const knownHasDenomination = hasDenomination(knownMetadata);

		if (cached && (cachedHasDenomination || knownHasDenomination)) return cached;
		if (!permawebProvider.legacyApi?.getGQLData) return null;

		const shouldBypassCache = !!cached && !cachedHasDenomination && !knownHasDenomination;
		const response = await searchTxById({
			txId: target,
			getGQLData: permawebProvider.legacyApi.getGQLData,
			readProcess: permawebProvider.legacyApi.readProcess,
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
	}, [dispatch, permawebProvider.legacyApi, target]);

	const fetchedTarget = useVisibleData<any | null, HTMLSpanElement>({
		cacheKey: shouldFetchMetadata ? target : null,
		enabled: shouldFetchMetadata,
		fetchData: fetchTarget,
		rootMargin: `120px`,
	});
	const fetchedMetadata = React.useMemo(() => getTokenMetadataFromResponse(fetchedTarget.data), [fetchedTarget.data]);

	React.useEffect(() => {
		if (fetchedTarget.error) console.error(fetchedTarget.error);
	}, [fetchedTarget.error]);

	if (!isTransfer || !quantity) return null;

	const metadata = nativeArQuantity?.metadata ?? mergeTokenMetadata(knownMetadata, cachedMetadata, fetchedMetadata);
	const formattedQuantity = formatTokenQuantity(quantity, metadata);
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
