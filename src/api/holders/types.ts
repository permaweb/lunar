export type TokenHolder = { address: string; balance: string };

export type HolderLastTransaction =
	| { status: 'found'; transactionId: string }
	| { status: 'empty' }
	| { status: 'unsupported' }
	| { status: 'error' };

export type TokenHoldersSnapshot = {
	tokenProcess: string;
	name: string;
	ticker: string;
	denomination: number;
	generatedAt: string;
	lastScannedSlot: number;
	topN: number;
	totalBalances: number;
	totalHolders: number;
	totalSupply: string;
	holders: TokenHolder[];
};
