// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import type { NodeObservation } from '../../../src/api/nodes';
import { nodesApi } from '../../../src/api/nodes';
import { NodesTable } from '../../../src/features/Nodes';
import { FLAGS } from '../../../src/helpers/config';
import { darkTheme, theme } from '../../../src/helpers/themes';

vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden={'true'} /> }));
vi.mock('api/nodes', () => ({
	nodesApi: { getPeers: vi.fn(), getCachedInfo: vi.fn(), supportsInfo: vi.fn(), getInfo: vi.fn() },
}));
const peers = Array.from({ length: 60 }, (_, index) => ({
	address: `8.8.8.${index + 1}:1984`,
	ip: `8.8.8.${index + 1}`,
	port: 1984,
}));
const reachable = (peer: string): NodeObservation => ({
	peer,
	checkedAt: Date.now(),
	status: 'reachable',
	latencyMs: 23,
	info: { height: 1997756, version: 5, release: 100, peers: 247 },
});
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
const defaultShowLoader = FLAGS.SHOW_NODES_LOADER;
beforeEach(() => {
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.mocked(nodesApi.getPeers).mockResolvedValue(peers);
	vi.mocked(nodesApi.getCachedInfo).mockReturnValue([]);
	vi.mocked(nodesApi.supportsInfo).mockResolvedValue(true);
	container = document.createElement('div');
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.resetAllMocks();
	vi.unstubAllGlobals();
	FLAGS.SHOW_NODES_LOADER = defaultShowLoader;
});
async function render() {
	await React.act(async () =>
		root.render(
			<ThemeProvider theme={theme(darkTheme)}>
				<MemoryRouter>
					<NodesTable />
				</MemoryRouter>
			</ThemeProvider>
		)
	);
}

