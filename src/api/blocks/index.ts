import { getGraphQLEndpoint } from 'api/graphql';

import { FLAGS } from 'helpers/config';
import { checkValidAddress } from 'helpers/utils';

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
};

export type GetBlocksArgs = {
	first?: number;
	after?: string | null;
	minHeight?: number | null;
	maxHeight?: number | null;
};

export type GetTransactionsArgs = {
	first?: number;
	after?: string | null;
	typeFilter?: TransactionTypeFilter | null;
	includeCount?: boolean;
};

export type GetTransactionsByBlockArgs = {
	blockHeight?: number;
	blockId?: string;
	first?: number;
	after?: string | null;
	bundlesOnly?: boolean;
	typeFilter?: TransactionTypeFilter | null;
};

export type GetTransactionsByBundleArgs = {
	bundleId: string;
	bundleTags?: TransactionTag[];
	first?: number;
	after?: string | null;
	typeFilter?: TransactionTypeFilter | null;
	includeCount?: boolean;
	signal?: AbortSignal;
};

export type GetTransactionByIdArgs = {
	id: string;
};

type GraphQLResponse<T> = {
	data?: T;
	errors?: { message: string }[];
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
			${FLAGS.USE_GQL_BUNDLED_IN ? 'bundledIn { id }' : ''}
			data {
				size
				type
			}
		}
	}
`;
}

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
	variables: Record<string, unknown>;
	signal?: AbortSignal;
}): Promise<T> {
	const response = await fetch(getGraphQLEndpoint(), {
		method: 'POST',
		signal: args.signal,
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

async function getBlockHeightById(blockId: string) {
	const block = await getBlock({ id: blockId });

	return block?.height ?? null;
}

const bundleTransactionIdsCache = new Map<string, string[]>();
const BUNDLE_CACHE_LIMIT = 50;
const BUNDLE_CURSOR_PREFIX = 'bundle-tx:';

function isArweaveId(value: unknown): value is string {
	return typeof value === 'string' && checkValidAddress(value);
}

function getBundleLinkIds(entries: [string, unknown][]): string[] {
	const links = entries
		.filter((entry): entry is [string, string] => /^\d+\+link$/i.test(entry[0]) && isArweaveId(entry[1]))
		.sort(([a], [b]) => Number(a.split('+')[0]) - Number(b.split('+')[0]));

	return [...new Set(links.map(([, id]) => id))];
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
	const linkedIds = getBundleLinkIds(Object.entries(response));

	if (linkedIds.length > 0) return linkedIds;

	for (const key of ['txs', 'transactions', 'ids', 'links']) {
		const ids = getIdsFromList(response[key]);

		if (ids.length > 0) return ids;
	}

	return [];
}

async function getBundleTransactionIds(args: GetTransactionsByBundleArgs) {
	const taggedIds = getBundleLinkIds((args.bundleTags ?? []).map((tag) => [tag.name, tag.value]));
	if (taggedIds.length) return taggedIds;

	const cached = bundleTransactionIdsCache.get(args.bundleId);

	if (cached) return cached;

	const bundlePath = encodeURIComponent(args.bundleId);
	const response = await fetch(
		`${DEFAULT_ARWEAVE_ENDPOINT}/${bundlePath}?require-codec=application/json&accept-bundle=false`,
		{
			signal: args.signal,
			headers: {
				Accept: 'application/json',
			},
		}
	);

	if (!response.ok) {
		throw new Error(`Bundle request failed with status ${response.status}`);
	}

	const headerEntries: [string, string][] = [];
	response.headers.forEach((value, name) => headerEntries.push([name, value]));
	const headerIds = getBundleLinkIds(headerEntries);
	// HyperBEAM may serve its own HTML page as the body; bundle membership is in the headers.
	const ids = headerIds.length ? headerIds : [...new Set(getBundleTransactionIdsFromResponse(await response.json()))];

	bundleTransactionIdsCache.set(args.bundleId, ids);
	if (bundleTransactionIdsCache.size > BUNDLE_CACHE_LIMIT) {
		bundleTransactionIdsCache.delete(bundleTransactionIdsCache.keys().next().value);
	}

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
	});
}

export async function getBlock(args: GetBlockArgs): Promise<BlockNode | null> {
	if (args.id) {
		const response = await queryGraphQL<{ block: BlockNode | null }>({
			query: BLOCK_BY_ID_QUERY,
			variables: {
				id: args.id,
			},
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
	args: Pick<GetTransactionsByBlockArgs, 'blockHeight' | 'blockId'>
): Promise<number | null> {
	const blockHeight = args.blockHeight ?? (args.blockId ? await getBlockHeightById(args.blockId) : null);

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
	});

	return normalizeCount(response.transactions.count) ?? null;
}

export async function getTransactions(args: GetTransactionsArgs = {}): Promise<TransactionsQueryResponse> {
	const response = await queryGraphQL<TransactionsQueryResponse>({
		query: getTransactionsQuery({
			includeCount: args.includeCount ?? false,
			typeFilter: args.typeFilter,
		}),
		variables: {
			first: getFirst(args.first),
			after: args.after ?? null,
		},
	});

	return {
		transactions: normalizeTransactionConnection(response.transactions),
	};
}

export async function getTransactionsByBlock(
	args: GetTransactionsByBlockArgs = {}
): Promise<TransactionsQueryResponse> {
	const blockHeight = args.blockHeight ?? (args.blockId ? await getBlockHeightById(args.blockId) : null);

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
	});

	return {
		transactions: normalizeTransactionConnection(response.transactions),
	};
}

export async function getTransactionsByBundle(args: GetTransactionsByBundleArgs): Promise<TransactionsQueryResponse> {
	if (!isArweaveId(args.bundleId)) throw new Error('Invalid bundle id');
	if (FLAGS.USE_GQL_BUNDLED_IN) {
		const includeCount = args.includeCount ?? !args.after;
		const response = await queryGraphQL<TransactionsQueryResponse>({
			query: `
				query TransactionsByBundle($bundleId: [ID!], $first: Int, $after: String) {
					transactions(bundledIn: $bundleId, first: $first, after: $after, sort: HEIGHT_DESC) {
						${getTransactionFields(includeCount)}
					}
				}
			`,
			signal: args.signal,
			variables: {
				bundleId: [args.bundleId],
				first: getFirst(args.first),
				after: args.after ?? null,
			},
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
		query: `
			query TransactionById($ids: [ID!]) {
				transactions(ids: $ids, first: 1) {
					${getTransactionFields()}
				}
			}
		`,
		variables: {
			ids: [args.id],
		},
	});

	return normalizeTransactionConnection(response.transactions).edges[0]?.node ?? null;
}
