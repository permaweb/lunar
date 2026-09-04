import { FLAGS } from 'helpers/config';

import type { GraphQLSource } from '../graphql';
import { executeGraphQL, getConfiguredGraphQLSource, GraphQLApiError } from '../graphql';
import { isRecord } from '../graphql/types';

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

export type GetTransactionsArgs = {
	first?: number;
	after?: string | null;
	typeFilter?: TransactionTypeFilter | null;
	includeCount?: boolean;
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

function getTransactionFields(includeCount = false) {
	return `
	${includeCount ? 'count' : ''}
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
			${
				getConfiguredGraphQLSource() === 'ar-lmdb'
					? ''
					: `fee {
				winston
				ar
			}
			quantity {
				winston
				ar
			}`
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
}

const TRANSACTION_BY_ID_QUERY = () => `
	query TransactionById($ids: [ID!]) {
		transactions(ids: $ids, first: 1) {
			${getTransactionFields()}
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

const TRANSACTION_COUNT_BY_BLOCK_QUERY = `
	query TransactionCountByBlock($minBlock: Int, $maxBlock: Int, $first: Int) {
		transactions(block: { min: $minBlock, max: $maxBlock }, first: $first) {
			count
		}
	}
`;

const TRANSACTIONS_BY_BUNDLE_QUERY = () => `
	query TransactionsByBundle($bundleId: [ID!], $first: Int, $after: String) {
		transactions(bundledIn: $bundleId, first: $first, after: $after, sort: HEIGHT_DESC) {
			${getTransactionFields(true)}
		}
	}
`;

const TRANSACTIONS_BY_BUNDLE_PAGINATED_QUERY = () => `
	query TransactionsByBundle($bundleId: [ID!], $first: Int, $after: String) {
		transactions(bundledIn: $bundleId, first: $first, after: $after, sort: HEIGHT_DESC) {
			${getTransactionFields()}
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

function getTransactionTagsArg(typeFilter: TransactionTypeFilter | null | undefined) {
	const tags = getTransactionTypeFilterTags(typeFilter);

	return tags.length
		? `
			tags: [
				${tags
					.map((tag) => `{ name: "${tag.name}", values: [${tag.values.map((value) => `"${value}"`).join(', ')}] }`)
					.join('\n')}
			]
		`
		: '';
}

function getTransactionsQuery(args: { includeCount: boolean; typeFilter?: TransactionTypeFilter | null }) {
	return `
		query Transactions($first: Int, $after: String) {
			transactions(
				${getTransactionTagsArg(args.typeFilter)}
				first: $first
				after: $after
				sort: HEIGHT_DESC
			) {
				${getTransactionFields(args.includeCount)}
			}
		}
	`;
}

function getTransactionsByBlockQuery(args: { includeCount: boolean; typeFilter?: TransactionTypeFilter | null }) {
	return `
		query TransactionsByBlock($minBlock: Int, $maxBlock: Int, $first: Int, $after: String) {
			transactions(
				block: { min: $minBlock, max: $maxBlock }
				${getTransactionTagsArg(args.typeFilter)}
				first: $first
				after: $after
				sort: HEIGHT_DESC
			) {
				${getTransactionFields(args.includeCount)}
			}
		}
	`;
}

function getFirst(first: number | undefined) {
	if (!first) return DEFAULT_PAGE_SIZE;

	return Math.max(1, Math.min(first, MAX_PAGE_SIZE));
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

async function queryGraphQL<T>(args: {
	query: string;
	variables: Record<string, any>;
	gateway?: string;
	source?: GraphQLSource;
}): Promise<T> {
	const parsed = await executeGraphQL<T>(args);

	if (parsed.errors?.length) {
		throw new GraphQLApiError('unavailable', parsed.errors.map((error) => error.message).join(', '));
	}

	if (!parsed.data) {
		throw new GraphQLApiError('invalid-response', 'GraphQL response did not include data');
	}
	const localMetadata = parsed.extensions?.arLmdb;
	if (
		isRecord(localMetadata) &&
		isRecord(localMetadata.count) &&
		localMetadata.count.exact === false &&
		isRecord(parsed.data) &&
		isRecord(parsed.data.transactions)
	) {
		return { ...parsed.data, transactions: { ...parsed.data.transactions, count: undefined } };
	}

	return parsed.data;
}

async function queryTransactions(args: {
	query: string;
	variables: Record<string, any>;
	gateway?: string;
}): Promise<TransactionsQueryResponse> {
	// Keep every page of one logical query on the source it started with.
	const request = { ...args, source: getConfiguredGraphQLSource() };
	if (request.source === 'remote') return queryGraphQL<TransactionsQueryResponse>(request);
	const first = getFirst(args.variables.first);
	const response = await queryGraphQL<TransactionsQueryResponse>({
		...request,
		variables: { ...args.variables, first: Math.min(50, first) },
	});
	const connection = response.transactions;
	if (!connection || !Array.isArray(connection.edges) || typeof connection.pageInfo?.hasNextPage !== 'boolean') {
		throw new GraphQLApiError('invalid-response', 'Invalid AR LMDB transaction page');
	}
	while (connection.pageInfo.hasNextPage && connection.edges.length < first) {
		const cursor = connection.edges[connection.edges.length - 1]?.cursor;
		if (!cursor) throw new GraphQLApiError('invalid-response', 'AR LMDB returned a page without a cursor');
		const next = await queryGraphQL<TransactionsQueryResponse>({
			...request,
			variables: { ...args.variables, first: Math.min(50, first - connection.edges.length), after: cursor },
		});
		if (
			!next.transactions ||
			!Array.isArray(next.transactions.edges) ||
			typeof next.transactions.pageInfo?.hasNextPage !== 'boolean' ||
			(next.transactions.pageInfo.hasNextPage &&
				(!next.transactions.edges.length ||
					next.transactions.edges[next.transactions.edges.length - 1]?.cursor === cursor))
		) {
			throw new GraphQLApiError('invalid-response', 'AR LMDB returned a nonadvancing transaction page');
		}
		connection.edges.push(...next.transactions.edges);
		connection.pageInfo = next.transactions.pageInfo;
	}
	return response;
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

export async function getTransactions(args: GetTransactionsArgs = {}): Promise<TransactionsQueryResponse> {
	const response = await queryTransactions({
		query: getTransactionsQuery({
			includeCount: args.includeCount ?? false,
			typeFilter: args.typeFilter,
		}),
		variables: {
			first: getFirst(args.first),
			after: args.after ?? null,
		},
		gateway: args.gateway,
	});

	return {
		transactions: normalizeTransactionConnection(response.transactions),
	};
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
	const response = await queryTransactions({
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
		const response = await queryTransactions({
			query: includeCount ? TRANSACTIONS_BY_BUNDLE_QUERY() : TRANSACTIONS_BY_BUNDLE_PAGINATED_QUERY(),
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
	const response = await queryTransactions({
		query: TRANSACTION_BY_ID_QUERY(),
		variables: {
			ids: [args.id],
		},
		gateway: args.gateway,
	});

	return normalizeTransactionConnection(response.transactions).edges[0]?.node ?? null;
}
