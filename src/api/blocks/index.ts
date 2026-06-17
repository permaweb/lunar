import { FLAGS } from 'helpers/config';

export type BlockNode = {
	id: string;
	timestamp: number;
	height: number;
	previous: string;
};

export type BlockMetadata = {
	height?: number;
	timestamp?: number;
	tx_root?: string | null;
	block_size?: string | number | null;
	indep_hash?: string | null;
	previous_block?: string | null;
	miner?: string | null;
	reward?: string | number | null;
	reward_addr?: string | null;
	txs?: string[];
};

export type TransactionTag = {
	name: string;
	value: string;
};

export type TransactionAmount = {
	winston?: string;
	ar?: string;
};

export type TransactionNode = {
	id: string;
	tags: TransactionTag[];
	block?: {
		height: number;
		timestamp: number;
	};
	bundledIn?: {
		id: string;
	};
	owner?: {
		address: string;
	};
	recipient?: string;
	fee?: TransactionAmount;
	quantity?: TransactionAmount;
	data?: {
		size: string;
		type: string;
	};
};

export type TransactionTypeFilter = 'message' | 'assignment' | 'bundle' | 'transaction';

export type GQLEdge<T> = {
	cursor: string;
	node: T;
};

export type GQLConnection<T> = {
	count?: number;
	pageInfo: {
		hasNextPage: boolean;
	};
	edges: GQLEdge<T>[];
};

export type BlocksQueryResponse = {
	blocks: GQLConnection<BlockNode>;
};

export type TransactionsQueryResponse = {
	transactions: GQLConnection<TransactionNode>;
};

export type TransactionCountQueryResponse = {
	transactions: {
		count?: number | string;
	};
};

export type GetBlockArgs = {
	id?: string;
	height?: number;
	gateway?: string;
};

export type GetBlocksArgs = {
	first?: number;
	after?: string | null;
	minHeight?: number | null;
	maxHeight?: number | null;
	gateway?: string;
};

export type GetTransactionsByBlockArgs = {
	blockHeight?: number;
	blockId?: string;
	first?: number;
	after?: string | null;
	bundlesOnly?: boolean;
	typeFilter?: TransactionTypeFilter | null;
	gateway?: string;
};

export type GetTransactionsByBundleArgs = {
	bundleId: string;
	first?: number;
	after?: string | null;
	typeFilter?: TransactionTypeFilter | null;
	includeCount?: boolean;
	gateway?: string;
};

export type GetTransactionByIdArgs = {
	id: string;
	gateway?: string;
};

type GraphQLResponse<T> = {
	data?: T;
	errors?: { message: string }[];
};

const DEFAULT_GRAPHQL_ENDPOINT = 'https://arweave.net/graphql';
const DEFAULT_ARWEAVE_ENDPOINT = 'https://arweave.net';
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

const BLOCK_NODE_FIELDS = `
	id
	timestamp
	height
	previous
`;

const BLOCK_FIELDS = `
	pageInfo {
		hasNextPage
	}
	edges {
		cursor
		node {
			${BLOCK_NODE_FIELDS}
		}
	}
`;

const TRANSACTION_FIELDS = `
	pageInfo {
		hasNextPage
	}
	edges {
		cursor
		node {
			id
			recipient
			tags {
				name
				value
			}
			owner {
				address
			}
			fee {
				winston
				ar
			}
			quantity {
				winston
				ar
			}
			block {
				height
				timestamp
			}
			bundledIn {
				id
			}
			data {
				size
				type
			}
		}
	}
`;

const TRANSACTION_FIELDS_WITH_COUNT = `
	count
	${TRANSACTION_FIELDS}
`;

const TRANSACTION_BY_ID_QUERY = `
	query TransactionById($ids: [ID!]) {
		transactions(ids: $ids, first: 1) {
			${TRANSACTION_FIELDS}
		}
	}
`;

const BLOCKS_QUERY = `
	query Blocks($first: Int, $after: String) {
		blocks(first: $first, after: $after, sort: HEIGHT_DESC) {
			${BLOCK_FIELDS}
		}
	}
`;

