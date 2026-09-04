import { DefaultGQLResponseType, GQLNodeResponseType } from 'helpers/types';

import { executeGraphQL } from './client';
import { GraphQLApiError, isRecord } from './types';

const NODE_FIELDS = `id recipient tags { name value } owner { address } data { size type } block { height timestamp }`;

function getList(value: unknown): string[] | undefined {
	if (value === undefined || value === null) return undefined;
	if (typeof value === 'string') return [value];
	if (Array.isArray(value) && value.every((entry) => typeof entry === 'string')) return value;
	throw new GraphQLApiError('invalid-input', 'GraphQL filter values must be strings');
}

function getPageSize(value: unknown): number {
	const first = value === undefined ? 100 : Number(value);
	if (!Number.isInteger(first) || first < 1 || first > 1000) {
		throw new GraphQLApiError('invalid-input', 'GraphQL page size must be between 1 and 1000');
	}
	return first;
}

function validateEdges(value: unknown): GQLNodeResponseType[] {
	if (
		!Array.isArray(value) ||
		value.some(
			(edge) =>
				!isRecord(edge) ||
				!isRecord(edge.node) ||
				typeof edge.node.id !== 'string' ||
				!Array.isArray(edge.node.tags) ||
				edge.node.tags.some((tag) => !isRecord(tag) || typeof tag.name !== 'string' || typeof tag.value !== 'string')
		)
	) {
		throw new GraphQLApiError('invalid-response', 'Invalid AR LMDB transaction response');
	}
	return value as GQLNodeResponseType[];
}

/** Preserve Lunar's existing page contract while paging the native engine in batches of 50. */
export async function getArLmdbTransactions(args: Record<string, unknown>): Promise<DefaultGQLResponseType> {
	const ids = getList(args.id ?? args.ids);
	if (ids?.length === 0) return { data: [], count: 0, nextCursor: null, previousCursor: null };
	if (args.cursor === 'END') return { data: [], count: 0, nextCursor: 'END', previousCursor: null };
	const first = getPageSize(args.paginator);
	const tags = args.tags ?? args.tagFilters;
	const sort = args.sort === 'ascending' ? 'HEIGHT_ASC' : args.sort === 'descending' ? 'HEIGHT_DESC' : args.sort;
	const filter = {
		ids,
		tags,
		owners: getList(args.owners),
		recipients: getList(args.recipients),
		bundledIn: getList(args.bundledIn),
		block: { min: args.minBlock ?? null, max: args.maxBlock ?? null },
		sort: sort ?? 'HEIGHT_DESC',
	};
	const getQuery = (
		includeCount: boolean
	) => `query LunarTransactions($ids: [ID!], $tags: [TagFilter!], $owners: [String!], $recipients: [String!], $bundledIn: [String!], $block: BlockFilter, $sort: SortOrder, $first: Int, $after: String) {
		transactions(ids: $ids, tags: $tags, owners: $owners, recipients: $recipients, bundledIn: $bundledIn, block: $block, sort: $sort, first: $first, after: $after) {
			${includeCount ? 'count' : ''}
			pageInfo { hasNextPage } edges { cursor node { ${NODE_FIELDS} } }
		}
	}`;
	const data: GQLNodeResponseType[] = [];
	let cursor = typeof args.cursor === 'string' ? args.cursor : null;
	let hasNextPage = false;
	let count: number | null = null;
	do {
		const response = await executeGraphQL({
			query: getQuery(!args.cursor && data.length === 0),
			variables: { ...filter, first: Math.min(50, first - data.length), after: cursor },
			source: 'ar-lmdb',
		});
		if (response.errors?.length)
			throw new GraphQLApiError('unavailable', response.errors.map((error) => error.message).join(', '));
		const connection = response.data?.transactions;
		if (
			!isRecord(connection) ||
			!isRecord(connection.pageInfo) ||
			typeof connection.pageInfo.hasNextPage !== 'boolean'
		) {
			throw new GraphQLApiError('invalid-response', 'Invalid AR LMDB transaction page');
		}
		const edges = validateEdges(connection.edges);
		const metadata = response.extensions?.arLmdb;
		const countInfo = isRecord(metadata) && isRecord(metadata.count) ? metadata.count : null;
		if (typeof connection.count === 'number' && Number.isSafeInteger(connection.count) && countInfo?.exact !== false) {
			count = connection.count;
		}
		data.push(...edges);
		hasNextPage = connection.pageInfo.hasNextPage;
		const nextCursor = edges[edges.length - 1]?.cursor;
		if (hasNextPage && (!nextCursor || nextCursor === cursor)) {
			throw new GraphQLApiError('invalid-response', 'AR LMDB returned a page without an advancing cursor');
		}
		cursor = nextCursor ?? cursor;
	} while (hasNextPage && data.length < first);

	return {
		data,
		// An exact total isn't available for every predicate intersection. Do not show a capped count as a total.
		count,
		nextCursor: hasNextPage ? cursor : 'END',
		previousCursor: null,
	};
}
