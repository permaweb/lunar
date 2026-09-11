export type NodeErrorCode =
	| 'cancelled'
	| 'timeout'
	| 'unavailable'
	| 'not-found'
	| 'invalid-input'
	| 'invalid-response'
	| 'rate-limited'
	| 'chain-changed';

export class ArweaveNodeError extends Error {
	constructor(readonly code: NodeErrorCode, readonly status?: number) {
		super(code);
		this.name = 'ArweaveNodeError';
	}
}

export type NodeInfo = {
	network: string;
	height: number;
	hash: string;
	version: number;
	release: number;
	peers: number;
	queueLength: number | null;
	latency: number | null;
	blocks: number | null;
	gitHash: string | null;
};
export type NodeBlock = {
	height: number;
	hash: string;
	previous: string;
	timestamp: number;
	miner: string | null;
	reward: string | null;
	denomination: number;
	transactions: number;
	dataSize: string | null;
	weaveSize: string | null;
};
export type NodeTransaction = {
	id: string;
	tags: { name: string; value: string }[];
	owner: string | null;
	recipient: string | null;
	quantity: string;
	fee: string;
	dataSize: string;
	denomination: number;
	contentType: string | null;
	appName: string | null;
};
export type NodeAnchor = { height: number; hash: string };
export type ArweaveNodeApi = {
	getInfo: (node: string, signal: AbortSignal) => Promise<NodeInfo>;
	getAncestors: (node: string, anchor: NodeAnchor, heights: number[], signal: AbortSignal) => Promise<NodeAnchor[]>;
	getBlocks: (
		node: string,
		anchor: NodeAnchor,
		count: number,
		signal: AbortSignal,
		onProgress?: (blocks: NodeBlock[]) => void
	) => Promise<NodeBlock[]>;
	getPending: (node: string, signal: AbortSignal) => Promise<string[]>;
	getBlockTransactionIds: (node: string, hash: string, signal: AbortSignal) => Promise<string[]>;
	getTransaction: (
		node: string,
		id: string,
		signal: AbortSignal,
		state?: 'pending' | 'confirmed'
	) => Promise<NodeTransaction>;
	getBalance: (node: string, address: string, signal: AbortSignal) => Promise<string>;
};
