// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { arweaveNodeApi } from '../../../src/api/arweaveNode';
import { nodesApi } from '../../../src/api/nodes';
import { darkTheme, theme } from '../../../src/helpers/themes';
import Nodes from '../../../src/views/Nodes/Nodes';
import { hash, NODE_INFO } from '../../fixtures/arweaveNode';

vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden={'true'} /> }));
vi.mock('api/arweaveNode', () => ({ arweaveNodeApi: { getInfo: vi.fn(), getAncestors: vi.fn() } }));
vi.mock('api/nodes', () => ({
	nodesApi: {
		getPeers: vi.fn(),
		getCachedInfo: vi.fn().mockReturnValue([]),
		supportsInfo: vi.fn().mockResolvedValue(false),
		getInfo: vi.fn(),
	},
}));
const peers = Array.from({ length: 5 }, (_, i) => ({
	address: `8.8.8.${i + 1}:1984`,
	ip: `8.8.8.${i + 1}`,
	port: 1984,
}));
const container = document.createElement('main');
let root: ReturnType<typeof createRoot>;
function Location() {
	const location = useLocation();
	const navigate = useNavigate();
	return (
		<>
			<output aria-label={'Current route'}>{location.pathname}</output>
			<button onClick={() => navigate(-1)}>Back</button>
		</>
	);
}
async function render(path = '/nodes/') {
	await React.act(async () =>
		root.render(
			<ThemeProvider theme={theme(darkTheme)}>
				<MemoryRouter initialEntries={[path]}>
					<Routes>
						<Route path={'/nodes/'} element={<Nodes />} />
						<Route path={'/nodes/by-fork'} element={<Nodes />} />
					</Routes>
					<Location />
				</MemoryRouter>
			</ThemeProvider>
		)
	);
}
function button(label: string) {
	return [...container.querySelectorAll('button')].find((button) => button.textContent === label);
}
beforeEach(() => {
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	document.body.append(container);
	root = createRoot(container);
	vi.mocked(nodesApi.getPeers).mockResolvedValue(peers);
});
afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.clearAllMocks();
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe('nodes view selection and progressive fork rendering', () => {
	it('keeps Default unchanged, persists By Fork in the path, and cancels checks when switching back', async () => {
		const requests: { address: string; signal: AbortSignal; resolve: (info: typeof NODE_INFO) => void }[] = [];
		vi.mocked(arweaveNodeApi.getInfo).mockImplementation(
			(address, signal) =>
				new Promise((resolve, reject) => {
					requests.push({ address, signal, resolve });
					signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true });
				})
		);
		await render();
		expect(arweaveNodeApi.getInfo).not.toHaveBeenCalled();
		expect(container.textContent).toContain('Show Map');
		await React.act(async () => (container.querySelector('input[value="by-fork"]') as HTMLInputElement).click());
		expect(container.querySelector('output').textContent).toBe('/nodes/by-fork');
		expect(requests).toHaveLength(4);
		await React.act(async () => requests[0].resolve(NODE_INFO));
		expect(requests).toHaveLength(5);
		expect(container.querySelector('table').textContent).toContain('Tip height 100');
		expect(container.querySelector('table [role="status"]').textContent).toBe('Checking node tips (1 of 5)...');
		expect(container.querySelectorAll('tbody tr td:first-child a')).toHaveLength(5);
		await React.act(async () => (container.querySelector('input[value="default"]') as HTMLInputElement).click());
		expect(container.querySelector('output').textContent).toBe('/nodes/');
		expect(requests.every((request) => request.signal.aborted)).toBe(true);
		await React.act(async () => button('Back').click());
		expect(container.querySelector('output').textContent).toBe('/nodes/by-fork');
		expect((container.querySelector('input[value="by-fork"]') as HTMLInputElement).checked).toBe(true);
	});
	it('opens a deep link directly, reuses node links, groups shared ancestry, and only counts pages in the footer', async () => {
		vi.mocked(arweaveNodeApi.getInfo).mockImplementation(async (address) => {
			const i = peers.findIndex((peer) => peer.address === address);
			if (i === 4) throw new Error('unavailable');
			return {
				...NODE_INFO,
				height: i < 2 ? 100 : i === 2 ? 99 : 98,
				hash: i < 2 ? hash(100) : i === 2 ? 'b'.repeat(64) : hash(98),
			};
		});
		vi.mocked(arweaveNodeApi.getAncestors).mockImplementation(async (_node, _anchor, heights) =>
			heights.map((height) => ({ height, hash: hash(height) }))
		);
		await render('/nodes/by-fork');
		expect((container.querySelector('input[value="by-fork"]') as HTMLInputElement).checked).toBe(true);
		expect(container.textContent).toContain('Fork 1');
		expect(container.textContent).toContain('Fork 2');
		expect(container.textContent).toContain('Shared Ancestor');
		expect(container.textContent).toContain('Unclassified');
		expect(container.textContent).not.toContain('Checking block ancestry');
		expect(container.textContent.match(/Page \(1 of 1\)/g)).toHaveLength(1);
		expect(arweaveNodeApi.getAncestors).toHaveBeenCalledTimes(2);
		expect([...container.querySelectorAll('td:first-child a')].map((link) => link.getAttribute('href'))).toContain(
			'#/explorer/http%3A%2F%2F8.8.8.1%3A1984'
		);
		expect((await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })).violations).toEqual([]);
	});
	it('tries another peer on the same tip after a reorg, then retains unknown relationships if all sources fail', async () => {
		vi.mocked(nodesApi.getPeers).mockResolvedValue(peers.slice(0, 3));
		vi.mocked(arweaveNodeApi.getInfo).mockImplementation(async (address) =>
			address === peers[2].address ? { ...NODE_INFO, height: 99, hash: hash(99) } : NODE_INFO
		);
		vi.mocked(arweaveNodeApi.getAncestors).mockRejectedValue(new Error('chain-changed'));
		await render('/nodes/by-fork');
		expect(arweaveNodeApi.getAncestors).toHaveBeenCalledTimes(2);
		expect(container.textContent).toContain('Unverified Ancestry');
		expect(container.textContent).not.toContain('Fork 1');
		expect(container.querySelectorAll('td:first-child a')).toHaveLength(3);
		expect(button('Refresh').disabled).toBe(false);
	});
	it('bounds slow node scans and leaves unfinished peers visible for retry', async () => {
		vi.useFakeTimers();
		vi.mocked(arweaveNodeApi.getInfo).mockImplementation((node, signal) =>
			node === peers[0].address
				? Promise.resolve(NODE_INFO)
				: new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('cancelled'))))
		);
		await render('/nodes/by-fork');
		await React.act(async () => vi.advanceTimersByTimeAsync(60_001));
		expect(container.textContent).toContain('Unclassified');
		expect(container.textContent).not.toContain('Checking node tips');
		expect(container.querySelectorAll('td:first-child a')).toHaveLength(5);
		expect(button('Refresh').disabled).toBe(false);
		expect(button('Continue Checking')).toBeDefined();
		vi.mocked(arweaveNodeApi.getInfo).mockResolvedValue(NODE_INFO);
		await React.act(async () => button('Continue Checking').click());
		expect(container.textContent).not.toContain('Unclassified');
		expect(button('Continue Checking')).toBeUndefined();
		expect(vi.mocked(arweaveNodeApi.getInfo).mock.calls.filter(([node]) => node === peers[0].address)).toHaveLength(1);
	});
});
