import { afterEach, describe, expect, it, vi } from 'vitest';

import { executeGraphQL } from '../../../src/api/graphql/client';
import { setConfiguredGraphQLSource } from '../../../src/api/graphql/source';

const local = vi.hoisted(() => vi.fn());
vi.mock('../../../src/api/graphql/arLmdbAdapter', () => ({ executeArLmdbGraphQL: local }));

afterEach(() => {
	vi.unstubAllGlobals();
	vi.clearAllMocks();
	setConfiguredGraphQLSource('ar-lmdb');
});

describe('GraphQL source switch', () => {
	it('uses local execution by default, including callers that specify a remote gateway', async () => {
		const fetch = vi.fn();
		vi.stubGlobal('fetch', fetch);
		local.mockResolvedValue({ data: { transactions: { edges: [] } } });
		const request = { query: '{ transactions { edges { node { id } } } }', gateway: 'https://arweave.net/graphql' };
		await executeGraphQL(request);
		expect(local).toHaveBeenCalledWith(request);
		expect(fetch).not.toHaveBeenCalled();
	});

	it('sends the original query and variables when Remote is selected in settings', async () => {
		setConfiguredGraphQLSource('remote');
		const fetch = vi
			.fn()
			.mockResolvedValue({ ok: true, json: async () => ({ data: { transactions: { edges: [] } } }) });
		vi.stubGlobal('fetch', fetch);
		const request = {
			query: 'query Q($first: Int) { transactions(first: $first) { count } }',
			variables: { first: 2 },
			gateway: 'gateway.example/custom',
		};
		await executeGraphQL(request);
		expect(fetch.mock.calls[0][0]).toBe('https://gateway.example/custom/graphql');
		expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ query: request.query, variables: request.variables });
		expect(local).not.toHaveBeenCalled();
	});

	it('honors an explicit remote playground selection even when settings select AR LMDB', async () => {
		const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { __typename: 'Query' } }) });
		vi.stubGlobal('fetch', fetch);
		await executeGraphQL({ query: '{ __typename }', source: 'remote' });
		expect(fetch).toHaveBeenCalledOnce();
		expect(local).not.toHaveBeenCalled();
	});

	it('never falls back remotely on local errors', async () => {
		const fetch = vi.fn();
		vi.stubGlobal('fetch', fetch);
		local.mockRejectedValue(new Error('Missing index chunk'));
		await expect(executeGraphQL({ query: '{ transactions { count } }' })).rejects.toThrow('Missing index chunk');
		expect(fetch).not.toHaveBeenCalled();
	});

	it.each(['https://cache.forward.computer/~query@1.0/graphql', 'https://CACHE.FORWARD.COMPUTER./graphql'])(
		'rejects retired gateway %s before any request',
		async (gateway) => {
			const fetch = vi.fn();
			vi.stubGlobal('fetch', fetch);
			await expect(executeGraphQL({ query: '{ __typename }', gateway, source: 'remote' })).rejects.toMatchObject({
				code: 'invalid-input',
			});
			expect(fetch).not.toHaveBeenCalled();
		}
	);

	it('rejects malformed remote payloads and pre-cancelled calls', async () => {
		const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ error: 'bad' }) });
		vi.stubGlobal('fetch', fetch);
		await expect(executeGraphQL({ query: '{ __typename }', source: 'remote' })).rejects.toMatchObject({
			code: 'invalid-response',
		});
		const controller = new AbortController();
		controller.abort();
		await expect(executeGraphQL({ query: '{ __typename }', signal: controller.signal })).rejects.toMatchObject({
			code: 'cancelled',
		});
		expect(local).not.toHaveBeenCalled();
	});
});
