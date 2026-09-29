import { afterEach, expect, it, vi } from 'vitest';

import { setGraphQLEndpoint } from '../../src/api/graphql';
import { getNetworkActivity, parseNetworkActivity } from '../../src/api/networkActivity';
import { DEFAULT_GRAPHQL_ENDPOINT } from '../../src/helpers/config';

const tx = (id: string, type?: string, timestamp: number | null = 100) => ({
	node: {
		id: id.repeat(43),
		block: timestamp === null ? null : { timestamp },
		tags: type
			? [
					{ name: 'Data-Protocol', value: 'ao' },
					{ name: 'Type', value: type },
			  ]
			: [],
	},
});
function payload() {
	return {
		data: {
			blocks: { edges: [{ node: { id: 'b'.repeat(64), height: 5, timestamp: 105 } }] },
			transactions: { edges: [tx('t'), tx('m', 'Message', 110)] },
			messages: { edges: [tx('m', 'Message', 110), tx('u', 'message', null)] },
			processes: { edges: [tx('p', 'Process', 90)] },
		},
	};
}
afterEach(() => {
	vi.unstubAllGlobals();
	setGraphQLEndpoint(DEFAULT_GRAPHQL_ENDPOINT);
});
it('merges both networks, removes duplicate messages, and orders pending and confirmed entries', () => {
	const activity = parseNetworkActivity(payload());
	expect(activity.map((entry) => entry.id[0])).toEqual(['u', 'm', 'b', 't', 'p']);
	expect(activity.map((entry) => entry.network)).toEqual(['ao', 'ao', 'arweave', 'arweave', 'ao']);
	expect(activity.at(-1).kind).toBe('process');
});
it('rejects incomplete and unsafe upstream responses', () => {
	expect(() => parseNetworkActivity({ errors: [{ message: 'error' }] })).toThrow();
	const invalid = payload();
	invalid.data.messages.edges[0].node.id = 'javascript:alert(1)';
	expect(() => parseNetworkActivity(invalid)).toThrow('invalid-response');
	expect(() => parseNetworkActivity({ data: { blocks: { edges: [] } } })).toThrow('invalid-response');
});
it('uses the configured endpoint with one bounded request and propagates cancellation', async () => {
	setGraphQLEndpoint('https://gateway.example/graphql');
	const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => payload() });
	vi.stubGlobal('fetch', fetch);
	const controller = new AbortController();
	await getNetworkActivity(controller.signal);
	expect(fetch).toHaveBeenCalledOnce();
	expect(fetch.mock.calls[0][0]).toBe('https://gateway.example/graphql');
	expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
	expect(JSON.parse(fetch.mock.calls[0][1].body).query).toContain('processes: transactions(first: 6');
});