const BLOCKS_BY_RANGE_QUERY = `
	query BlocksByRange($first: Int, $after: String, $minHeight: Int, $maxHeight: Int) {
		blocks(first: $first, after: $after, sort: HEIGHT_DESC, height: { min: $minHeight, max: $maxHeight }) {
			${BLOCK_FIELDS}
		}
	}
`;

const BLOCK_BY_ID_QUERY = `
	query Block($id: String) {
		block(id: $id) {
			${BLOCK_NODE_FIELDS}
		}
	}
`;

const BLOCK_BY_HEIGHT_QUERY = `
	query BlockByHeight($minHeight: Int, $maxHeight: Int) {
		blocks(height: { min: $minHeight, max: $maxHeight }, first: 1) {
			${BLOCK_FIELDS}
		}
	}
`;

const TRANSACTIONS_BY_BLOCK_QUERY = `
	query TransactionsByBlock($minBlock: Int, $maxBlock: Int, $first: Int, $after: String) {
		transactions(block: { min: $minBlock, max: $maxBlock }, first: $first, after: $after, sort: HEIGHT_DESC) {
			${TRANSACTION_FIELDS_WITH_COUNT}
		}
	}
`;

const TRANSACTIONS_BY_BLOCK_PAGINATED_QUERY = `
	query TransactionsByBlock($minBlock: Int, $maxBlock: Int, $first: Int, $after: String) {
		transactions(block: { min: $minBlock, max: $maxBlock }, first: $first, after: $after, sort: HEIGHT_DESC) {
			${TRANSACTION_FIELDS}
		}
	}
`;

const TRANSACTION_COUNT_BY_BLOCK_QUERY = `
	query TransactionCountByBlock($minBlock: Int, $maxBlock: Int, $first: Int) {
		transactions(block: { min: $minBlock, max: $maxBlock }, first: $first) {
			count
		}
	}
`;

const BUNDLES_BY_BLOCK_QUERY = `
	query BundlesByBlock($minBlock: Int, $maxBlock: Int, $first: Int, $after: String) {
		transactions(
			block: { min: $minBlock, max: $maxBlock }
			tags: [
				{ name: "bundle-format", values: ["binary"] }
				{ name: "bundle-version", values: ["2.0.0"] }
			]
			first: $first
			after: $after
			sort: HEIGHT_DESC
		) {
			${TRANSACTION_FIELDS_WITH_COUNT}
		}
	}
`;

const BUNDLES_BY_BLOCK_PAGINATED_QUERY = `
	query BundlesByBlock($minBlock: Int, $maxBlock: Int, $first: Int, $after: String) {
		transactions(
			block: { min: $minBlock, max: $maxBlock }
			tags: [
				{ name: "bundle-format", values: ["binary"] }
				{ name: "bundle-version", values: ["2.0.0"] }
			]
			first: $first
			after: $after
			sort: HEIGHT_DESC
		) {
			${TRANSACTION_FIELDS}
		}
	}
`;

const TRANSACTIONS_BY_BUNDLE_QUERY = `
	query TransactionsByBundle($bundleId: [ID!], $first: Int, $after: String) {
		transactions(bundledIn: $bundleId, first: $first, after: $after, sort: HEIGHT_DESC) {
			${TRANSACTION_FIELDS_WITH_COUNT}
		}
	}
`;

const TRANSACTIONS_BY_BUNDLE_PAGINATED_QUERY = `
	query TransactionsByBundle($bundleId: [ID!], $first: Int, $after: String) {
		transactions(bundledIn: $bundleId, first: $first, after: $after, sort: HEIGHT_DESC) {
			${TRANSACTION_FIELDS}
		}
	}
`;

function getTransactionTypeFilterTags(typeFilter: TransactionTypeFilter | null | undefined) {
	switch (typeFilter) {
		case 'message':
			return [
				{ name: 'Data-Protocol', values: ['ao'] },
				{ name: 'Type', values: ['Message'] },
			];
		case 'assignment':
			return [
				{ name: 'Data-Protocol', values: ['ao'] },
				{ name: 'Type', values: ['Assignment'] },
			];
		case 'bundle':
			return [
				{ name: 'bundle-format', values: ['binary'] },
				{ name: 'bundle-version', values: ['2.0.0'] },
			];
		default:
			return [];
	}
}

