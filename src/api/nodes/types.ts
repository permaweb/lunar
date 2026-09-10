export type ArweavePeer = { address: string; ip: string; port: number };
export type NodeCountry = { ip: string; countryCode: string };
export type NodeCountries = { countries: NodeCountry[]; source: 'analytics' | 'bundled' };
export type NodeObservation = { peer: string; checkedAt: number } & (
	| {
			status: 'reachable';
			latencyMs: number;
			info: { height: number; version: number; release: number; peers: number };
	  }
	| { status: 'unavailable' }
);
export type NodesErrorCode = 'cancelled' | 'timeout' | 'unavailable' | 'invalid-response' | 'rate-limited';
export class NodesApiError extends Error {
	constructor(readonly code: NodesErrorCode) {
		super(code);
		this.name = 'NodesApiError';
	}
}
export type NodesApi = {
	getCachedInfo: (peers: ArweavePeer[]) => NodeObservation[];
	supportsInfo: (signal: AbortSignal) => Promise<boolean>;
	getInfo: (peer: ArweavePeer, signal: AbortSignal) => Promise<NodeObservation>;
	getPeers: (signal: AbortSignal, refresh?: boolean) => Promise<ArweavePeer[]>;
	getCountries: (peers: ArweavePeer[], signal: AbortSignal) => Promise<NodeCountries>;
};
