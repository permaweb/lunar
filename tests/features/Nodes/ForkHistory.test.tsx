// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { arweaveNodeApi, ArweaveNodeError } from '../../../src/api/arweaveNode';
import { buildForkGraph, parseRecent } from '../../../src/api/arweaveNode/forks';
import { ForkHistory } from '../../../src/features/Nodes/components/organisms/ForkHistory';
import { NodeForks } from '../../../src/features/Nodes/components/organisms/NodeForks';
import { useNodeForks } from '../../../src/features/Nodes/hooks/useNodeForks';
import { darkTheme, theme } from '../../../src/helpers/themes';
import { hash, NODE_INFO, NODE_URL, nodeBlock } from '../../fixtures/arweaveNode';

vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden={'true'} /> }));
vi.mock('react-redux', () => ({ useDispatch: () => vi.fn(), useSelector: () => null }));
vi.mock('store', () => ({ store: { getState: () => ({}) } }));
vi.mock('store/transactions/reducer', () => ({ selectTransaction: () => null }));
vi.mock('api/arweaveNode', async () => ({
	...(await vi.importActual('../../../src/api/arweaveNode')),
	arweaveNodeApi: { getForkHistory: vi.fn() },
}));
vi.mock('../../../src/features/Nodes/hooks/useNodeForks', () => ({ useNodeForks: vi.fn() }));
vi.mock('../../../src/features/Nodes/components/molecules/NodeTable', () => ({
	NodeTable: () => <div>Node table rows</div>,
}));
const orphan = 'z'.repeat(64);
const snapshot = parseRecent({
	blocks: [],
	forks: [{ id: 'f'.repeat(43), height: 99, timestamp: 1700000000, blocks: [orphan] }],
});
snapshot.blocks = [{ id: hash(100), height: 100 }];
const history = {
	graph: buildForkGraph(snapshot, new Map([[orphan, hash(98)]]), [], 'forks'),
	blocks: [nodeBlock(100)],
	forksAvailable: true,
	checkedAt: 1700000000000,
};
let root: ReturnType<typeof createRoot>;
let container: HTMLElement;
let overlay: HTMLElement;
let viewportHeight: number;
let notifyResize: () => void;
const disconnectObserver = vi.fn();
beforeEach(() => {
	vi.resetAllMocks();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	viewportHeight = 520;
	vi.stubGlobal(
		'ResizeObserver',
		class {
			constructor(callback: () => void) {
				notifyResize = callback;
			}
			observe(element: HTMLElement) {
				Object.defineProperty(element, 'clientHeight', { configurable: true, get: () => viewportHeight });
				notifyResize();
			}
			disconnect = disconnectObserver;
		}
	);
	vi.mocked(arweaveNodeApi.getForkHistory).mockResolvedValue(history);
	container = document.createElement('main');
	overlay = document.createElement('div');
	overlay.id = 'overlay';
	document.body.append(container, overlay);
	root = createRoot(container);
});
afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	overlay.remove();
	vi.unstubAllGlobals();
});
async function render(revision = 0) {
	await React.act(async () =>
		root.render(
			<MemoryRouter>
				<ThemeProvider theme={theme(darkTheme)}>
					<ForkHistory nodes={[NODE_URL, 'http://other.node']} refreshRevision={revision} onLoadingChange={vi.fn()} />
				</ThemeProvider>
			</MemoryRouter>
		)
	);
}
it('renders verified graph links, accessible block navigation, and refreshes without hiding the graph', async () => {
	await render();
	expect(container.textContent).toContain('Orphaned');
	expect(document.querySelector('[role="dialog"]')).toBeNull();
	expect(container.textContent).toContain('Parent block');
	expect(container.querySelector(`a[href*="${orphan}"]`)).not.toBeNull();
	vi.mocked(arweaveNodeApi.getForkHistory).mockRejectedValue(new ArweaveNodeError('timeout'));
	await render(1);
	expect(container.textContent).toContain('Orphaned');
	expect(container.textContent).toContain('Showing the last successful observation');
	const accessibility = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
	expect(accessibility.violations).toEqual([]);
});
it('renders progressive graphs and cancels outstanding reads when closed', async () => {
	vi.mocked(arweaveNodeApi.getForkHistory).mockImplementation((_node, _signal, onProgress) => {
		onProgress(history);
		return new Promise(() => {});
	});
	await render();
	expect(container.textContent).toContain('Loading fork history...');
	expect(container.textContent).toContain('Orphaned');
	const signal = vi.mocked(arweaveNodeApi.getForkHistory).mock.calls[0][1];
	await React.act(async () => root.unmount());
	root = createRoot(container);
	expect(signal.aborted).toBe(true);
});
it('explains unsupported fork history instead of claiming that no forks exist', async () => {
	vi.mocked(arweaveNodeApi.getForkHistory).mockRejectedValue(new ArweaveNodeError('not-found', 404));
	await render();
	expect(container.textContent).toContain('This node does not provide recent fork history.');
});

