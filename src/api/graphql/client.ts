import { AR_LMDB_GQL_GATEWAY, DEFAULT_GATEWAYS, RETIRED_GATEWAY_HOST } from 'helpers/config';

import { getConfiguredGraphQLSource } from './source';
import { GraphQLApiError, GraphQLRequest, GraphQLResponse, isRecord, validateGraphQLResponse } from './types';

export function getGraphQLSource(request: Pick<GraphQLRequest, 'source' | 'gateway'> = {}) {
	return request.source ?? (request.gateway === AR_LMDB_GQL_GATEWAY ? 'ar-lmdb' : getConfiguredGraphQLSource());
}

export function getRemoteGraphQLEndpoint(gateway = DEFAULT_GATEWAYS.arweave): string {
	try {
		const trimmed = gateway.trim();
		const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
		if (!['http:', 'https:'].includes(url.protocol) || url.hostname.replace(/\.$/, '') === RETIRED_GATEWAY_HOST) {
			throw new Error('Unavailable gateway');
		}
		if (!/\/graphql\/?$/i.test(url.pathname)) url.pathname = `${url.pathname.replace(/\/+$/, '')}/graphql`;
		return url.toString();
	} catch {
		throw new GraphQLApiError('invalid-input', 'This GraphQL gateway is unavailable');
	}
}

export async function executeGraphQL<T = Record<string, unknown>>(
	request: GraphQLRequest
): Promise<GraphQLResponse<T>> {
	if (!request.query?.trim() || (request.variables !== undefined && !isRecord(request.variables))) {
		throw new GraphQLApiError('invalid-input', 'A GraphQL query and an object of variables are required');
	}
	if (request.signal?.aborted) throw new GraphQLApiError('cancelled', 'GraphQL query cancelled');

	if (getGraphQLSource(request) === 'ar-lmdb') {
		const { executeArLmdbGraphQL } = await import('./arLmdbAdapter');
		return executeArLmdbGraphQL<T>(request);
	}

	try {
		const response = await fetch(getRemoteGraphQLEndpoint(request.gateway), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'Codec-Device': 'json@1.0' },
			body: JSON.stringify({
				query: request.query,
				...(request.variables === undefined ? {} : { variables: request.variables }),
				...(request.operationName ? { operationName: request.operationName } : {}),
			}),
			signal: request.signal,
		});
		if (!response.ok) throw new GraphQLApiError('unavailable', `GraphQL request failed with status ${response.status}`);
		return validateGraphQLResponse<T>(await response.json());
	} catch (error) {
		if (request.signal?.aborted) throw new GraphQLApiError('cancelled', 'GraphQL query cancelled');
		if (error instanceof GraphQLApiError) throw error;
		throw new GraphQLApiError('unavailable', error instanceof Error ? error.message : 'GraphQL request failed');
	}
}
