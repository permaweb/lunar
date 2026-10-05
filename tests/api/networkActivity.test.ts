import { afterEach, expect, it, vi } from 'vitest';

import { setGraphQLEndpoint } from '../../src/api/graphql';
import { getNetworkActivity, parseNetworkActivity } from '../../src/api/networkActivity';
import { DEFAULT_GRAPHQL_ENDPOINT } from '../../src/helpers/config';

const tx = (id: string, type?: string, timestamp: number | null = 100) => ({
	node: {
		id: id.repeat(43),
		block: timestamp === null ? null : { timestamp },
		data: { size: '1000' as unknown },
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
	expect(activity.map((entry) => entry.dataSize)).toEqual(['1000', '1000', null, '1000', '1000']);
});
it.each(['0', 0, '9007199254740993', null, undefined, '', '-1', -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1])(
	'normalizes data sizes without confusing missing values with zero: %s',
	(size) => {
		const response = payload();
		response.data.transactions.edges[0].node.data.size = size;
		const entry = parseNetworkActivity(response).find((item) => item.id === 't'.repeat(43));
		expect(entry.dataSize).toBe(size === '0' || size === 0 ? '0' : size === '9007199254740993' ? size : null);
	}
);
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
	expect(JSON.parse(fetch.mock.calls[0][1].body).query.match(/first: 20/g)).toHaveLength(4);
	expect(JSON.parse(fetch.mock.calls[0][1].body).query).toContain('data { size }');
});
