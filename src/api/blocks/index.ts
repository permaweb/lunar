export type BlockNode = {
	id: string;
	timestamp: number;
	height: number;
	previous: string;
};

export type TransactionTag = {
	name: string;
	value: string;
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
	data?: {
		size: string;
		type: string;
	};
};

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

export type GetBlockArgs = {
	id?: string;
	height?: number;
	gateway?: string;
};

export type GetBlocksArgs = {
	first?: number;
	after?: string | null;
	gateway?: string;
};

export type GetTransactionsByBlockArgs = {
	blockHeight?: number;
	blockId?: string;
	first?: number;
	after?: string | null;
	bundlesOnly?: boolean;
	gateway?: string;
};

export type GetTransactionsByBundleArgs = {
	bundleId: string;
	first?: number;
	after?: string | null;
	gateway?: string;
};

type GraphQLResponse<T> = {
	data?: T;
	errors?: { message: string }[];
};

const DEFAULT_GRAPHQL_ENDPOINT = 'https://arweave.net/graphql';
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
	count
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

const BLOCKS_QUERY = `
	query Blocks($first: Int, $after: String) {
		blocks(first: $first, after: $after, sort: HEIGHT_DESC) {
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
			${TRANSACTION_FIELDS}
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
			${TRANSACTION_FIELDS}
		}
	}
`;

const TRANSACTIONS_BY_BUNDLE_QUERY = `
	query TransactionsByBundle($bundleId: [ID!], $first: Int, $after: String) {
		transactions(bundledIn: $bundleId, first: $first, after: $after, sort: HEIGHT_DESC) {
			${TRANSACTION_FIELDS}
		}
	}
`;

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
				tags: edge.node.tags.map((tag) => ({
					...tag,
					name: normalizeTagName(tag.name),
				})),
			},
		})),
	};
}

function getTagValue(tags: TransactionTag[], name: string) {
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

export async function getBlocks(args: GetBlocksArgs = {}): Promise<BlocksQueryResponse> {
	return await queryGraphQL<BlocksQueryResponse>({
		query: BLOCKS_QUERY,
		variables: {
			first: getFirst(args.first),
			after: args.after ?? null,
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

	const response = await queryGraphQL<TransactionsQueryResponse>({
		query: args.bundlesOnly ? BUNDLES_BY_BLOCK_QUERY : TRANSACTIONS_BY_BLOCK_QUERY,
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
	const response = await queryGraphQL<TransactionsQueryResponse>({
		query: TRANSACTIONS_BY_BUNDLE_QUERY,
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
