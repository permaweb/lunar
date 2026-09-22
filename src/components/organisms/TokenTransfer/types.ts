export type TokenTransferStatus =
	| { state: 'loading' }
	| { state: 'computing' }
	| { state: 'success' }
	| { state: 'failure'; message: string | null };
