export type AoReadSource = 'permawebos' | 'peers' | 'fallback';

export interface AoNetworkStatus {
	source: AoReadSource;
	extensionAvailable: boolean;
	processPeers: readonly string[];
	schedulePeers: readonly string[];
	linkedStatePeers: readonly string[];
}

export interface AoReadResult<T> {
	data: T;
	provider: string;
	source: AoReadSource;
}

export type { InjectedAoFetch } from 'helpers/aoNetwork';

export class AoReadError extends Error {
	constructor(public readonly code: 'cancelled' | 'timeout' | 'unavailable' | 'invalid-response' | 'invalid-input') {
		super(code);
		this.name = 'AoReadError';
	}
}