it('swaps the whole fork table for inline history and routes the shared Refresh action to the graph', async () => {
	const refresh = vi.fn();
	const pause = vi.fn();
	const continueChecks = vi.fn();
	vi.mocked(useNodeForks).mockReturnValue({
		state: {
			status: 'ancestry',
			data: {
				peers: [{ address: NODE_URL, ip: '38.22.0.55', port: 1984 }],
				infos: { [NODE_URL]: NODE_INFO },
				observations: {
					[NODE_URL]: { peer: NODE_URL, status: 'reachable', checkedAt: 1700000000000, latencyMs: 50, info: NODE_INFO },
				},
				ancestry: {},
				checkingPeers: [],
			},
		},
		refresh,
		pause,
		continueChecks,
	});
	await React.act(async () =>
		root.render(
			<MemoryRouter>
				<ThemeProvider theme={theme(darkTheme)}>
					<NodeForks />
				</ThemeProvider>
			</MemoryRouter>
		)
	);
	const button = (label: string) => [...container.querySelectorAll('button')].find((b) => b.textContent === label)!;
	expect(container.textContent).toContain('Node table rows');
	await React.act(async () => button('Show Fork History').click());
	expect(pause).toHaveBeenCalledOnce();
	expect(container.textContent).not.toContain('Node table rows');
	expect(button('Next')).toBeUndefined();
	expect(document.querySelector('[role="dialog"]')).toBeNull();
	expect(container.textContent).toContain('Orphaned');
	await React.act(async () => button('Refresh').click());
	expect(arweaveNodeApi.getForkHistory).toHaveBeenCalledTimes(2);
	expect(refresh).not.toHaveBeenCalled();
	await React.act(async () => button('Show Table').click());
	expect(continueChecks).toHaveBeenCalledOnce();
	expect(container.textContent).toContain('Node table rows');
	expect(container.textContent).not.toContain('Orphaned');
});

it('renders all visible rows after resizing and disconnects its height observer', async () => {
	vi.mocked(arweaveNodeApi.getForkHistory).mockResolvedValue({
		...history,
		graph: buildForkGraph({
			blocks: Array.from({ length: 25 }, (_, index) => ({ id: hash(100 - index), height: 100 - index })),
			forks: [],
			forksAvailable: true,
		}),
	});
	await render();
	const blockLink = (height: number) => container.querySelector(`a[href*="${hash(height)}"]`);
	expect(blockLink(91)).toBeNull();
	await React.act(async () => {
		viewportHeight = 1500;
		notifyResize();
	});
	expect(blockLink(91)).not.toBeNull();
	await React.act(async () => {
		viewportHeight = 152;
		notifyResize();
	});
	expect(blockLink(91)).toBeNull();
	const scroll = container.querySelector<HTMLElement>('[aria-label="Fork History"]');
	await React.act(async () => {
		scroll.scrollTop = 20 * 152;
		scroll.dispatchEvent(new Event('scroll'));
	});
	expect(blockLink(80)).not.toBeNull();
	await React.act(async () => root.unmount());
	root = createRoot(container);
	expect(disconnectObserver).toHaveBeenCalledOnce();
});
