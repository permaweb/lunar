import { type CommitmentInfo, isMessageRecord, messageText, type MessageValue } from 'api/aoCore';

import { checkValidAddress } from 'helpers/utils';

export const MESSAGE_FIELDS_PAGE_SIZE = 50;
export const MAX_MESSAGE_EXPANSION_DEPTH = 16;

export type MessageField = {
	key: string;
	value: MessageValue;
	type: 'link' | 'message' | 'list' | 'text' | 'integer' | 'number' | 'boolean' | 'null';
	linkId?: string;
};

export type FieldCoverage = {
	id: string;
	kind: CommitmentInfo['kind'] | 'unknown';
	status: 'unknown' | 'listed' | 'not-listed';
	position: number | null;
	fieldCount: number | null;
};

export function getMessageFields(value: MessageValue): MessageField[] {
	const entries: [string, MessageValue][] = Array.isArray(value)
		? value.map((item, index) => [String(index + 1), item])
		: isMessageRecord(value)
		? Object.entries(value)
		: [['', value]];
	return entries.map(([key, value]) => {
		const link = key.endsWith('+link');
		return {
			key,
			value,
			type: link
				? 'link'
				: Array.isArray(value)
				? 'list'
				: isMessageRecord(value)
				? 'message'
				: value === null
				? 'null'
				: typeof value === 'bigint' || (typeof value === 'number' && Number.isInteger(value))
				? 'integer'
				: typeof value === 'number'
				? 'number'
				: typeof value === 'boolean'
				? 'boolean'
				: 'text',
			linkId: link && typeof value === 'string' && checkValidAddress(value) ? value : undefined,
		};
	});
}

// Compare the received field name with each declared list. Do not union lists,
// equate a linked field with an inline field, or inherit coverage into children.
export function getFieldCoverage(key: string, commitments: CommitmentInfo[]): FieldCoverage[] {
	return commitments.map((commitment) => {
		const index = commitment.coverage?.indexOf(key) ?? -1;
		return {
			id: commitment.id,
			kind:
				commitment.kind === 'unsigned'
					? 'unsigned'
					: isMessageRecord(commitment.raw) && messageText(commitment.raw, 'signature')
					? 'signature'
					: 'unknown',
			status: commitment.coverage === null ? 'unknown' : index >= 0 ? 'listed' : 'not-listed',
			position: index >= 0 ? index + 1 : null,
			fieldCount: commitment.coverage?.length ?? null,
		};
	});
}
