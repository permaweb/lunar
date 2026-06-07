import { Types } from '@permaweb/libs';

import { addTransaction, selectTransaction } from 'store/transactions/reducer';

import { DEFAULT_GATEWAYS, DEFAULT_LEGACY_SCHEDULER_URL, FLAGS } from './config';
import { getTxEndpoint } from './endpoints';
import { MessageVariantEnum, SearchTxArgs, TagType } from './types';
import { getTagValue, normalizeGqlResponse, normalizeTagKeys } from './utils';

const MAX_DEPTH = 10;
const DIRECT_LOOKUP_TAG_HEADERS = [
	'action',
	'anchor',
	'app-name',
	'app-version',
	'authority',
	'content-type',
	'data-protocol',
	'epoch',
	'from-process',
	'module',
	'name',
	'nonce',
	'pushed-for',
	'quantity',
	'recipient',
	'reference',
	'scheduler',
	'sdk',
	'timestamp',
	'type',
	'variant',
	'zone',
];

function base64UrlToBytes(value: string) {
	const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
	const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
	const decoded = atob(padded);
	const bytes = new Uint8Array(decoded.length);

	for (let i = 0; i < decoded.length; i++) {
		bytes[i] = decoded.charCodeAt(i);
	}

	return bytes;
}

function bytesToBase64Url(bytes: Uint8Array) {
	let binary = '';

	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}

	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64UrlText(value: string) {
	try {
		return new TextDecoder().decode(base64UrlToBytes(value));
	} catch (e: any) {
		return null;
	}
}

function getSignatureInputParam(signatureInput: string | null, paramName: string) {
	if (!signatureInput) return null;

	const escapedParamName = paramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const match = signatureInput.match(new RegExp(`${escapedParamName}="([^"]*)"`));

	return match?.[1] ?? null;
}

function getPublicKeyFromSignatureInput(signatureInput: string | null) {
	if (!signatureInput) return null;

	const keyIdRegex = /keyid="([^"]*)"/g;
	let match = keyIdRegex.exec(signatureInput);

	while (match) {
		const keyId = match[1];

		if (keyId.startsWith('publickey:')) {
			return keyId.replace(/^publickey:/, '');
		}

		match = keyIdRegex.exec(signatureInput);
	}

	return null;
}

function headerNameToTagName(headerName: string) {
	return headerName
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
		.join('-');
}

function parseOriginalTags(signatureInput: string | null) {
	const originalTags = getSignatureInputParam(signatureInput, 'original-tags');
	if (!originalTags) return [];

	return originalTags
		.split(/,\s*/)
		.map((entry) => {
			const match = entry.match(/^\d+:([^:]+):(.+)$/);
			if (!match) return null;

			const [, name, encodedValue] = match;
			const value = decodeBase64UrlText(encodedValue) ?? encodedValue;

			return { name, value };
		})
		.filter(Boolean) as TagType[];
}

function getFallbackDirectLookupTags(headers: Headers) {
	return DIRECT_LOOKUP_TAG_HEADERS.reduce((tags: TagType[], headerName) => {
		const value = headers.get(headerName);

		if (value) {
			tags.push({
				name: headerNameToTagName(headerName),
				value,
			});
		}

		return tags;
	}, []);
}

function getDirectLookupTags(headers: Headers) {
	const signatureInput = headers.get('signature-input');
	const tags = parseOriginalTags(signatureInput);

	return normalizeTagKeys(tags.length > 0 ? tags : getFallbackDirectLookupTags(headers));
}

async function getOwnerAddressFromSignatureInput(signatureInput: string | null) {
	const publicKey = getPublicKeyFromSignatureInput(signatureInput);
	if (!publicKey || !globalThis.crypto?.subtle) return null;

	try {
		const digest = await globalThis.crypto.subtle.digest('SHA-256', base64UrlToBytes(publicKey));

		return bytesToBase64Url(new Uint8Array(digest));
	} catch (e: any) {
		return null;
	}
}

