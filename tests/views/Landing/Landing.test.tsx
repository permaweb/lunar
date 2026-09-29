// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { getNetworkActivity } from '../../../src/api/networkActivity';
import { getMetricsSnapshot } from '../../../src/api/networkMetrics';
import { getArweaveNodeRoute } from '../../../src/helpers/arweaveNode';
import { STORAGE } from '../../../src/helpers/config';
import { darkTheme, theme } from '../../../src/helpers/themes';
import Landing from '../../../src/views/Landing/Landing';
import { HOME_ACTIVITY, HOME_METRICS } from '../../fixtures/home';

const mocks = vi.hoisted(() => ({
	blocks: vi.fn(),
	transactions: vi.fn(),
	messages: vi.fn(),
	dispatch: vi.fn(),
	provider: { legacyApi: null },
}));
vi.mock('api/blocks', async (original) => ({
	...(await original<typeof import('../../../src/api/blocks')>()),
	getBlocks: mocks.blocks,
	getTransactions: mocks.transactions,
	getBlockMetadataByHeight: async () => ({ txs: [] }),
}));
vi.mock('react-redux', () => ({ useDispatch: () => mocks.dispatch }));
vi.mock('providers/PermawebProvider', () => ({
	usePermawebProvider: () => mocks.provider,
}));
vi.mock('store', () => ({ store: { getState: () => ({}) } }));
vi.mock('store/transactions/reducer', () => ({ selectTransaction: () => null }));
vi.mock('components/molecules/Editor', () => ({ Editor: () => null }));

vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden="true" /> }));
vi.mock('api/networkActivity', () => ({ getNetworkActivity: vi.fn() }));
vi.mock('api/networkMetrics', () => ({ getMetricsSnapshot: vi.fn(), readMetricsSnapshot: () => null }));
vi.mock('components/molecules/MetricChart', () => ({
	MetricChart: (props: { totalLabel: string }) => <div>{props.totalLabel}</div>,
}));
vi.mock('../../../src/views/Landing/NodeConnection', () => ({ NodeConnection: () => null }));
vi.mock('../../../src/views/Landing/Nodes', () => ({ Nodes: () => null }));

