import { requestRemote } from 'api/http';

import { DEFAULT_LEGACY_SCHEDULER_URL } from 'helpers/config';
import { isArweaveId } from 'helpers/identities';

import type { LegacyTransactionSchedule } from './types';

const SCHEDULE_TIMEOUT_MS = 4_000;

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Schedule metadata is optional: an unavailable scheduler must not prevent opening a transaction. */
export async function readLegacyTransactionSchedule(args: {
	messageId: string;
	processId: string;
	signal?: AbortSignal;
}): Promise<LegacyTransactionSchedule | null> {
	if (!isArweaveId(args.messageId) || !isArweaveId(args.processId) || args.signal?.aborted) return null;
	const controller = new AbortController();
	const handleAbort = () => controller.abort();
	args.signal?.addEventListener('abort', handleAbort, { once: true });
	const timeout = setTimeout(handleAbort, SCHEDULE_TIMEOUT_MS);
	try {
		const response = await requestRemote(
			`${DEFAULT_LEGACY_SCHEDULER_URL}/${encodeURIComponent(args.messageId)}?process-id=${encodeURIComponent(
				args.processId
			)}`,
			{ signal: controller.signal }
		);
		if (!response.ok) return null;
		const parsed: unknown = await response.json();
		if (!isRecord(parsed) || !isRecord(parsed.assignment) || !Array.isArray(parsed.assignment.tags)) return null;
		const tags = parsed.assignment.tags;
		const readInteger = (name: string): number | undefined => {
			const tag = tags.find(
				(tag) => isRecord(tag) && typeof tag.name === 'string' && tag.name.toLowerCase() === name.toLowerCase()
			);
			if (!isRecord(tag) || typeof tag.value !== 'string' || !/^\d+$/.test(tag.value)) return undefined;
			const value = Number(tag.value);
			return Number.isSafeInteger(value) ? value : undefined;
		};
		const height = readInteger('Block-Height');
		const timestamp = readInteger('Timestamp');
		const slot = readInteger('Nonce');
		if (height === undefined && timestamp === undefined && slot === undefined) return null;
		return {
			block: {
				...(height !== undefined ? { height } : {}),
				...(timestamp !== undefined ? { timestamp: timestamp / 1000 } : {}),
			},
			...(slot !== undefined ? { slot } : {}),
		};
	} catch {
		// Retain the transaction's known metadata when this best-effort lookup fails or times out.
		return null;
	} finally {
		clearTimeout(timeout);
		args.signal?.removeEventListener('abort', handleAbort);
	}
}