function getNumberHeader(headers: Headers, name: string) {
	const value = headers.get(name);
	if (!value) return null;

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function getNumberTag(tags: TagType[] | undefined, name: string) {
	const value = getTagValue(tags, name);
	if (!value) return null;

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function hasBlockMetadata(response: Types.GQLNodeResponseType) {
	return response?.node?.block?.height != null || response?.node?.block?.timestamp != null;
}

function hasScheduleMetadata(response: Types.GQLNodeResponseType) {
	return hasBlockMetadata(response) && response?.node?.slot != null;
}

function isLegacyMessage(response: Types.GQLNodeResponseType) {
	const tags = response?.node?.tags;

	return getTagValue(tags, 'Variant') === MessageVariantEnum.Legacynet && getTagValue(tags, 'Type') === 'Message';
}

function isWalletResponse(response: Types.GQLNodeResponseType) {
	return getTagValue(response?.node?.tags, 'Type') === 'Wallet';
}

function needsPushedMessageSchedule(response: Types.GQLNodeResponseType) {
	return (
		isLegacyMessage(response) && !!getTagValue(response?.node?.tags, 'Pushed-For') && !hasScheduleMetadata(response)
	);
}

function shouldUseCachedTransaction(response: Types.GQLNodeResponseType) {
	if (isWalletResponse(response)) return true;
	if (!hasBlockMetadata(response)) return false;

	return !needsPushedMessageSchedule(response);
}

async function hydrateLegacyMessageSchedule(response: Types.GQLNodeResponseType) {
	if (hasScheduleMetadata(response) || !isLegacyMessage(response)) {
		return response;
	}

	const tags = response?.node?.tags;
	const recipient = response.node.recipient ?? getTagValue(tags, 'Target');
	if (!recipient) return response;

	try {
		const schedulerResponse = await fetch(
			`${DEFAULT_LEGACY_SCHEDULER_URL}/${response.node.id}?process-id=${recipient}`
		);
		const parsedSchedulerResponse = await schedulerResponse.json();
		const assignmentTags = parsedSchedulerResponse?.assignment?.tags;

		if (!assignmentTags?.length) return response;

		const height = getNumberTag(assignmentTags, 'Block-Height');
		const timestamp = getNumberTag(assignmentTags, 'Timestamp');
		const slot = getNumberTag(assignmentTags, 'Nonce');

		return {
			...response,
			node: {
				...response.node,
				block: {
					...response.node.block,
					...(height !== null ? { height } : {}),
					...(timestamp !== null ? { timestamp: timestamp / 1000 } : {}),
				},
				...(slot !== null ? { slot } : {}),
			},
		};
	} catch (e: any) {
		console.error(e);
		return response;
	}
}

async function buildDirectLookupResponse(
	txId: string,
	directLookup: Response
): Promise<Types.GQLNodeResponseType | null> {
	if (!directLookup.ok) return null;

	const headers = directLookup.headers;
	const tags = getDirectLookupTags(headers);
	if (tags.length <= 0 || !getTagValue(tags, 'Type')) return null;

	const signatureInput = headers.get('signature-input');
	const ownerAddress = await getOwnerAddressFromSignatureInput(signatureInput);
	const recipient = headers.get('target') ?? getSignatureInputParam(signatureInput, 'field-target');
	const blockHeight = getNumberHeader(headers, 'block-height');
	const blockTimestamp = getNumberHeader(headers, 'block-timestamp');
	const slot = getNumberHeader(headers, 'slot');

	return {
		cursor: null,
		node: {
			id: txId,
			recipient: recipient ?? undefined,
			tags: tags,
			data: {
				size: getTagValue(tags, 'Data-Size') ?? headers.get('content-length') ?? '0',
				type: getTagValue(tags, 'Content-Type'),
			},
			owner: {
				address: ownerAddress,
			},
			block:
				blockHeight !== null || blockTimestamp !== null
					? {
							height: blockHeight,
							timestamp: blockTimestamp,
					  }
					: null,
			...(slot !== null ? { slot } : {}),
		},
	};
}

function cacheTransaction(
	response: Types.GQLNodeResponseType,
	args: SearchTxArgs,
	opts?: { skipBlockHeightCheck: boolean }
) {
	if (FLAGS.USE_TX_CACHE && args.store && args.dispatch) {
		if (opts?.skipBlockHeightCheck || hasBlockMetadata(response)) {
			args.dispatch(addTransaction(args.txId, response));
		}
	}
}

async function resolveResponseData(
	responseData: Types.GQLNodeResponseType,
	args: SearchTxArgs,
	depth: number
): Promise<Types.GQLNodeResponseType> {
	/* Filter pushed messages by checking the authority */
	const fromProcess = getTagValue(responseData.node?.tags, 'From-Process');
	const messageOwner = responseData.node?.owner?.address;

	// No authority check needed
	if (!fromProcess || !messageOwner) {
		cacheTransaction(responseData, args);
		return responseData;
	}

	// Prevent infinite recursion
	if (depth >= MAX_DEPTH) {
		console.warn(`Max depth ${MAX_DEPTH} reached when searching for tx ${args.txId}`);
		return responseData;
	}

	try {
		const fromProcessResponse = await searchTxById(
			{
				txId: fromProcess,
				getGQLData: args.getGQLData,
				store: args.store,
				dispatch: args.dispatch,
			},
			depth + 1
		);

		const fromProcessVariant = getTagValue(fromProcessResponse?.node?.tags, 'Variant');

		if (fromProcessVariant === MessageVariantEnum.Mainnet) {
			const mainnetResponseData = await hydrateLegacyMessageSchedule(responseData);

			cacheTransaction(mainnetResponseData, args);
			return mainnetResponseData;
		}

		const fromProcessAuthority = getTagValue(fromProcessResponse?.node?.tags, 'Authority');

		// Reject if authority doesn't match owner
		if (fromProcessAuthority && fromProcessAuthority !== messageOwner) {
			return null;
		}

		const legacynetResponseData = await hydrateLegacyMessageSchedule(responseData);

		cacheTransaction(legacynetResponseData, args);
		return legacynetResponseData;
	} catch (e: any) {
		console.error(e);
		return responseData;
	}
}

export async function searchTxById(args: SearchTxArgs, depth: number = 0): Promise<Types.GQLNodeResponseType> {
	if (FLAGS.USE_TX_CACHE && args.store) {
		const cached = selectTransaction(args.store.getState(), args.txId);
		if (cached && shouldUseCachedTransaction(cached)) {
			return cached;
		}
	}

	try {
		const url = getTxEndpoint(args.txId);
		const directLookup = await fetch(url, {
			redirect: 'follow',
		});
		const directLookupResponse = await buildDirectLookupResponse(args.txId, directLookup);

		if (directLookupResponse) {
			const normalizedDirectResponse = await normalizeGqlResponse({
				count: 1,
				nextCursor: null,
				previousCursor: null,
				data: [directLookupResponse],
			});

			return await resolveResponseData(
				normalizedDirectResponse?.data?.[0] ?? (directLookupResponse as any),
				args,
				depth
			);
		}
	} catch (e: any) {
		console.error(e);
	}

	try {
		let response: any = null;
		let lastError: any = null;

		for (const gqlArgs of [
			{
				id: [args.txId],
			},
			{
				gateway: DEFAULT_GATEWAYS.fallback,
				id: [args.txId],
			},
			{
				gateway: DEFAULT_GATEWAYS.arweave,
				id: [args.txId],
			},
		]) {
			try {
				response = await args.getGQLData(gqlArgs);
				if (response.data?.length > 0) break;
			} catch (e: any) {
				lastError = e;
				console.error(e);
			}
		}

		if (!response && lastError) throw lastError;
		if (!response) response = { data: [] };

		response = await normalizeGqlResponse(response);

		const responseData = response?.data?.[0];

		if (!responseData) {
			/* Check if this is a wallet based on activity */
			try {
				const activityResponse = await args.getGQLData({
					owners: [args.txId],
				});

				if (activityResponse?.data?.length > 0) {
					const walletResponse = {
						cursor: null,
						node: {
							id: args.txId,
							tags: [{ name: 'Type', value: 'Wallet' }],
							data: null,
							owner: {
								address: null,
							},
							block: {
								height: null,
								timestamp: null,
							},
						},
					};

					cacheTransaction(walletResponse as Types.GQLNodeResponseType, args, { skipBlockHeightCheck: true });
				}
			} catch (e: any) {
				console.error(e);
			}

			return null;
		}

		return await resolveResponseData(responseData, args, depth);
	} catch (e: any) {
		throw new Error(e);
	}
}