it.each([true, false])(
	'loads progressively with SHOW_NODES_LOADER=%s and leaves offscreen rows unchecked',
	async (showLoader) => {
		FLAGS.SHOW_NODES_LOADER = showLoader;
		const observers = new Map<Element, IntersectionObserverCallback>();
		vi.stubGlobal(
			'IntersectionObserver',
			class {
				constructor(private callback: IntersectionObserverCallback) {}
				observe(target: Element) {
					observers.set(target, this.callback);
				}
				disconnect() {}
			}
		);
		const pending: Array<{ peer: string; signal: AbortSignal; resolve: (data: NodeObservation) => void }> = [];
		let active = 0;
		let maximum = 0;
		vi.mocked(nodesApi.getInfo).mockImplementation(
			(peer, signal) =>
				new Promise((resolve, reject) => {
					active++;
					maximum = Math.max(maximum, active);
					let settled = false;
					const finish = () => {
						if (!settled) active--;
						settled = true;
					};
					signal.addEventListener(
						'abort',
						() => {
							finish();
							reject(new Error('cancelled'));
						},
						{ once: true }
					);
					pending.push({
						peer: peer.address,
						signal,
						resolve: (data) => {
							finish();
							resolve(data);
						},
					});
				})
		);
		let resolvePeers: (value: typeof peers) => void;
		vi.mocked(nodesApi.getPeers).mockReturnValue(
			new Promise((resolve) => {
				resolvePeers = resolve;
			})
		);
		await render();
		expect(container.textContent).not.toContain('No nodes found');
		expect(container.textContent.includes('Loading nodes, this may take some time...')).toBe(showLoader);
		const header = container.querySelector('h2');
		expect(header).not.toBeNull();
		expect(container.textContent).toContain('Page (1 of 1)');
		await React.act(async () => resolvePeers(peers));
		expect(container.querySelector('h2')).toBe(header);
		expect(container.textContent).not.toContain('Loading nodes');
		expect(container.querySelectorAll('tbody tr')).toHaveLength(50);
		expect(container.textContent.match(/Checking\.\.\./g)).toHaveLength(8);
		expect(container.textContent.match(/Not checked/g)).toHaveLength(42);
		expect(pending).toHaveLength(8);
		for (let index = 0; index < 12; index++) {
			const checkingRow = [...container.querySelectorAll('tbody tr')].find(
				(row) => row.querySelector('a')?.getAttribute('title') === pending[index].peer
			);
			expect(checkingRow?.textContent).toContain('Checking...');
			await React.act(async () =>
				pending[index].resolve(
					index < 2
						? { peer: pending[index].peer, checkedAt: Date.now(), status: 'unavailable' }
						: reachable(pending[index].peer)
				)
			);
			expect(container.querySelectorAll('tbody tr')).toHaveLength(50);
			expect(container.textContent).not.toContain('Unavailable');
		}
		expect(maximum).toBe(8);
		expect(container.textContent).not.toContain('Loading nodes');
		expect(container.textContent.match(/Reachable/g)).toHaveLength(10);
		expect(container.querySelectorAll('tbody tr')).toHaveLength(50);
		expect(container.textContent).not.toContain('Unavailable');
		expect(container.textContent).not.toContain('Checking');
		const countAfterInitial = pending.length;
		await React.act(async () => {});
		expect(pending).toHaveLength(countAfterInitial);
		const firstUnchecked = container.querySelectorAll('tbody tr')[10];
		await React.act(async () =>
			observers.get(firstUnchecked)([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
		);
		expect(firstUnchecked.textContent).toContain('Checking...');
		const check = pending[pending.length - 1];
		await React.act(async () => check.resolve({ peer: check.peer, checkedAt: Date.now(), status: 'unavailable' }));
		expect(container.querySelector('tbody').textContent).not.toContain(check.peer);
		expect(container.textContent).not.toContain('Unavailable');
		const replacement = container.querySelectorAll('tbody tr')[10];
		await React.act(async () =>
			observers.get(replacement)([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
		);
		await React.act(async () => pending[pending.length - 1].resolve(reachable(pending[pending.length - 1].peer)));
		expect(container.textContent.match(/Reachable/g)).toHaveLength(11);
		expect(container.textContent).toContain('23 ms');
		const next = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Next');
		await React.act(async () => next.click());
		expect(container.textContent.match(/Unavailable/g)).toHaveLength(3);
	}
);

it('paints cached reachable rows immediately without repeating initial probes', async () => {
	vi.mocked(nodesApi.getCachedInfo).mockReturnValue(peers.slice(20, 30).map((peer) => reachable(peer.address)));
	await render();
	expect(container.querySelector('tbody a')?.getAttribute('title')).toBe(peers[20].address);
	expect(container.textContent.match(/Reachable/g)).toHaveLength(10);
	expect(nodesApi.getInfo).not.toHaveBeenCalled();
	expect(container.textContent).not.toContain('Checking');
});

it('finishes with a shorter first page when fewer than ten peers are reachable', async () => {
	vi.mocked(nodesApi.getPeers).mockResolvedValue(peers.slice(0, 4));
	vi.mocked(nodesApi.getInfo).mockImplementation(async (peer) =>
		peer.address === peers[3].address
			? reachable(peer.address)
			: { peer: peer.address, checkedAt: Date.now(), status: 'unavailable' }
	);
	await render();
	expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
	expect(container.textContent).not.toContain('Unavailable');
	expect(container.textContent).toContain('Reachable');
	expect(container.textContent).toContain('Page (1 of 2)');
});

it('releases the loading screen on a service outage and cancels initial work when leaving', async () => {
	vi.mocked(nodesApi.supportsInfo).mockRejectedValue(new Error('unavailable'));
	await render();
	expect(container.textContent).not.toContain('Loading nodes');
	expect(container.textContent).toContain('Some node checks could not finish');
	expect(nodesApi.getInfo).not.toHaveBeenCalled();
	vi.mocked(nodesApi.supportsInfo).mockResolvedValue(true);
	const signals: AbortSignal[] = [];
	vi.mocked(nodesApi.getInfo).mockImplementation(
		(_peer, signal) =>
			new Promise((_resolve, reject) => {
				signals.push(signal);
				signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true });
			})
	);
	const refresh = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Refresh');
	await React.act(async () => refresh.click());
	expect(signals).toHaveLength(8);
	expect(container.textContent.match(/Checking\.\.\./g)).toHaveLength(8);
	await React.act(async () => root.render(null));
	expect(signals.every((signal) => signal.aborted)).toBe(true);
});
