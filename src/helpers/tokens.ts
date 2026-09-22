import { PROCESSES, TOKEN_DENOMINATIONS } from './config';
import { TagType } from './types';
import { formatUnits, getTagValue, isTransferAction } from './utils';

export type TokenMetadata = {
	denomination: number | null;
	ticker?: string | null;
	logo?: string | null;
};

export type TokenTransferDetails = {
	token: string;
	from: string | null;
	recipient: string;
	quantity: string;
};

export function getTokenKey(target: string | null | undefined) {
	if (!target) return null;

	for (const [token, processId] of Object.entries(PROCESSES)) {
		if (processId === target) return token;
	}

	return null;
}

export function getKnownTokenMetadata(target: string | null | undefined): TokenMetadata | null {
	const token = getTokenKey(target);
	if (!token || !TOKEN_DENOMINATIONS[token]) return null;

	return {
		denomination: TOKEN_DENOMINATIONS[token],
		ticker: token.toUpperCase(),
	};
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

// Reads token metadata from an Info response or from the process tags, which HyperBEAM writes in lowercase.
export function getTokenMetadataFromResponse(response: any): TokenMetadata | null {
	if (!response) return null;

	const rawDenomination = getResponseValue(response, 'Denomination');
	const hasRawDenomination = rawDenomination !== null && rawDenomination !== undefined && rawDenomination !== '';
	const denomination = hasRawDenomination ? Number(rawDenomination) : null;
	const ticker = getResponseValue(response, 'Ticker');

	if ((!hasRawDenomination || !Number.isFinite(denomination)) && !ticker) return null;

	return {
		denomination: Number.isFinite(denomination) ? denomination : null,
		ticker: ticker ?? null,
		logo: getResponseValue(response, 'Logo'),
	};
}

export function hasDenomination(metadata: TokenMetadata | null) {
	return metadata?.denomination !== null && metadata?.denomination !== undefined;
}

export function formatTokenQuantity(quantity: string, metadata: TokenMetadata | null) {
	if (!hasDenomination(metadata)) return quantity;

	try {
		return formatUnits(quantity, metadata.denomination);
	} catch (e: any) {
		console.error(e);
		return quantity;
	}
}

export function mergeTokenMetadata(...metadataEntries: (TokenMetadata | null)[]): TokenMetadata | null {
	const metadata = metadataEntries.reduce<TokenMetadata | null>((acc, entry) => {
		if (!entry) return acc;

		return {
			denomination: entry.denomination ?? acc?.denomination ?? null,
			ticker: entry.ticker ?? acc?.ticker ?? null,
			logo: entry.logo ?? acc?.logo ?? null,
		};
	}, null);

	if (!metadata?.ticker && metadata?.denomination === null) return null;

	return metadata;
}

// A token transfer is a message to a token process carrying the Transfer action, a recipient, and a quantity.
// HyperBEAM sends these as plain L1 transactions with lowercase tags and no Data-Protocol or Type tag.
export function getTokenTransfer(
	transaction:
		| {
				recipient?: string | null;
				owner?: { address?: string | null } | null;
				tags?: TagType[] | null;
		  }
		| null
		| undefined
): TokenTransferDetails | null {
	const tags = transaction?.tags ?? [];
	if (!isTransferAction(getTagValue(tags, 'Action'))) return null;

	const token = transaction?.recipient || getTagValue(tags, 'Target');
	const recipient = getTagValue(tags, 'Recipient');
	const quantity = getTagValue(tags, 'Quantity');
	if (!token || !recipient || !quantity) return null;

	return {
		token: token,
		from: getTagValue(tags, 'From-Process') ?? transaction?.owner?.address ?? null,
		recipient: recipient,
		quantity: quantity,
	};
}
