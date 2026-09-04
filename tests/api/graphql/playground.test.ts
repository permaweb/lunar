import { beforeEach, describe, expect, it, vi } from 'vitest';

import { executeGraphQL } from '../../../src/api/graphql/client';
import {
	executePlaygroundQuery,
	getInitialPlaygroundGateway,
	getPlaygroundGatewayInputValue,
	getPlaygroundGatewayLabel,
	getPlaygroundGateways,
	getPlaygroundGatewayStorageValue,
	isRetiredGraphQLGateway,
} from '../../../src/api/graphql/playground';
import { AR_LMDB_GQL_GATEWAY, DEFAULT_GQL_PLAYGROUND_GATEWAYS } from '../../../src/helpers/config';

vi.mock('../../../src/api/graphql/client', () => ({ executeGraphQL: vi.fn() }));

describe('Playground source preferences', () => {
	it('adds AR LMDB while preserving saved custom gateways and removing retired or invalid entries', () => {
		expect(
			getPlaygroundGateways([
				'https://custom.example/graphql',
				'custom.example',
				'cache.forward.computer/~query@1.0/graphql',
				'https://CACHE.FORWARD.COMPUTER.:443/graphql',
				null,
				42,
			])
		).toEqual([AR_LMDB_GQL_GATEWAY, 'custom.example']);
	});

	it('keeps the local option without inventing an HTTP endpoint or restoring removed remote options', () => {
		expect(getPlaygroundGateways(['AR LMDB'])).toEqual([AR_LMDB_GQL_GATEWAY]);
		expect(getPlaygroundGatewayStorageValue('https://ar-lmdb/graphql')).toBe(AR_LMDB_GQL_GATEWAY);
		expect(getPlaygroundGatewayInputValue(AR_LMDB_GQL_GATEWAY)).toBe(AR_LMDB_GQL_GATEWAY);
		expect(getPlaygroundGatewayLabel(AR_LMDB_GQL_GATEWAY)).toBe('AR LMDB');
	});

	it('uses the preference for new tabs and respects explicit selections with either setting', () => {
		const gateways = getPlaygroundGateways(undefined);
		expect(getInitialPlaygroundGateway(undefined, gateways, true)).toBe(AR_LMDB_GQL_GATEWAY);
		expect(getInitialPlaygroundGateway(undefined, gateways, false)).toBe(DEFAULT_GQL_PLAYGROUND_GATEWAYS[0]);
		expect(getInitialPlaygroundGateway('https://custom.example/graphql', gateways, true)).toBe('custom.example');
		expect(getInitialPlaygroundGateway(AR_LMDB_GQL_GATEWAY, gateways, false)).toBe(AR_LMDB_GQL_GATEWAY);
	});

	it('replaces retired saved selections with the configured default', () => {
		const gateways = getPlaygroundGateways(undefined);
		expect(getInitialPlaygroundGateway('https://cache.forward.computer/~query@1.0/graphql', gateways, true)).toBe(
			AR_LMDB_GQL_GATEWAY
		);
		expect(isRetiredGraphQLGateway('https://CACHE.FORWARD.COMPUTER./graphql')).toBe(true);
		expect(isRetiredGraphQLGateway('https://cache.forward.computer.example/graphql')).toBe(false);
	});

	it('recovers defaults from corrupt preferences', () => {
		expect(getPlaygroundGateways({ invalid: true })).toEqual([AR_LMDB_GQL_GATEWAY, ...DEFAULT_GQL_PLAYGROUND_GATEWAYS]);
	});
});

describe('Playground execution boundary', () => {
	beforeEach(() => {
		vi.mocked(executeGraphQL).mockReset();
		vi.mocked(executeGraphQL).mockResolvedValue({ data: { transactions: { edges: [] } } });
	});

	it('runs the local engine with parsed variables and preserves bare-field query support', async () => {
		const controller = new AbortController();
		await executePlaygroundQuery({
			gateway: AR_LMDB_GQL_GATEWAY,
			query: 'transactions(first: $first) { edges { node { id } } }',
			variables: '{"first":10}',
			signal: controller.signal,
		});
		expect(executeGraphQL).toHaveBeenCalledWith({
			gateway: AR_LMDB_GQL_GATEWAY,
			source: 'ar-lmdb',
			query: 'query { transactions(first: $first) { edges { node { id } } } }',
			variables: { first: 10 },
			signal: controller.signal,
		});
	});

	it('explicit remote selection bypasses the default local preference', async () => {
		const query = 'query Transactions { transactions(first: 10) { count } }';
		await executePlaygroundQuery({ gateway: 'custom.example', query, variables: '{}' });
		expect(executeGraphQL).toHaveBeenCalledWith({
			gateway: 'custom.example',
			source: 'remote',
			query,
			variables: undefined,
			signal: undefined,
		});
	});

	it.each(['{"unfinished":', '[]', 'null', '1'])(
		'rejects invalid variable input %s without running a query',
		async (variables) => {
			await expect(
				executePlaygroundQuery({ gateway: AR_LMDB_GQL_GATEWAY, query: '{ transactions { count } }', variables })
			).rejects.toMatchObject({ code: 'invalid-input' });
			expect(executeGraphQL).not.toHaveBeenCalled();
		}
	);

	it('rejects the retired host before invoking either engine', async () => {
		await expect(
			executePlaygroundQuery({
				gateway: 'https://cache.forward.computer./graphql',
				query: '{ transactions { count } }',
			})
		).rejects.toMatchObject({ code: 'invalid-input' });
		expect(executeGraphQL).not.toHaveBeenCalled();
	});

	it('returns engine errors without retrying against a different source', async () => {
		const result = { errors: [{ message: 'Unsupported query: blocks' }] };
		vi.mocked(executeGraphQL).mockResolvedValueOnce(result);
		await expect(executePlaygroundQuery({ gateway: AR_LMDB_GQL_GATEWAY, query: '{ blocks { count } }' })).resolves.toBe(
			result
		);
		expect(executeGraphQL).toHaveBeenCalledTimes(1);
	});
});
