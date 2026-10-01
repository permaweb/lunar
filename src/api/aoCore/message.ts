import JSONbig from 'json-bigint';

import { AoReadError } from 'api/aoNetwork';

import { checkValidAddress } from 'helpers/utils';

import type { AoCoreMessage, CommitmentInfo, MessageRecord, MessageValue, RecognitionEvidence } from './types';

const DEVICE = /^[a-z][a-z0-9_-]*@\d+\.\d+$/i;
const UNSAFE_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const losslessJson = JSONbig({
	alwaysParseAsBig: true,
	protoAction: 'error',
	constructorAction: 'error',
	strict: true,
});

type ParsedNumber = { isInteger: () => boolean; toNumber: () => number; toFixed: () => string };

function isParsedNumber(value: unknown): value is ParsedNumber {
	// JSON cannot supply methods. These instances are created only by json-bigint.
	return !!value && typeof value === 'object' && typeof (value as ParsedNumber).isInteger === 'function';
}

export function isMessageRecord(value: MessageValue | unknown): value is MessageRecord {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function messageText(message: MessageRecord, name: string): string | undefined {
	const entry = Object.entries(message).find(([key]) => key.toLowerCase() === name.toLowerCase());
	return typeof entry?.[1] === 'string' ? entry[1] : undefined;
}

/** Recognition is a display decision. None of this is cryptographic verification. */
export function recognizeAoMetadata(message: MessageRecord): RecognitionEvidence[] {
	const evidence: RecognitionEvidence[] = [];
	if (messageText(message, 'data-protocol')?.toLowerCase() === 'ao') evidence.push('protocol');
	if (['ao.TN.1', 'ao.N.1'].includes(messageText(message, 'variant'))) evidence.push('variant');
	if (
		DEVICE.test(messageText(message, 'device') ?? '') ||
		checkValidAddress(messageText(message, 'device+link') ?? '') ||
		checkValidAddress(messageText(message, 'device') ?? '')
	)
		evidence.push('device');
	if (
		isMessageRecord(message.commitments) &&
		Object.values(message.commitments).some(
			(commitment) => isMessageRecord(commitment) && DEVICE.test(messageText(commitment, 'commitment-device') ?? '')
		)
	)
		evidence.push('commitment');
	return evidence;
}

export function readCommitments(message: MessageRecord): CommitmentInfo[] {
	if (!isMessageRecord(message.commitments)) return [];
	return Object.entries(message.commitments).map(([id, raw]) => {
		const commitment = isMessageRecord(raw) ? raw : {};
		const device = messageText(commitment, 'commitment-device');
		const algorithm = messageText(commitment, 'type');
		const keyId = messageText(commitment, 'keyid');
		const unsigned = algorithm === 'hmac-sha256' || keyId?.startsWith('constant:');
		// A missing/malformed list means unknown coverage, never all fields.
		const coverage =
			Array.isArray(commitment.committed) && commitment.committed.every((key) => typeof key === 'string')
				? (commitment.committed as string[])
				: null;
		return {
			id,
			device,
			algorithm,
			keyId,
			kind: unsigned ? 'unsigned' : 'signature',
			committer: unsigned ? undefined : messageText(commitment, 'committer'),
			coverage,
			verification: device === 'httpsig@1.0' ? 'not-checked' : 'unsupported',
			raw,
		};
	});
}

export function parseAoCoreValue(text: string): MessageValue {
	let message: unknown;
	try {
		message = losslessJson.parse(text);
	} catch {
		throw new AoReadError('invalid-response');
	}
	let visited = 0;
	function normalize(value: unknown, depth: number): MessageValue {
		if (++visited > 50_000 || depth > 64) throw new AoReadError('invalid-response');
		if (isParsedNumber(value)) {
			const number = value.toNumber();
			if (!Number.isFinite(number)) throw new AoReadError('invalid-response');
			return value.isInteger() && !Number.isSafeInteger(number) ? BigInt(value.toFixed()) : number;
		}
		if (Array.isArray(value)) return value.map((child) => normalize(child, depth + 1));
		if (value && typeof value === 'object') {
			return Object.fromEntries(
				Object.entries(value).map(([key, child]) => {
					if (UNSAFE_KEYS.has(key)) throw new AoReadError('invalid-response');
					return [key, normalize(child, depth + 1)];
				})
			);
		}
		if (value === null) return null;
		if (typeof value === 'string' || typeof value === 'boolean') return value;
		throw new AoReadError('invalid-response');
	}
	return normalize(message, 0);
}

export function parseAoCoreMessage(
	text: string,
	requestedId: string,
	headers: Record<string, string> = {},
	context = false
): AoCoreMessage {
	const message = parseAoCoreValue(text);
	if (!isMessageRecord(message)) throw new AoReadError('invalid-response');
	const evidence = recognizeAoMetadata(message);
	if (context) evidence.push('context');
	const device = Object.entries(message).find(([key]) => key.toLowerCase() === 'device');
	const deviceLink = messageText(message, 'device+link');
	return {
		requestedId,
		message,
		rawText: text,
		headers,
		evidence,
		device: typeof device?.[1] === 'string' ? device[1] : deviceLink ?? null,
		deviceSource: device ? (typeof device[1] === 'string' ? 'explicit' : 'inline') : deviceLink ? 'linked' : 'default',
		commitments: readCommitments(message),
	};
}

export function messageJson(value: MessageValue): string {
	return losslessJson.stringify(value, null, 2);
}