function getTransactionsByBlockQuery(args: { includeCount: boolean; typeFilter?: TransactionTypeFilter | null }) {
	const tags = getTransactionTypeFilterTags(args.typeFilter);
	const tagsArg = tags.length
		? `
			tags: [
				${tags
					.map((tag) => `{ name: "${tag.name}", values: [${tag.values.map((value) => `"${value}"`).join(', ')}] }`)
					.join('\n')}
			]
		`
		: '';

	return `
		query TransactionsByBlock($minBlock: Int, $maxBlock: Int, $first: Int, $after: String) {
			transactions(
				block: { min: $minBlock, max: $maxBlock }
				${tagsArg}
				first: $first
				after: $after
				sort: HEIGHT_DESC
			) {
				${args.includeCount ? TRANSACTION_FIELDS_WITH_COUNT : TRANSACTION_FIELDS}
			}
		}
	`;
}

function getFirst(first: number | undefined) {
	if (!first) return DEFAULT_PAGE_SIZE;

	return Math.max(1, Math.min(first, MAX_PAGE_SIZE));
}

function getEndpoint(gateway?: string) {
	if (!gateway) return DEFAULT_GRAPHQL_ENDPOINT;

	const trimmedGateway = gateway.trim();
	if (trimmedGateway.endsWith('/graphql')) return trimmedGateway;

	const gatewayUrl =
		trimmedGateway.startsWith('http://') || trimmedGateway.startsWith('https://')
			? trimmedGateway
			: `https://${trimmedGateway}`;

	return `${gatewayUrl.replace(/\/$/, '')}/graphql`;
}

function getArweaveEndpoint(gateway?: string) {
	if (!gateway) return DEFAULT_ARWEAVE_ENDPOINT;

	const trimmedGateway = gateway.trim();
	const gatewayUrl =
		trimmedGateway.startsWith('http://') || trimmedGateway.startsWith('https://')
			? trimmedGateway
			: `https://${trimmedGateway}`;

	return gatewayUrl.replace(/\/$/, '').replace(/\/graphql$/, '');
}

function normalizeCount(value: number | string | undefined): number | undefined {
	if (value === undefined) return undefined;

	const parsed = Number(value);

	return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeTagName(name: string) {
	return name
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
		.join('-');
}

function normalizeTransactionConnection(connection: GQLConnection<TransactionNode>) {
	return {
		...connection,
		count: normalizeCount(connection.count),
		edges: connection.edges.map((edge) => ({
			...edge,
			node: {
				...edge.node,
				tags: (edge.node.tags ?? []).map((tag) => ({
					...tag,
					name: normalizeTagName(tag.name),
				})),
			},
		})),
	};
}

function getTagValue(tags: TransactionTag[] | undefined, name: string) {
	if (!tags) return null;

	return tags.find((tag) => tag.name.toLowerCase() === name.toLowerCase())?.value ?? null;
}

export function isBundleTransaction(transaction: TransactionNode) {
	return (
		getTagValue(transaction.tags, 'Bundle-Format') === 'binary' &&
		getTagValue(transaction.tags, 'Bundle-Version') === '2.0.0'
	);
}

async function queryGraphQL<T>(args: { query: string; variables: Record<string, any>; gateway?: string }): Promise<T> {
	const response = await fetch(getEndpoint(args.gateway), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			query: args.query,
			variables: args.variables,
		}),
	});

	if (!response.ok) {
		throw new Error(`GraphQL request failed with status ${response.status}`);
	}

	const parsed: GraphQLResponse<T> = await response.json();

	if (parsed.errors?.length) {
		throw new Error(parsed.errors.map((error) => error.message).join(', '));
	}

	if (!parsed.data) {
		throw new Error('GraphQL response did not include data');
	}

	return parsed.data;
}

async function getBlockHeightById(blockId: string, gateway?: string) {
	const block = await getBlock({ id: blockId, gateway: gateway });

	return block?.height ?? null;
}

