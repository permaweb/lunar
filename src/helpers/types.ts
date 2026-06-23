export type TagType = { name: string; value: string };

export type ResultMessageType = {
	Target?: string;
	Tags?: TagType[];
};

export type TagFilterType = { name: string; values: string[]; match?: string };

export type BaseGQLArgsType = {
	ids: string[] | null;
	tagFilters: TagFilterType[] | null;
	owners: string[] | null;
	cursor: string | null;
	paginator?: number;
	minBlock?: number;
	maxBlock?: number;
};

export type GQLArgsType = { gateway: string } & BaseGQLArgsType;

export type QueryBodyGQLArgsType = BaseGQLArgsType & { gateway?: string; queryKey?: string };

export type BatchGQLArgsType = {
	gateway: string;
	entries: { [queryKey: string]: BaseGQLArgsType };
};

export type GQLNodeResponseType = {
	cursor: string | null;
	node: {
		id: string;
		recipient?: string;
		tags: TagType[];
		data: {
			size: string;
			type: string;
		};
		quantity?: {
			winston?: string;
			ar?: string;
		};
		fee?: {
			winston?: string;
			ar?: string;
		};
		block?: {
			height: number;
			timestamp: number;
		};
		owner?: {
			address: string;
		};
		address?: string;
		timestamp?: number;
	};
};

export type GQLResponseType = {
	count: number;
	nextCursor: string | null;
	previousCursor: string | null;
};

export type DefaultGQLResponseType = {
	data: GQLNodeResponseType[];
} & GQLResponseType;

export type BatchAGQLResponseType = { [queryKey: string]: DefaultGQLResponseType };

export enum WalletEnum {
	wander = 'wander',
}

export type FormFieldType = 'number' | 'password';

export type TabType = 'primary' | 'alt1';

export type ReduxActionType = {
	type: string;
	payload: any;
};

export type ValidationType = {
	status: boolean;
	message: string | null;
};

export type ButtonType = 'primary' | 'alt1' | 'alt2' | 'alt3' | 'alt4' | 'success' | 'warning';

export type SelectOptionType = { id: string; label: string };

export type UploadMethodType = 'default' | 'turbo';

export type TransactionType = 'transaction' | 'process' | 'message' | 'wallet' | 'block' | 'bundle';

export interface BaseTabType {
	id: string;
	label: string;
	tabKey: string;
	untitledId?: string;
}

export type TransactionTabType = {
	id: string;
	label: string;
	type: TransactionType | null;
	lastRoute?: string;
	tabKey?: string;
};

export type MetricDataPoint = {
	day: string;
	[key: string]: number | string;
};

export type NetworkMetricValue = {
	bytes?: string;
	endBytes?: string;
	lowerBound?: number | null;
	reason?: string | null;
	source: string;
	startBytes?: string;
	unit?: string;
	value?: string | null;
	variant?: string;
	windowBlocks?: number;
	windowSeconds?: string;
	winston?: string;
};

export type NetworkMetricsSnapshot = {
	gateway: string;
	generatedAt: string;
	height: number;
	metrics: Record<string, NetworkMetricValue>;
	schema: string;
	window: {
		blocks: number;
		endHeight: number;
		seconds: string;
		startHeight: number;
	};
};

export type MessageFilterType = 'incoming' | 'outgoing';

export enum MessageVariantEnum {
	Legacynet = 'ao.TN.1',
	Mainnet = 'ao.N.1',
}

export interface SearchTxArgs {
	txId: string;
	getGQLData: (args: any) => Promise<any>;
	store?: any;
	dispatch?: any;
}
