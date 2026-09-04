import { execute, Index, openIndex, plan } from 'arlmdb.js';
import { getOperationAST, graphql, Kind, parse } from 'graphql';

import { AR_LMDB_DATA_GATEWAY, AR_LMDB_INDEX_ID, RETIRED_GATEWAY_HOST } from 'helpers/config';

import { arLmdbSchema } from './localSchema';
import { GraphQLApiError, GraphQLRequest, GraphQLResponse, validateGraphQLResponse } from './types';

const REQUEST_TIMEOUT_MS = 30_000;
const QUERY_TIMEOUT_MS = 120_000;
let indexPromise: Promise<Index> | undefined;
// The WASM reader shares one environment. Serialize walks; retain its chunk cache across queries.
let queryQueue: Promise<unknown> = Promise.resolve();

async function fetchIndexBytes(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
	const url = new URL(input instanceof Request ? input.url : String(input));
	if (url.hostname.replace(/\.$/, '') === RETIRED_GATEWAY_HOST || url.protocol !== 'https:') {
		throw new GraphQLApiError('unavailable', 'AR LMDB requires an available HTTPS data source');
	}
	const controller = new AbortController();
	const handleAbort = () => controller.abort();
	init?.signal?.addEventListener('abort', handleAbort, { once: true });
	if (init?.signal?.aborted) controller.abort();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
	try {
		const response = await fetch(input, { ...init, signal: controller.signal });
		// Keep the deadline active until the chunk/metadata body has also finished downloading.
		const body = await response.arrayBuffer();
		return new Response(response.status === 204 || response.status === 205 || response.status === 304 ? null : body, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
		});
	} finally {
		clearTimeout(timeout);
		init?.signal?.removeEventListener('abort', handleAbort);
	}
}

function getIndex(): Promise<Index> {
	if (!indexPromise) {
		indexPromise = openIndex({
			id: AR_LMDB_INDEX_ID,
			gateway: AR_LMDB_DATA_GATEWAY,
			// The index's default fleet uses plain HTTP, unavailable to an HTTPS permaweb app.
			chunkSources: [],
			fetcher: fetchIndexBytes,
		}).catch((error) => {
			indexPromise = undefined;
			throw error;
		});
	}
	return indexPromise;
}

function cancelled(): GraphQLApiError {
	return new GraphQLApiError('cancelled', 'GraphQL query cancelled');
}

function waitFor<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
	if (signal?.aborted) return Promise.reject(cancelled());
	return new Promise((resolve, reject) => {
		const handleAbort = () => reject(cancelled());
		signal?.addEventListener('abort', handleAbort, { once: true });
		promise.then(resolve, reject).finally(() => signal?.removeEventListener('abort', handleAbort));
	});
}

export async function executeArLmdbGraphQL<T>(request: GraphQLRequest): Promise<GraphQLResponse<T>> {
	if (request.signal?.aborted) throw cancelled();
	try {
		const document = parse(request.query);
		const operation = getOperationAST(document, request.operationName);
		if (!operation) {
			return { errors: [{ message: 'Select exactly one query operation', extensions: { code: 'unservable' } }] };
		}
		const isIntrospection = operation.selectionSet.selections.every(
			(selection) =>
				selection.kind === Kind.FIELD && ['__schema', '__type', '__typename'].includes(selection.name.value)
		);
		if (isIntrospection) {
			return validateGraphQLResponse<T>(
				await graphql({
					schema: arLmdbSchema,
					source: request.query,
					variableValues: request.variables,
					operationName: request.operationName,
				})
			);
		}
		// Unsupported queries fail before opening or downloading the index.
		plan(request.query, request.variables);
	} catch (error) {
		return {
			errors: [
				{
					message: error instanceof Error ? error.message : 'Unsupported AR LMDB query',
					extensions: { code: 'unservable' },
				},
			],
		};
	}

	const runQuery = async (): Promise<GraphQLResponse<T>> => {
		if (request.signal?.aborted) throw cancelled();
		const index = await waitFor(getIndex(), request.signal);
		if (request.signal?.aborted) throw cancelled();
		let count: { value: number; exact: boolean } | undefined;
		const run = execute(index, request.query, {
			variables: request.variables,
			onEvent: (event) => {
				if (event.type === 'count:done' && typeof event.count === 'number') {
					count = { value: event.count, exact: event.exact === true };
				}
			},
		});
		const handleAbort = () => run.cancel();
		request.signal?.addEventListener('abort', handleAbort, { once: true });
		let timedOut = false;
		const timeout = setTimeout(() => {
			timedOut = true;
			run.cancel();
		}, QUERY_TIMEOUT_MS);
		try {
			const result = validateGraphQLResponse<T>(await run.result);
			if (request.signal?.aborted) throw cancelled();
			if (timedOut) throw new GraphQLApiError('timeout', 'AR LMDB query timed out');
			return {
				...result,
				extensions: { ...result.extensions, arLmdb: { indexId: AR_LMDB_INDEX_ID, ...(count ? { count } : {}) } },
			};
		} finally {
			clearTimeout(timeout);
			request.signal?.removeEventListener('abort', handleAbort);
		}
	};

	const result = queryQueue.then(runQuery);
	queryQueue = result.catch(() => undefined);
	try {
		return await waitFor(result, request.signal);
	} catch (error) {
		if (error instanceof GraphQLApiError) throw error;
		throw new GraphQLApiError('unavailable', error instanceof Error ? error.message : 'AR LMDB query failed');
	}
}
