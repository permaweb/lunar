// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	getGraphQLGatewayKey,
	GRAPHQL_GATEWAYS_STORAGE_KEY,
	GRAPHQL_TABS_STORAGE_KEY,
	resetSavedGraphQLGateways,
} from '../../src/helpers/graphql';

const savedTabs = () => JSON.parse(localStorage.getItem(GRAPHQL_TABS_STORAGE_KEY));

beforeEach(() => {
	localStorage.clear();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('getGraphQLGatewayKey', () => {
	it.each([
		['https://arweave.net/graphql', 'arweave.net'],
		['  http://localhost:1984/graphql/ ', 'localhost:1984'],
		['https://arweave.net/~query@1.0/graphql', 'arweave.net/~query@1.0'],
	])('reduces %s to %s', (gateway, key) => {
		expect(getGraphQLGatewayKey(gateway)).toBe(key);
	});
});

describe('resetSavedGraphQLGateways', () => {
	it('drops the saved gateway list and each tab gateway while keeping tabs and queries', () => {
		localStorage.setItem(
			GRAPHQL_GATEWAYS_STORAGE_KEY,
			JSON.stringify(['ao-search-gateway.goldsky.com', 'arweave.net'])
		);
		localStorage.setItem('graphql-default-gateway', 'arweave.net/~query@1.0');
		localStorage.setItem(
			GRAPHQL_TABS_STORAGE_KEY,
			JSON.stringify([
				{
					id: 'a',
					label: 'Blocks',
					tabKey: 'k1',
					query: '{ blocks { edges { cursor } } }',
					gateway: 'https://arweave.net/~query@1.0',
				},
				{ id: 'b', label: 'Plain', tabKey: 'k2' },
			])
		);

		resetSavedGraphQLGateways();

		expect(localStorage.getItem(GRAPHQL_GATEWAYS_STORAGE_KEY)).toBeNull();
		expect(localStorage.getItem('graphql-default-gateway')).toBeNull();
		expect(savedTabs()).toEqual([
			{ id: 'a', label: 'Blocks', tabKey: 'k1', query: '{ blocks { edges { cursor } } }' },
			{ id: 'b', label: 'Plain', tabKey: 'k2' },
		]);
	});

	it('runs once, keeping gateways saved after the reset', () => {
		resetSavedGraphQLGateways();
		localStorage.setItem(GRAPHQL_GATEWAYS_STORAGE_KEY, JSON.stringify(['arweave.net', 'gateway.example']));
		localStorage.setItem(
			GRAPHQL_TABS_STORAGE_KEY,
			JSON.stringify([{ id: 'a', tabKey: 'k1', gateway: 'https://gateway.example' }])
		);

		resetSavedGraphQLGateways();

		expect(JSON.parse(localStorage.getItem(GRAPHQL_GATEWAYS_STORAGE_KEY))).toEqual(['arweave.net', 'gateway.example']);
		expect(savedTabs()[0].gateway).toBe('https://gateway.example');
	});

	it('does not throw on malformed tabs and retries on the next load', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		localStorage.setItem(GRAPHQL_GATEWAYS_STORAGE_KEY, JSON.stringify(['ao-search-gateway.goldsky.com']));
		localStorage.setItem(GRAPHQL_TABS_STORAGE_KEY, '{broken');

		expect(() => resetSavedGraphQLGateways()).not.toThrow();
		expect(warn).toHaveBeenCalledOnce();
		expect(localStorage.getItem(GRAPHQL_GATEWAYS_STORAGE_KEY)).toBeNull();

		localStorage.setItem(
			GRAPHQL_TABS_STORAGE_KEY,
			JSON.stringify([{ id: 'a', tabKey: 'k1', gateway: 'https://arweave.net' }])
		);
		resetSavedGraphQLGateways();
		expect(savedTabs()[0].gateway).toBeUndefined();
	});
});
