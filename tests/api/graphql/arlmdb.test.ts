import { afterEach, describe, expect, it, vi } from 'vitest';

import { getBlocks } from '../../../src/api/blocks';
import { executeArLmdbGraphQL } from '../../../src/api/graphql/arLmdbAdapter';

afterEach(() => vi.unstubAllGlobals());

describe('native AR LMDB query surface', () => {
	it('propagates the real unsupported block error with the application error code', async () => {
		const fetch = vi.fn();
		vi.stubGlobal('fetch', fetch);
		await expect(getBlocks()).rejects.toMatchObject({
			code: 'unavailable',
			message: expect.stringContaining('only transactions'),
		});
		expect(fetch).not.toHaveBeenCalled();
	});
	it.each([
		['{ blocks(first: 2) { edges { node { height } } } }', 'only transactions'],
		['{ transaction(id: "abc") { id } }', 'only transactions'],
		['{ transactions(ids: ["abc"]) { edges { node { id } } } }', 'no id family'],
		['{ transactions { count } }', 'no predicate'],
		['{ renamed: transactions(tags: [{name: "Type", values: ["Message"]}]) { count } }', 'aliases'],
	])('reports unsupported %s before any download', async (query, message) => {
		const fetch = vi.fn();
		vi.stubGlobal('fetch', fetch);
		const response = await executeArLmdbGraphQL({ query });
		expect(response.errors?.[0].message).toContain(message);
		expect(fetch).not.toHaveBeenCalled();
	});

	it('provides local schema docs without fetching an index or remote GraphQL', async () => {
		const fetch = vi.fn();
		vi.stubGlobal('fetch', fetch);
		const response = await executeArLmdbGraphQL<{ __schema: { queryType: { fields: { name: string }[] } } }>({
			query: '{ __schema { queryType { fields { name } } } }',
		});
		expect(response.errors).toBeUndefined();
		expect(response.data?.__schema.queryType.fields.map((field) => field.name)).toEqual(['transactions']);
		expect(fetch).not.toHaveBeenCalled();
	});
});