let container: HTMLElement;
let root: ReturnType<typeof createRoot>;
let route: string;
let requestSignal: AbortSignal;
function Harness() {
	const location = useLocation();
	route = location.pathname + location.search + location.hash;
	return <Landing />;
}
beforeEach(async () => {
	vi.useFakeTimers();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	Element.prototype.scrollIntoView = vi.fn();
	mocks.provider.legacyApi = { getGQLData: mocks.messages };
	localStorage.clear();
	localStorage.setItem(
		STORAGE.messageFilter('global'),
		JSON.stringify({ perPage: '100', action: 'Eval', variant: 'ao.TN.1', recipient: 'r'.repeat(43) })
	);
	const edges = Array.from({ length: 25 }, (_, i) => ({
		cursor: String(i),
		node: {
			id: String(i).padStart(43, 't'),
			tags: [],
			data: { size: '100' },
			block: { height: 2000000 - i, timestamp: 1790683100 - i },
		},
	}));
	mocks.transactions.mockImplementation(async ({ first }) => ({
		transactions: { edges: edges.slice(0, first), pageInfo: { hasNextPage: true } },
	}));
	mocks.blocks.mockImplementation(async ({ first }) => ({
		blocks: {
			edges: edges.slice(0, first).map((edge, i) => ({
				cursor: edge.cursor,
				node: {
					id: String(i).padStart(64, 'b'),
					height: 2000000 - i,
					timestamp: 1790683100 - i,
					previous: 'b'.repeat(64),
				},
			})),
			pageInfo: { hasNextPage: true },
		},
	}));
	mocks.messages.mockResolvedValue({
		data: edges.map((edge) => ({
			...edge,
			node: {
				...edge.node,
				id: edge.node.id.replaceAll('t', 'm'),
				owner: { address: 'o'.repeat(43) },
				recipient: 'r'.repeat(43),
				tags: [
					{ name: 'Data-Protocol', value: 'ao' },
					{ name: 'Type', value: 'Message' },
				],
			},
		})),
		count: 25,
		nextCursor: null,
	});
	vi.mocked(getMetricsSnapshot).mockResolvedValue(HOME_METRICS);
	vi.mocked(getNetworkActivity).mockImplementation(async (signal) => {
		requestSignal = signal;
		return HOME_ACTIVITY;
	});
	container = document.createElement('main');
	document.body.append(container);
	root = createRoot(container);
	await React.act(async () =>
		root.render(
			<MemoryRouter>
				<ThemeProvider theme={theme(darkTheme)}>
					<Harness />
				</ThemeProvider>
			</MemoryRouter>
		)
	);
});
afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.clearAllMocks();
	vi.useRealTimers();
	vi.unstubAllGlobals();
});
function button(label: string) {
	return [...container.querySelectorAll<HTMLButtonElement>('button')].find((element) => element.textContent === label);
}
async function click(element: HTMLElement) {
	await React.act(async () => element.click());
}
async function enter(query: string) {
	const input = container.querySelector('input');
	await React.act(async () => {
		Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, query);
		input.dispatchEvent(new Event('input', { bubbles: true }));
	});
	await React.act(async () =>
		container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
	);
}
it('presents search, equal network entry points, activity, then detailed statistics', () => {
	const headings = [...container.querySelectorAll('h1,h2')].map((element) => element.textContent);
	expect(headings).toEqual([
		'Explore Arweave + AO',
		'Arweave',
		'AO',
		'Network activity',
		'Network statistics',
		'Your AO connection',
	]);
	expect(container.textContent).toContain('9,007,199,254,740,993');
	expect(getMetricsSnapshot).toHaveBeenCalledOnce();
	expect(container.querySelectorAll('#network-activity .transaction-list-element')).toHaveLength(4);
});
it('restores 10 recent transactions and blocks below Arweave metrics and 20 messages below AO metrics', () => {
	const arweave = container.querySelector('[aria-labelledby="arweave-statistics-title"]');
	const ao = container.querySelector('[aria-labelledby="ao-statistics-title"]');
	expect(arweave.querySelectorAll('.transaction-list-element')).toHaveLength(10);
	expect(arweave.querySelectorAll('.block-list-element')).toHaveLength(10);
	expect(ao.querySelectorAll('.message-list-element')).toHaveLength(20);
	expect(mocks.transactions).toHaveBeenCalledWith(expect.objectContaining({ first: 10, after: null }));
	expect(mocks.blocks).toHaveBeenCalledWith(expect.objectContaining({ first: 10, after: null }));
	expect(mocks.messages).toHaveBeenCalledWith(expect.objectContaining({ paginator: 20, sort: 'descending' }));
	expect(mocks.messages.mock.calls[0][0]).not.toHaveProperty('recipients');
	expect(mocks.messages.mock.calls[0][0].tags).not.toContainEqual({ name: 'Action', values: ['Eval'] });
	expect(arweave.textContent).toContain('Recent Transactions');
	expect(arweave.textContent).toContain('Recent Blocks');
	expect(ao.textContent).toContain('Recent Messages');
	for (const section of [arweave, ao]) {
		expect([...section.querySelectorAll('button')].map((button) => button.textContent)).not.toContain('Filter');
		expect(section.textContent).not.toContain('Page 1');
	}
	expect(ao.querySelector('.message-list-element').textContent).toContain('Message');
});
it('uses the transaction table renderer for activity and opens a block row by height with the keyboard', async () => {
	const row = container.querySelector('#network-activity .transaction-list-element');
	expect(row.getAttribute('role')).toBe('link');
	expect(row.textContent).toContain('Arweave');
	expect(row.textContent).toContain('Block');
	await React.act(async () => row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
	expect(route).toBe('/explorer/2000000');
});
it('filters either network, opens process entries from the AO card, and returns to all activity', async () => {
	const filter = container.querySelector('[role="radiogroup"][aria-label="Filter activity by network"]');
	const option = (value: string) => filter.querySelector<HTMLInputElement>(`input[value="${value}"]`);
	expect(option('all').checked).toBe(true);
	await click(option('ao'));
	expect(option('ao').checked).toBe(true);
	expect(container.querySelectorAll('#network-activity .transaction-list-element')).toHaveLength(2);
	expect(route).toBe('/?network=ao');
	await click(container.querySelector<HTMLAnchorElement>('a[href*="activity=process"]'));
	expect(container.querySelectorAll('#network-activity .transaction-list-element')).toHaveLength(1);
	expect(container.querySelector('#network-activity .transaction-list-element').textContent).toContain(
		'Process registered'
	);
	await click(option('all'));
	expect(option('all').checked).toBe(true);
	expect(route).toBe('/');
	expect(container.querySelectorAll('#network-activity .transaction-list-element')).toHaveLength(4);
	await click(option('arweave'));
	expect(option('arweave').checked).toBe(true);
	expect(container.querySelectorAll('#network-activity .transaction-list-element')).toHaveLength(2);
	expect(container.querySelector('#network-activity .transaction-list-element a').getAttribute('href')).toBe(
		'#/explorer/2000000'
	);
});
it.each([
	[' 12345 ', '/explorer/12345'],
	['p'.repeat(43), '/explorer/' + 'p'.repeat(43)],
	['b'.repeat(64), '/explorer/' + 'b'.repeat(64)],
	['https://arweave.net', getArweaveNodeRoute('https://arweave.net')],
])('submits a universal search for %s', async (query, expected) => {
	await enter(query);
	expect(route).toBe(expected);
});
it('keeps invalid input editable and explains the supported searches', async () => {
	await enter('javascript:alert(1)');
	expect(route).toBe('/');
	expect(container.querySelector('[role="alert"]').textContent).toContain('Enter a transaction');
	expect(container.querySelector('input').value).toBe('javascript:alert(1)');
});
it('retains useful activity on refresh failure and cancels work on unmount', async () => {
	vi.mocked(getNetworkActivity).mockRejectedValueOnce(new Error('offline'));
	await React.act(async () => vi.advanceTimersByTimeAsync(60000));
	expect(container.textContent).toContain('Showing previous activity');
	expect(container.querySelectorAll('#network-activity .transaction-list-element')).toHaveLength(4);
	await click(button('Retry'));
	expect(container.textContent).not.toContain('Showing previous activity');
	await React.act(async () => root.unmount());
	expect(requestSignal.aborted).toBe(true);
	expect(vi.getTimerCount()).toBe(0);
});
it('announces refresh errors and empty results without replacing them with fake rows', async () => {
	vi.mocked(getNetworkActivity).mockResolvedValueOnce([]);
	await click(button('Refresh'));
	expect(container.textContent).toContain('No recent activity is available');
	expect(container.querySelectorAll('#network-activity .transaction-list-element')).toHaveLength(0);
});
it('has accessible headings, links, form controls, and network filters', async () => {
	vi.useRealTimers();
	const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
	expect(result.violations).toEqual([]);
});
