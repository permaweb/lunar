import { requestRemote } from 'api/http';

import { getTxEndpoint } from 'helpers/endpoints';
import type { GQLNodeResponseType, TagType } from 'helpers/types';
import { checkValidAddress, getTagValue } from 'helpers/utils';

import type { TransactionBody, TransactionData, TransactionDataErrorCode } from './types';

const DECIMAL_INTEGER_PATTERN = /^\d+$/;
const BUNDLE_PARAM_PATTERN = /;\s*bundle="true"/i;
const HTML_MEDIA_TYPES = ['text/html', 'application/xhtml+xml'];
const PATH_MANIFEST_MEDIA_TYPE = 'application/x.arweave-manifest+json';
const TEXT_DECODER = new TextDecoder();

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

function getSignatureInputHeaderNames(signatureInput: string | null) {
	if (!signatureInput) return [];

	const headerNames = new Set<string>();
	const componentListRegex = /\(([^)]*)\)/g;
	let listMatch = componentListRegex.exec(signatureInput);

	while (listMatch) {
		const componentRegex = /"([^"]+)"/g;
		let componentMatch = componentRegex.exec(listMatch[1]);

		while (componentMatch) {
			const headerName = componentMatch[1];
			if (!headerName.startsWith('@')) headerNames.add(headerName);

			componentMatch = componentRegex.exec(listMatch[1]);
		}

		listMatch = componentListRegex.exec(signatureInput);
	}

	return Array.from(headerNames);
}

function getDirectLookupHeaderTags(headers: Headers, signatureInput: string | null) {
	return getSignatureInputHeaderNames(signatureInput).reduce((tags: TagType[], headerName) => {
		const value = headers.get(headerName);

		if (value) {
			tags.push({
				name: headerName,
				value,
			});
		}

		return tags;
	}, []);
}

function mergeDirectLookupTags(originalTags: TagType[], headerTags: TagType[]) {
	const seenNames = new Set(originalTags.map((tag) => tag.name.toLowerCase()));

	return headerTags.reduce(
		(tags, tag) => {
			const name = tag.name.toLowerCase();
			if (!seenNames.has(name)) {
				seenNames.add(name);
				tags.push(tag);
			}

			return tags;
		},
		[...originalTags]
	);
}

function getDirectLookupTags(headers: Headers) {
	const signatureInput = headers.get('signature-input');
	const originalTags = parseOriginalTags(signatureInput);
	const headerTags = getDirectLookupHeaderTags(headers, signatureInput);

	return mergeDirectLookupTags(originalTags, headerTags);
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

function getMediaType(contentType: string | null | undefined) {
	return contentType?.split(';')[0].trim().toLowerCase() || null;
}

function parseDataSize(value: unknown) {
	if (typeof value === 'number') return Number.isSafeInteger(value) && value >= 0 ? value : null;
	if (typeof value !== 'string' || !DECIMAL_INTEGER_PATTERN.test(value.trim())) return null;

	const size = Number(value.trim());
	return Number.isSafeInteger(size) ? size : null;
}

function dataError(code: TransactionDataErrorCode): TransactionData {
	return { status: 'error', code };
}

/**
 * Classifies a transaction response body from its headers. HyperBEAM gateways answer with the signed message as
 * headers and commit a data body through a covered `content-digest`. A message without data has no digest, and the
 * node fills the body with its own web UI, so that body and its content type must never be read as the data.
 */
export function getTransactionBody(headers: Headers): TransactionBody {
	const signatureInput = headers.get('signature-input');
	if (!signatureInput) return 'raw';

	const signedComponents = getSignatureInputHeaderNames(signatureInput).map((name) => name.toLowerCase());
	if (signedComponents.includes('content-digest')) return 'committed';

	return BUNDLE_PARAM_PATTERN.test(signatureInput) ? 'bundle' : 'none';
}

function getDirectLookupDataSize(tags: TagType[], headers: Headers, body: TransactionBody) {
	const taggedSize = getTagValue(tags, 'Data-Size');
	if (taggedSize) return taggedSize;
	if (body === 'none') return '0';
	if (body === 'bundle') return null;

	return headers.get('content-length');
}

function getDirectLookupDataType(tags: TagType[], headers: Headers, body: TransactionBody) {
	const taggedType = getTagValue(tags, 'Content-Type');
	if (taggedType) return taggedType;

	return body === 'raw' || body === 'committed' ? headers.get('content-type') : null;
}

async function buildDirectLookupResponse(txId: string, directLookup: Response): Promise<GQLNodeResponseType | null> {
	if (!directLookup.ok) return null;

	const headers = directLookup.headers;
	const tags = getDirectLookupTags(headers);
	const body = getTransactionBody(headers);

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
				size: getDirectLookupDataSize(tags, headers, body) ?? undefined,
				type: getDirectLookupDataType(tags, headers, body) ?? undefined,
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

/** Reads a transaction's signed metadata directly from the gateway, or null when the gateway has no such message. */
export async function lookupTransaction(txId: string): Promise<GQLNodeResponseType | null> {
	const directLookup = await requestRemote(getTxEndpoint(txId), {
		redirect: 'follow',
	});

	return await buildDirectLookupResponse(txId, directLookup);
}

/**
 * Reads a transaction's data. `knownSize` is the recorded data size (GraphQL `data.size` or the direct lookup), and
 * `contentType` is the content type the transaction declares. A body is returned only when it is the transaction's
 * own data: a node page served for a message without data, or a body whose length contradicts the recorded size,
 * is rejected here so callers never render it.
 */
export async function readTransactionData(args: {
	txId: string;
	knownSize?: string | number | null;
	contentType?: string | null;
	signal?: AbortSignal;
}): Promise<TransactionData> {
	if (!checkValidAddress(args.txId)) return dataError('invalid-input');

	const knownSize = parseDataSize(args.knownSize);
	if (knownSize === 0) return { status: 'empty' };

	let response: Response;
	try {
		response = await requestRemote(getTxEndpoint(args.txId), { signal: args.signal });
	} catch {
		return dataError(args.signal?.aborted ? 'cancelled' : 'unavailable');
	}

	if (response.status === 404) return dataError('not-found');
	if (!response.ok) return dataError('unavailable');

	const body = getTransactionBody(response.headers);
	if (body === 'none') return knownSize === null ? { status: 'empty' } : dataError('invalid-response');
	if (body === 'bundle') return dataError('invalid-response');

	const declaredType = getMediaType(args.contentType);
	const responseType = getMediaType(response.headers.get('content-type'));
	// Gateways resolve a path manifest to its index document, so its body is neither the recorded size nor its type.
	const isPathManifest = declaredType === PATH_MANIFEST_MEDIA_TYPE;
	const isUndeclaredHtml =
		HTML_MEDIA_TYPES.includes(responseType ?? '') && !HTML_MEDIA_TYPES.includes(declaredType ?? '');

	// Without a signed digest, an HTML page is only the data when the transaction itself declares HTML.
	if (body === 'raw' && isUndeclaredHtml && !isPathManifest) return dataError('invalid-response');

	let bytes: Uint8Array;
	try {
		bytes = new Uint8Array(await response.arrayBuffer());
	} catch {
		return dataError(args.signal?.aborted ? 'cancelled' : 'unavailable');
	}

	if (knownSize !== null && bytes.byteLength !== knownSize && !isPathManifest) return dataError('invalid-response');
	if (bytes.byteLength === 0) return { status: 'empty' };

	return {
		status: 'content',
		text: TEXT_DECODER.decode(bytes),
		contentType: args.contentType?.trim() || response.headers.get('content-type') || null,
	};
}