const bundleTransactionIdsCache = new Map<string, string[]>();
const BUNDLE_CURSOR_PREFIX = 'bundle-tx:';

function isArweaveId(value: unknown) {
	return typeof value === 'string' && /^[a-z0-9_-]{43}$/i.test(value);
}

function getBundleCursor(index: number) {
	return `${BUNDLE_CURSOR_PREFIX}${index}`;
}

function getBundleStartIndex(after: string | null | undefined) {
	if (!after?.startsWith(BUNDLE_CURSOR_PREFIX)) return 0;

	const index = Number(after.slice(BUNDLE_CURSOR_PREFIX.length));

	return Number.isInteger(index) && index >= 0 ? index + 1 : 0;
}

function getIdsFromList(value: unknown) {
	if (!Array.isArray(value)) return [];

	return value
		.map((entry) => {
			if (isArweaveId(entry)) return entry;
			if (entry && typeof entry === 'object') {
				const objectEntry = entry as Record<string, unknown>;

				if (isArweaveId(objectEntry.id)) return objectEntry.id;
				if (isArweaveId(objectEntry.link)) return objectEntry.link;
			}

			return null;
		})
		.filter((id): id is string => !!id);
}

function getBundleTransactionIdsFromResponse(value: unknown) {
	if (Array.isArray(value)) return getIdsFromList(value);
	if (!value || typeof value !== 'object') return [];

	const response = value as Record<string, unknown>;
	const linkedIds = Object.entries(response)
		.filter(([key, entry]) => /^\d+\+link$/i.test(key) && isArweaveId(entry))
		.sort(([a], [b]) => Number(a.split('+')[0]) - Number(b.split('+')[0]))
		.map(([, entry]) => entry as string);

	if (linkedIds.length > 0) return linkedIds;

	for (const key of ['txs', 'transactions', 'ids', 'links']) {
		const ids = getIdsFromList(response[key]);

		if (ids.length > 0) return ids;
	}

	return [];
}

async function getBundleTransactionIds(args: GetTransactionsByBundleArgs) {
	const endpoint = getArweaveEndpoint(args.gateway);
	const cacheKey = `${endpoint}/${args.bundleId}`;
	const cached = bundleTransactionIdsCache.get(cacheKey);

	if (cached) return cached;

	const response = await fetch(
		`${endpoint}/${encodeURIComponent(args.bundleId)}?require-codec=application/json&accept-bundle=false`,
		{
			headers: {
				Accept: 'application/json',
			},
		}
	);

	if (!response.ok) {
		throw new Error(`Bundle request failed with status ${response.status}`);
	}

	const parsed = await response.json();
	const ids = getBundleTransactionIdsFromResponse(parsed);

	bundleTransactionIdsCache.set(cacheKey, ids);

	return ids;
}

export async function getBlocks(args: GetBlocksArgs = {}): Promise<BlocksQueryResponse> {
	const hasRange = args.minHeight !== undefined || args.maxHeight !== undefined;

	return await queryGraphQL<BlocksQueryResponse>({
		query: hasRange ? BLOCKS_BY_RANGE_QUERY : BLOCKS_QUERY,
		variables: {
			first: getFirst(args.first),
			after: args.after ?? null,
			minHeight: args.minHeight ?? null,
			maxHeight: args.maxHeight ?? null,
		},
		gateway: args.gateway,
	});
}

export async function getBlock(args: GetBlockArgs): Promise<BlockNode | null> {
	if (args.id) {
		const response = await queryGraphQL<{ block: BlockNode | null }>({
			query: BLOCK_BY_ID_QUERY,
			variables: {
				id: args.id,
			},
			gateway: args.gateway,
		});

		return response.block;
	}

	if (args.height !== undefined) {
		const response = await queryGraphQL<BlocksQueryResponse>({
			query: BLOCK_BY_HEIGHT_QUERY,
			variables: {
				minHeight: args.height,
				maxHeight: args.height,
			},
			gateway: args.gateway,
		});

		return response.blocks.edges[0]?.node ?? null;
	}

	return null;
}

