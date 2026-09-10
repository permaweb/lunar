// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { ExplorerTabs } from '../../../src/features/Explorer';
import { getArweaveNodeRoute } from '../../../src/helpers/arweaveNode';
import { darkTheme, theme } from '../../../src/helpers/themes';
import { NODE_URL } from '../../fixtures/arweaveNode';

vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden={'true'} /> }));
vi.mock('components/organisms/AOS', () => ({ AOS: () => null }));
vi.mock('components/organisms/Transaction', () => ({ Transaction: (props) => <div data-transaction={props.txId} /> }));
vi.mock('../../../src/features/Explorer/components/organisms/ArweaveNode', () => ({
	ArweaveNode: (props) => <div data-node={props.node} />,
}));

let root: ReturnType<typeof createRoot>;
let container: HTMLElement;
let currentPath = '';
let navigate: ReturnType<typeof useNavigate>;
function Harness() {
	navigate = useNavigate();
	currentPath = useLocation().pathname;
	return <ExplorerTabs type={'explorer'} />;
}
beforeEach(() => {
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	Element.prototype.scrollTo = vi.fn();
	localStorage.removeItem('explorer-transactions');
	container = document.createElement('main');
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});
async function render(path: string) {
	await React.act(async () =>
		root.render(
			<MemoryRouter initialEntries={[path]}>
				<ThemeProvider theme={theme(darkTheme)}>
					<Harness />
				</ThemeProvider>
			</MemoryRouter>
		)
	);
}
const tabs = () => JSON.parse(localStorage.getItem('explorer-transactions'));

it('opens encoded node deep links as arweave-node tabs and preserves the selected subtab', async () => {
	await render(getArweaveNodeRoute(NODE_URL, 'miners'));
	expect(tabs()).toMatchObject([
		{ id: NODE_URL, type: 'arweave-node', lastRoute: getArweaveNodeRoute(NODE_URL, 'miners') },
	]);
	expect(container.querySelector('[data-node]')?.getAttribute('data-node')).toBe(NODE_URL);
	expect(container.querySelector('[data-transaction]')).toBeNull();
	await React.act(async () => navigate(getArweaveNodeRoute(NODE_URL, 'mempool')));
	expect(tabs()).toHaveLength(1);
	expect(tabs()[0].lastRoute).toBe(getArweaveNodeRoute(NODE_URL, 'mempool'));
	await React.act(async () => navigate(getArweaveNodeRoute('https://node.example')));
	expect(tabs()).toHaveLength(2);
	await React.act(async () => navigate(getArweaveNodeRoute(NODE_URL, 'mempool')));
	expect(tabs()).toHaveLength(2);
	expect(currentPath).toBe(getArweaveNodeRoute(NODE_URL, 'mempool'));
});

it('restores persisted node tabs without turning URL segments into transaction IDs', async () => {
	localStorage.setItem(
		'explorer-transactions',
		JSON.stringify([
			{
				id: NODE_URL,
				label: NODE_URL,
				type: 'arweave-node',
				tabKey: 'node-1',
				lastRoute: getArweaveNodeRoute(NODE_URL, 'miners'),
			},
		])
	);
	await render('/explorer/');
	expect(currentPath).toBe(getArweaveNodeRoute(NODE_URL, 'miners'));
	expect(tabs()).toHaveLength(1);
	expect(tabs()[0].type).toBe('arweave-node');
});

it('continues to open existing transaction routes', async () => {
	const id = 'a'.repeat(43);
	await render('/explorer/' + id);
	expect(tabs()).toMatchObject([{ id, type: 'transaction' }]);
	expect(container.querySelector('[data-transaction]')?.getAttribute('data-transaction')).toBe(id);
});

it('opens a node deep link even when saved tabs contain corrupt JSON', async () => {
	localStorage.setItem('explorer-transactions', '{invalid');
	await render(getArweaveNodeRoute(NODE_URL));
	expect(tabs()).toMatchObject([{ id: NODE_URL, type: 'arweave-node' }]);
});
