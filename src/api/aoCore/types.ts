import type { AoReadResult } from 'api/aoNetwork';

export type MessageValue = string | number | bigint | boolean | null | MessageValue[] | MessageRecord;
export type MessageRecord = { [key: string]: MessageValue };
export type RecognitionEvidence = 'protocol' | 'variant' | 'device' | 'commitment' | 'context';
export type CommitmentInfo = {
	id: string;
	device?: string;
	algorithm?: string;
	committer?: string;
	keyId?: string;
	kind: 'signature' | 'unsigned';
	coverage: string[] | null;
	verification: 'not-checked' | 'unsupported';
	raw: MessageValue;
};

export type AoCoreMessage = {
	requestedId: string;
	message: MessageRecord;
	rawText: string;
	headers: Record<string, string>;
	evidence: RecognitionEvidence[];
	device: string | null;
	deviceSource: 'explicit' | 'linked' | 'inline' | 'default';
	commitments: CommitmentInfo[];
};
export type AoCoreReadResult = AoReadResult<AoCoreMessage>;
export type AoCoreValue = { value: MessageValue; rawText: string; headers: Record<string, string> };
export type AoCoreReadState<T> =
	| { status: 'idle' | 'loading' | 'unrecognized' }
	| { status: 'ready'; result: AoReadResult<T> }
	| { status: 'error'; code: 'unavailable' | 'invalid-response' | 'timeout' };
export type AoCoreState = AoCoreReadState<AoCoreMessage>;
