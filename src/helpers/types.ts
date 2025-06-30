export type TagType = { name: string; value: string };

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
		tags: TagType[];
		data: {
			size: string;
			type: string;
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
	arConnect = 'arconnect',
	othent = 'othent',
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

export type DropdownOptionType = { id: string; label: string; fn: () => void };

export type SelectOptionType = { id: string; label: string };

export type UploadMethodType = 'default' | 'turbo';

export type NotificationType = {
	message: string;
	status: 'success' | 'warning';
};

export type TransactionType = 'process' | 'message';

export type TransactionTabType = { id: string; label: string; type: TransactionType | null };

export type MetricDataPoint = {
	created_date: string;
	tx_count: number;
	eval_count: number;
	transfer_count: number;
	new_process_count: number;
	new_module_count: number;
	active_users: number;
	active_processes: number;
	tx_count_rolling: number;
	processes_rolling: number;
	modules_rolling: number;
};

export type MessageFilterType = 'incoming' | 'outgoing';

export enum MessageVariantEnum {
	Legacynet = 'ao.TN.1',
	Mainnet = 'ao.N.1',
}
