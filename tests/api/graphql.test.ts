import { afterEach, describe, expect, it } from 'vitest';

import { getGraphQLEndpoint, normalizeGraphQLEndpoint, setGraphQLEndpoint } from '../../src/api/graphql';
import { DEFAULT_GRAPHQL_ENDPOINT } from '../../src/helpers/config';

afterEach(() => {
	setGraphQLEndpoint(DEFAULT_GRAPHQL_ENDPOINT);
});

describe('GraphQL endpoint', () => {
	it('defaults to the arweave.net query device', () => {
		expect(getGraphQLEndpoint()).toBe('https://arweave.net/~query@1.0/graphql');
	});

	it.each([
		['https://arweave.net/~query@1.0/graphql', 'https://arweave.net/~query@1.0/graphql'],
		['  https://gateway.example/graphql/  ', 'https://gateway.example/graphql'],
		['https://gateway.example', 'https://gateway.example/graphql'],
		['http://localhost:8734/~query@1.0/graphql', 'http://localhost:8734/~query@1.0/graphql'],
	])('normalizes %s', (input, expected) => {
		expect(normalizeGraphQLEndpoint(input)).toBe(expected);
	});

	it.each(['', '   ', 'gateway.example/graphql', 'ftp://gateway.example/graphql', 'javascript:alert(1)', null, 42])(
		'rejects %s',
		(input) => {
			expect(normalizeGraphQLEndpoint(input)).toBeNull();
		}
	);

	it('uses a configured endpoint and falls back to the default for an invalid one', () => {
		setGraphQLEndpoint('https://gateway.example/graphql');
		expect(getGraphQLEndpoint()).toBe('https://gateway.example/graphql');

		setGraphQLEndpoint('not a url');
		expect(getGraphQLEndpoint()).toBe(DEFAULT_GRAPHQL_ENDPOINT);
	});
});
