import { AoReadError, type getAoReadTransport } from 'api/aoNetwork';

import type { TagType } from 'helpers/types';
import { checkValidAddress } from 'helpers/utils';

export type ArweaveScheduleMessage = {
	id: string;
	slot: number;
	blockHeight: number;
	blockIndex: number;
	sender: string;
	recipient: string | null;
	action: string | null;
	tags: TagType[];
};

export type ArweaveSchedulePage = {
	messages: ArweaveScheduleMessage[];
	latestSlot: number;
	totalCount: number;
	page: number;
	totalPages: number;
};

export type ArweaveSchedulePageArgs = {
	processId: string;
	page: number;
	/** Keep this snapshot when moving between pages; omit it to refresh the tip. */
	latestSlot?: number;
	signal?: AbortSignal;
};

export const ARWEAVE_SCHEDULE_PAGE_SIZE = 25;

function record(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AoReadError('invalid-response');
	return value as Record<string, unknown>;
}

function integer(value: unknown): number {
	if (typeof value !== 'number' && (typeof value !== 'string' || !/^(0|[1-9]\d*)$/.test(value)))
		throw new AoReadError('invalid-response');
	const parsed = Number(value);
	if (!Number.isSafeInteger(parsed) || parsed < 0) throw new AoReadError('invalid-response');
	return parsed;
}

function address(value: unknown): string {
	if (typeof value !== 'string' || !checkValidAddress(value)) throw new AoReadError('invalid-response');
	return value;
}

function parseAssignments(value: unknown, processId: string, from: number, to: number): ArweaveScheduleMessage[] {
	const assignments = record(value);
	const entries = Object.entries(assignments).filter(([key]) => /^\d+$/.test(key));
	// Dense slots are a protocol guarantee. Do not turn a lagging/truncated response into an empty page.
	if (entries.length !== to - from + 1) throw new AoReadError('invalid-response');
	const messages = entries.map(([key, value]) => {
		const assignment = record(value);
		const slot = integer(assignment.slot);
		if (String(slot) !== key || slot < from || slot > to || assignment.process !== processId)
			throw new AoReadError('invalid-response');
		const body = record(assignment.body);
		const commitments = Object.entries(record(body.commitments)).filter(
			([, commitment]) => record(commitment)['commitment-device'] === 'tx@1.0'
		);
		// The native transaction ID belongs to its tx@1.0 commitment, never the assignment/HMAC ID.
		if (commitments.length !== 1) throw new AoReadError('invalid-response');
		const [id, commitment] = commitments[0];
		if (slot === 0 && id !== processId) throw new AoReadError('invalid-response');
		if (body.action !== undefined && typeof body.action !== 'string') throw new AoReadError('invalid-response');
		return {
			id: address(id),
			slot,
			blockHeight: integer(assignment['block-height']),
			blockIndex: integer(assignment['block-index']),
			sender: address(record(commitment).committer),
			// Assign-To can schedule this input even when its native recipient is a different process.
			recipient: body.target === undefined || body.target === '' ? null : address(body.target),
			action: typeof body.action === 'string' ? body.action : null,
			tags: Object.entries(body).flatMap(([name, value]) =>
				name !== 'commitments' &&
				(typeof value === 'string' || (typeof value === 'number' && Number.isSafeInteger(value)))
					? [{ name, value: String(value) }]
					: []
			),
		};
	});
	return messages.sort((left, right) => right.slot - left.slot);
}

export function createArweaveScheduleReader(
	transport: ReturnType<typeof getAoReadTransport>,
	readLatestSlot: (processId: string, signal?: AbortSignal) => Promise<number>
): (args: ArweaveSchedulePageArgs) => Promise<ArweaveSchedulePage> {
	return async (args) => {
		if (!checkValidAddress(args.processId) || !Number.isSafeInteger(args.page) || args.page < 0)
			throw new AoReadError('invalid-input');
		const latestSlot = args.latestSlot ?? (await readLatestSlot(args.processId, args.signal));
		if (!Number.isSafeInteger(latestSlot) || latestSlot < -1 || latestSlot >= Number.MAX_SAFE_INTEGER)
			throw new AoReadError(args.latestSlot === undefined ? 'invalid-response' : 'invalid-input');
		const totalCount = latestSlot + 1;
		const totalPages = Math.ceil(totalCount / ARWEAVE_SCHEDULE_PAGE_SIZE);
		if (args.page >= Math.max(1, totalPages)) throw new AoReadError('invalid-input');
		if (latestSlot === -1) return { messages: [], latestSlot, totalCount, page: 0, totalPages };
		const to = latestSlot - args.page * ARWEAVE_SCHEDULE_PAGE_SIZE;
		const from = Math.max(0, to - ARWEAVE_SCHEDULE_PAGE_SIZE + 1);
		const response = await transport.readJson(
			`/${args.processId}~process@1.0/schedule&from=${from}&to=${to}/assignments?require-codec=json%401.0&accept-bundle=true`,
			{ signal: args.signal },
			(value) => parseAssignments(value, args.processId, from, to)
		);
		return { messages: response.data, latestSlot, totalCount, page: args.page, totalPages };
	};
}
