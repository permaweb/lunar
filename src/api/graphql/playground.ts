import { AR_LMDB_GQL_GATEWAY, DEFAULT_GQL_PLAYGROUND_GATEWAYS, FLAGS, RETIRED_GATEWAY_HOST } from 'helpers/config';

import { executeGraphQL } from './client';
import type { GraphQLResponse } from './types';
import { GraphQLApiError } from './types';

export function getPlaygroundGatewayStorageValue(gateway: string): string {
	const normalized = gateway
		.trim()
		.replace(/\/+$/, '')
		.replace(/\/graphql$/i, '')
		.replace(/^https?:\/\//i, '');
	return normalized.toLowerCase() === 'ar lmdb' || normalized.toLowerCase() === AR_LMDB_GQL_GATEWAY
		? AR_LMDB_GQL_GATEWAY
		: normalized;
}

export function getPlaygroundGatewayInputValue(gateway: string): string {
	if (getPlaygroundGatewayStorageValue(gateway) === AR_LMDB_GQL_GATEWAY) return AR_LMDB_GQL_GATEWAY;
	const normalized = gateway
		.trim()
		.replace(/\/+$/, '')
		.replace(/\/graphql$/i, '');
	return /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
}

export function getPlaygroundGatewayLabel(gateway: string): string {
	return getPlaygroundGatewayStorageValue(gateway) === AR_LMDB_GQL_GATEWAY ? 'AR LMDB' : gateway;
}

export function isRetiredGraphQLGateway(gateway: string): boolean {
	try {
		return (
			new URL(getPlaygroundGatewayInputValue(gateway)).hostname.toLowerCase().replace(/\.$/, '') ===
			RETIRED_GATEWAY_HOST
		);
	} catch {
		return false;
	}
}

export function getPlaygroundGateways(stored: unknown): string[] {
	const entries = Array.isArray(stored) ? stored : DEFAULT_GQL_PLAYGROUND_GATEWAYS;
	const normalized = entries
		.filter((gateway): gateway is string => typeof gateway === 'string')
		.map(getPlaygroundGatewayStorageValue)
		.filter((gateway) => gateway && gateway !== AR_LMDB_GQL_GATEWAY && !isRetiredGraphQLGateway(gateway));
	const hasLocalOption = entries.some(
		(gateway) => typeof gateway === 'string' && getPlaygroundGatewayStorageValue(gateway) === AR_LMDB_GQL_GATEWAY
	);
	return [
		AR_LMDB_GQL_GATEWAY,
		...new Set(normalized.length > 0 || hasLocalOption ? normalized : DEFAULT_GQL_PLAYGROUND_GATEWAYS),
	];
}

export function getInitialPlaygroundGateway(
	initialGateway: unknown,
	gateways: string[],
	useArLmdb = FLAGS.USE_AR_LMDB_GQL
): string {
	if (typeof initialGateway === 'string' && initialGateway.trim() && !isRetiredGraphQLGateway(initialGateway)) {
		return getPlaygroundGatewayStorageValue(initialGateway);
	}
	if (useArLmdb) return AR_LMDB_GQL_GATEWAY;
	return gateways.find((gateway) => gateway !== AR_LMDB_GQL_GATEWAY) || DEFAULT_GQL_PLAYGROUND_GATEWAYS[0];
}

export function preparePlaygroundQuery(query: string): string {
	const trimmed = query.trim();
	const withoutComments = trimmed
		.replace(/#[^\n]*/g, '')
		.replace(/"""[\s\S]*?"""/g, '')
		.trim();
	const hasWrapper = /^\s*(?:query|mutation|subscription)(?:\s+[A-Za-z][A-Za-z0-9_]*)?(?:\s*\([^)]*\))?\s*\{/.test(
		withoutComments
	);
	return hasWrapper || /^\s*\{/.test(withoutComments) ? trimmed : `query { ${trimmed} }`;
}

export async function executePlaygroundQuery(args: {
	query: string;
	gateway: string;
	variables?: string;
	signal?: AbortSignal;
}): Promise<GraphQLResponse> {
	if (isRetiredGraphQLGateway(args.gateway)) {
		throw new GraphQLApiError('invalid-input', 'This GraphQL gateway is unavailable');
	}
	let variables: Record<string, unknown> | undefined;
	if (args.variables?.trim()) {
		let parsed: unknown;
		try {
			parsed = JSON.parse(args.variables);
		} catch {
			throw new GraphQLApiError('invalid-input', 'Query variables must be a valid JSON object');
		}
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			throw new GraphQLApiError('invalid-input', 'Query variables must be a JSON object');
		}
		if (Object.keys(parsed).length > 0) variables = parsed as Record<string, unknown>;
	}
	return executeGraphQL({
		query: preparePlaygroundQuery(args.query),
		variables,
		gateway: args.gateway,
		source: getPlaygroundGatewayStorageValue(args.gateway) === AR_LMDB_GQL_GATEWAY ? 'ar-lmdb' : 'remote',
		signal: args.signal,
	});
}
