import { beforeEach, describe, expect, it, vi } from 'vitest';

import { executeGraphQL } from '../../../src/api/graphql/client';
import { fetchSchemaDocs } from '../../../src/api/graphql/schema';
import { AR_LMDB_GQL_GATEWAY } from '../../../src/helpers/config';

vi.mock('../../../src/api/graphql/client', () => ({ executeGraphQL: vi.fn() }));

const SCHEMA = {
	queryType: { name: 'Query' },
	types: [
		{
			name: 'Query',
			kind: 'OBJECT',
			fields: [{ name: 'transactions', type: { kind: 'OBJECT', name: 'TransactionConnection' }, args: [] }],
		},
	],
};

describe('GraphQL schema documentation boundary', () => {
	beforeEach(() => {
		vi.mocked(executeGraphQL).mockReset();
		vi.mocked(executeGraphQL).mockResolvedValue({ data: { __schema: SCHEMA } });
	});

	it('introspects the selected engine and caches local and remote schemas separately', async () => {
		await expect(fetchSchemaDocs(AR_LMDB_GQL_GATEWAY)).resolves.toEqual(SCHEMA);
		expect(executeGraphQL).toHaveBeenLastCalledWith(
			expect.objectContaining({ source: 'ar-lmdb', gateway: AR_LMDB_GQL_GATEWAY })
		);
		await fetchSchemaDocs('https://schema-cache.example');
		expect(executeGraphQL).toHaveBeenLastCalledWith(
			expect.objectContaining({ source: 'remote', gateway: 'https://schema-cache.example' })
		);
		await fetchSchemaDocs(AR_LMDB_GQL_GATEWAY);
		await fetchSchemaDocs('https://schema-cache.example/graphql');
		expect(executeGraphQL).toHaveBeenCalledTimes(2);
	});

	it('rejects malformed nested fields instead of exposing them to the UI', async () => {
		vi.mocked(executeGraphQL).mockResolvedValueOnce({
			data: {
				__schema: { types: [{ kind: 'OBJECT', name: 'Query', fields: [{ name: 'transactions', type: null }] }] },
			},
		});
		await expect(fetchSchemaDocs('https://schema-invalid.example')).rejects.toMatchObject({ code: 'invalid-response' });
	});

	it('does not cache GraphQL errors and allows a later retry', async () => {
		vi.mocked(executeGraphQL).mockResolvedValueOnce({ errors: [{ message: 'Introspection unavailable' }] });
		await expect(fetchSchemaDocs('https://schema-retry.example')).rejects.toMatchObject({ code: 'unavailable' });
		await expect(fetchSchemaDocs('https://schema-retry.example')).resolves.toEqual(SCHEMA);
		expect(executeGraphQL).toHaveBeenCalledTimes(2);
	});

	it('forwards cancellation and rejects already-cancelled callers', async () => {
		const controller = new AbortController();
		await fetchSchemaDocs('https://schema-abort.example', controller.signal);
		expect(executeGraphQL).toHaveBeenCalledWith(expect.objectContaining({ signal: controller.signal }));
		controller.abort();
		await expect(fetchSchemaDocs('https://schema-abort.example', controller.signal)).rejects.toMatchObject({
			code: 'cancelled',
		});
		expect(executeGraphQL).toHaveBeenCalledTimes(1);
	});

	it('blocks introspection requests to the retired host', async () => {
		await expect(fetchSchemaDocs('https://cache.forward.computer/graphql')).rejects.toMatchObject({
			code: 'invalid-input',
		});
		expect(executeGraphQL).not.toHaveBeenCalled();
	});
});