export async function getBlockMetadataByHeight(height: number): Promise<BlockMetadata> {
	const response = await fetch(`${DEFAULT_ARWEAVE_ENDPOINT}/block/height/${height}`);

	if (!response.ok) {
		throw new Error(`Block metadata request failed with status ${response.status}`);
	}

	return await response.json();
}

export async function getCurrentBlockHeight(): Promise<number | null> {
	const response = await fetch(`${DEFAULT_ARWEAVE_ENDPOINT}/info`);

	if (!response.ok) {
		throw new Error(`Network info request failed with status ${response.status}`);
	}

	const info = await response.json();
	const height = Number(info?.height);

	return Number.isFinite(height) ? height : null;
}

export async function getTransactionCountByBlock(
	args: Pick<GetTransactionsByBlockArgs, 'blockHeight' | 'blockId' | 'gateway'>
): Promise<number | null> {
	const blockHeight = args.blockHeight ?? (args.blockId ? await getBlockHeightById(args.blockId, args.gateway) : null);

	if (blockHeight === null) {
		return null;
	}

	const response = await queryGraphQL<TransactionCountQueryResponse>({
		query: TRANSACTION_COUNT_BY_BLOCK_QUERY,
		variables: {
			minBlock: blockHeight,
			maxBlock: blockHeight,
			first: 1,
		},
		gateway: args.gateway,
	});

	return normalizeCount(response.transactions.count) ?? null;
}

export async function getTransactionsByBlock(
	args: GetTransactionsByBlockArgs = {}
): Promise<TransactionsQueryResponse> {
	const blockHeight = args.blockHeight ?? (args.blockId ? await getBlockHeightById(args.blockId, args.gateway) : null);

	if (blockHeight === null) {
		return {
			transactions: {
				count: 0,
				pageInfo: {
					hasNextPage: false,
				},
				edges: [],
			},
		};
	}

	const serverTypeFilter = args.bundlesOnly ? 'bundle' : args.typeFilter === 'transaction' ? null : args.typeFilter;
	const response = await queryGraphQL<TransactionsQueryResponse>({
		query: getTransactionsByBlockQuery({
			includeCount: !args.after && args.typeFilter !== 'transaction',
			typeFilter: serverTypeFilter,
		}),
		variables: {
			minBlock: blockHeight,
			maxBlock: blockHeight,
			first: getFirst(args.first),
			after: args.after ?? null,
		},
		gateway: args.gateway,
	});

	return {
		transactions: normalizeTransactionConnection(response.transactions),
	};
}

export async function getTransactionsByBundle(args: GetTransactionsByBundleArgs): Promise<TransactionsQueryResponse> {
	if (!FLAGS.USE_GATEWAY_BUNDLE_REQUEST) {
		const includeCount = args.includeCount ?? !args.after;
		const response = await queryGraphQL<TransactionsQueryResponse>({
			query: includeCount ? TRANSACTIONS_BY_BUNDLE_QUERY : TRANSACTIONS_BY_BUNDLE_PAGINATED_QUERY,
			variables: {
				bundleId: [args.bundleId],
				first: getFirst(args.first),
				after: args.after ?? null,
			},
			gateway: args.gateway,
		});

		return {
			transactions: normalizeTransactionConnection(response.transactions),
		};
	}

	const ids = await getBundleTransactionIds(args);
	const first = getFirst(args.first);
	const startIndex = getBundleStartIndex(args.after);
	const pageIds = ids.slice(startIndex, startIndex + first);

	return {
		transactions: {
			count: ids.length,
			pageInfo: {
				hasNextPage: startIndex + first < ids.length,
			},
			edges: pageIds.map((id, index) => ({
				cursor: getBundleCursor(startIndex + index),
				node: {
					id: id,
				} as TransactionNode,
			})),
		},
	};
}

export async function getTransactionById(args: GetTransactionByIdArgs): Promise<TransactionNode | null> {
	const response = await queryGraphQL<TransactionsQueryResponse>({
		query: TRANSACTION_BY_ID_QUERY,
		variables: {
			ids: [args.id],
		},
		gateway: args.gateway,
	});

	return normalizeTransactionConnection(response.transactions).edges[0]?.node ?? null;
}
