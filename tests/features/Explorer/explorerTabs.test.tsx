// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { ExplorerLink } from '../../../src/components/atoms/TxAddress';
import { ExplorerTabs } from '../../../src/features/Explorer';
import { getArweaveNodeRoute } from '../../../src/helpers/arweaveNode';
import { DOM } from '../../../src/helpers/config';
import type { PinTarget } from '../../../src/helpers/pinnedTabs';
import { parsePinnedTabs, PINNED_TABS_KEY } from '../../../src/helpers/pinnedTabs';
import { darkTheme, theme } from '../../../src/helpers/themes';
import type { GQLNodeResponseType } from '../../../src/helpers/types';
import { PinnedTabsProvider, usePinnedTabsProvider } from '../../../src/providers/PinnedTabsProvider';
import { SettingsProvider } from '../../../src/providers/SettingsProvider';
import { NODE_URL } from '../../fixtures/arweaveNode';

vi.mock('providers/NotificationProvider', () => ({
	NotificationViewport: () => null,
	useNotifications: () => ({ addNotification: vi.fn(), removeNotification: vi.fn() }),
}));
vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden={'true'} /> }));
vi.mock('store', () => ({ store: { getState: () => ({}) } }));
vi.mock('store/transactions/reducer', () => ({ selectTransaction: () => null }));
vi.mock('components/organisms/AOS', () => ({
	AOS: (props) => (
		<div data-process={props.processId}>
			<ExplorerLink value={linkedId} label={'Inspect linked transaction'} />
		</div>
	),
}));
vi.mock('api/aoNetwork', async (original) => {
	const actual = await original<typeof import('../../../src/api/aoNetwork')>();
	const status = { source: 'peers' };
	const transport = {
		getStatus: () => status,
		subscribe: () => () => {},
		readResponse: async (_path: string, parse: (response: Response) => Promise<unknown>) => ({
			data: await parse(new Response('{}', { headers: { 'content-type': 'application/json' } })),
			provider: 'https://ao.example',
			source: 'peers',
		}),
	};
	return { ...actual, getAoReadTransport: () => transport };
});
vi.mock('components/organisms/Transaction', () => ({
	Transaction: (props) => {
		if (props.active) {
			pinTarget = props.pinTarget;
			resolveTransaction = props.onTxChange;
			openMessage = props.onMessageOpen;
		}
		return (
			<div data-transaction={props.txId}>
				<ExplorerLink value={linkedId} label={'Inspect linked transaction'} />
			</div>
		);
	},
}));
vi.mock('../../../src/features/Explorer/components/organisms/ArweaveNode', () => ({
	ArweaveNode: (props) => {
		if (props.isActive) {
			resolveNode = () => props.onResolved(props.node);
			pinTarget = props.pinTarget;
		}
		return (
			<div data-node={props.node}>
				<ExplorerLink value={linkedId} label={'Inspect linked transaction'} />
			</div>
		);
	},
}));

let root: ReturnType<typeof createRoot>;
const linkedId = 'c'.repeat(43);
let container: HTMLElement;
let currentPath = '';
let currentRoute = '';
let navigate: ReturnType<typeof useNavigate>;
let resolveNode: () => void;
let openMessage: (id: string) => void;
let resolveTransaction: (transaction: GQLNodeResponseType) => void;
let pinTarget: PinTarget;
let togglePin: ReturnType<typeof usePinnedTabsProvider>['toggle'];
function Harness(props: { type?: 'explorer' | 'aos' }) {
	navigate = useNavigate();
	const location = useLocation();
	currentPath = location.pathname;
	currentRoute = location.pathname + location.search;
	togglePin = usePinnedTabsProvider().toggle;
	return <ExplorerTabs type={props.type ?? 'explorer'} />;
}
beforeEach(() => {
	resolveNode = undefined;
	resolveTransaction = undefined;
	pinTarget = undefined;
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
	localStorage.setItem('settings', JSON.stringify({ inAppTabs: { explorer: true, aos: true, graphql: true } }));
	localStorage.removeItem('aos-transactions');
	Element.prototype.scrollTo = vi.fn();
	localStorage.removeItem('explorer-transactions');
	localStorage.removeItem(PINNED_TABS_KEY);
	container = document.createElement('main');
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});
async function render(path: string, shouldResolve = true) {
	await React.act(async () =>
		root.render(
			<MemoryRouter initialEntries={[path]}>
				<ThemeProvider theme={theme(darkTheme)}>
					<SettingsProvider>
						<PinnedTabsProvider>
							<Routes>
								<Route path={'/aos/*'} element={<Harness type="aos" />} />
								<Route path={'/explorer/'} element={<Harness />} />
								<Route path={'/explorer/:txid/*'} element={<Harness />} />
							</Routes>
						</PinnedTabsProvider>
					</SettingsProvider>
					<div id={DOM.overlay} />
				</ThemeProvider>
			</MemoryRouter>
		)
	);
	if (shouldResolve) await React.act(async () => resolveNode?.());
}
const tabs = () => JSON.parse(localStorage.getItem('explorer-transactions'));
const pins = () => parsePinnedTabs(localStorage.getItem(PINNED_TABS_KEY));

async function renameTab(label: string) {
	await React.act(async () => {
		container
			.querySelector('[data-tab-index="0"] span[title]')
			.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
	});
	const input = container.querySelector<HTMLInputElement>('[data-tab-index="0"] input');
	await React.act(async () => {
		Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, label);
		input.dispatchEvent(new Event('input', { bubbles: true }));
	});
	await React.act(async () => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
}

async function openPins() {
	await React.act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Tab actions"]').click());
	const button = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Pinned');
	await React.act(async () => button.click());
	return container.querySelector('[role="dialog"]');
}

it.each(['before', 'after'])('uses the custom primary name when renamed %s pinning', async (timing) => {
	await render(getArweaveNodeRoute(NODE_URL, 'miners'));
	if (timing === 'before') await renameTab('Test');
	await React.act(async () => togglePin(pinTarget));
	const originalPin = pins()[0];
	if (timing === 'after') {
		await React.act(async () => navigate(getArweaveNodeRoute(NODE_URL, 'mempool')));
		await renameTab('Test');
	}
	expect(pins()).toEqual([{ ...originalPin, label: 'Test', labelEdited: true }]);
	const panel = await openPins();
	const entry = panel.querySelector(`button[title="${NODE_URL}"]`);
	expect(entry.querySelector('span').textContent).toBe('Test');
	expect(entry.querySelector('small').textContent).toBe(NODE_URL);

	await React.act(async () => root.unmount());
	localStorage.removeItem('explorer-transactions');
	root = createRoot(container);
	await render('/explorer/');
	const restoredPanel = await openPins();
	await React.act(async () => restoredPanel.querySelector<HTMLButtonElement>(`button[title="${NODE_URL}"]`).click());
	expect(currentPath).toBe(originalPin.route);
	expect(container.querySelector('[data-tab-index="0"] span[title]').textContent).toBe('Test');
	expect(tabs()).toMatchObject([{ label: 'Test', labelEdited: true }]);
	expect(pins()).toEqual([{ ...originalPin, label: 'Test', labelEdited: true }]);
});

it('updates a pin when its transaction name resolves and keeps later custom names through refreshes', async () => {
	const id = 'a'.repeat(43);
	await render('/explorer/' + id);
	await React.act(async () => togglePin(pinTarget));
	await React.act(async () =>
		resolveTransaction({ node: { id, tags: [{ name: 'Name', value: 'Named transaction' }] } } as GQLNodeResponseType)
	);
	expect(pins()[0].label).toBe('Named transaction');
	await renameTab('My transaction');
	await React.act(async () =>
		resolveTransaction({ node: { id, tags: [{ name: 'Name', value: 'Updated transaction' }] } } as GQLNodeResponseType)
	);
	expect(pins()[0]).toMatchObject({ label: 'My transaction', labelEdited: true });
});

it('repairs an existing URL-only pin from an already renamed saved tab', async () => {
	const route = getArweaveNodeRoute(NODE_URL, 'miners');
	localStorage.setItem(
		PINNED_TABS_KEY,
		JSON.stringify({ version: 1, tabs: [{ id: NODE_URL, label: NODE_URL, type: 'arweave-node', route, pinnedAt: 1 }] })
	);
	localStorage.setItem(
		'explorer-transactions',
		JSON.stringify([{ id: NODE_URL, label: 'Test', labelEdited: true, type: 'arweave-node', tabKey: 'node-1' }])
	);
	await render(route);
	expect(pins()).toMatchObject([{ id: NODE_URL, label: 'Test', labelEdited: true, route, pinnedAt: 1 }]);
	await React.act(async () => togglePin(pinTarget));
	await renameTab('No longer pinned');
	expect(pins()).toEqual([]);
});

it('shows compact tab actions and opens saved pins without a connected wallet', async () => {
	const id = 'b'.repeat(43);
	localStorage.setItem(
		PINNED_TABS_KEY,
		JSON.stringify({
			version: 1,
			tabs: [{ id, label: 'Saved address', type: 'wallet', route: `/explorer/${id}`, pinnedAt: 1 }],
		})
	);
	await render('/explorer/' + 'a'.repeat(43));
	const menuButton = container.querySelector<HTMLButtonElement>('[aria-label="Tab actions"]');
	expect(container.querySelector('[role="menu"]')).toBeNull();
	expect(container.querySelector('[title="Create a new tab"]')?.textContent).toBe('New');
	await React.act(async () => {
		menuButton.focus();
		menuButton.click();
	});
	const items = [...container.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
	expect(items.map((item) => item.textContent)).toEqual(['Disable in-app tabs', 'Pinned', 'New', 'Clear']);
	await React.act(async () => items[1].click());
	const panel = container.querySelector('[role="dialog"]');
	expect(panel.textContent).toContain('Saved address');
	const pin = [...panel.querySelectorAll('button')].find((button) => button.textContent.includes('Saved address'));
	await React.act(async () => pin.click());
	expect(currentPath).toBe(`/explorer/${id}`);
	expect(container.querySelector('[role="dialog"]')).toBeNull();
	expect(document.activeElement).toBe(menuButton);
	expect(tabs()).toHaveLength(2);
});

it('resolves encoded node deep links without a type segment and preserves the selected subtab', async () => {
	await render(getArweaveNodeRoute(NODE_URL, 'miners'), false);
	expect(tabs()).toMatchObject([{ id: NODE_URL, type: null }]);
	expect(currentPath).toBe(`/explorer/${encodeURIComponent(NODE_URL)}/miners`);
	await React.act(async () => resolveNode());
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

it('canonicalizes older typed deep links and stored routes without duplicating tabs', async () => {
	const oldRoute = `/explorer/arweave-node/${encodeURIComponent(NODE_URL)}/miners`;
	localStorage.setItem(
		'explorer-transactions',
		JSON.stringify([{ id: NODE_URL, label: NODE_URL, type: 'arweave-node', tabKey: 'node-1', lastRoute: oldRoute }])
	);
	await render('/explorer/');
	expect(currentPath).toBe(getArweaveNodeRoute(NODE_URL, 'miners'));
	await React.act(async () => navigate(oldRoute + '?test=1'));
	expect(currentPath).toBe(getArweaveNodeRoute(NODE_URL, 'miners'));
	expect(tabs()).toMatchObject([{ id: NODE_URL, lastRoute: getArweaveNodeRoute(NODE_URL, 'miners') + '?test=1' }]);
	expect(tabs()).toHaveLength(1);
});

it('continues to open existing transaction routes', async () => {
	const id = 'a'.repeat(43);
	await render('/explorer/' + id);
	expect(tabs()).toMatchObject([{ id, type: 'transaction' }]);
	expect(container.querySelector('[data-transaction]')?.getAttribute('data-transaction')).toBe(id);
});

it.each([
	getArweaveNodeRoute(NODE_URL, 'miners'),
	getArweaveNodeRoute(NODE_URL, 'mempool'),
	`/explorer/${'a'.repeat(43)}/messages?cursor=saved`,
])('keeps the saved subtab when returning from an ExplorerLink opened from %s', async (route) => {
	await render(route);
	const sourceKey = tabs()[0].tabKey;
	const sourcePane = container.querySelector(`[data-tab-key="${sourceKey}"]`);
	await React.act(async () => sourcePane.querySelector<HTMLAnchorElement>(`a[href="#/explorer/${linkedId}"]`).click());
	expect(tabs()).toHaveLength(2);
	expect(currentRoute).toBe(`/explorer/${linkedId}`);
	expect(tabs()[0].lastRoute).toBe(route);
	await React.act(async () => container.querySelector<HTMLElement>('[data-tab-index="0"]').click());
	expect(currentRoute).toBe(route);
	await React.act(async () => container.querySelector<HTMLElement>('[data-tab-index="1"]').click());
	await React.act(async () => navigate(-1));
	expect(currentRoute).toBe(route);
	await React.act(async () => container.querySelector<HTMLElement>('[data-tab-index="1"]').click());
	await React.act(async () =>
		container.querySelector<HTMLButtonElement>('[data-tab-index="1"] .delete-icon button').click()
	);
	expect(currentRoute).toBe(route);
	expect(tabs()).toMatchObject([{ tabKey: sourceKey, lastRoute: route }]);
});

it('preserves the active subtab when another tab is closed', async () => {
	const id = 'a'.repeat(43);
	await render(`/explorer/${id}`);
	const route = getArweaveNodeRoute(NODE_URL, 'transactions');
	await React.act(async () => navigate(route));
	await React.act(async () =>
		container.querySelector<HTMLButtonElement>('[data-tab-index="0"] .delete-icon button').click()
	);
	expect(currentRoute).toBe(route);
	expect(tabs()).toMatchObject([{ id: NODE_URL, lastRoute: route }]);
});

it('opens a node deep link even when saved tabs contain corrupt JSON', async () => {
	localStorage.setItem('explorer-transactions', '{invalid');
	await render(getArweaveNodeRoute(NODE_URL));
	expect(tabs()).toMatchObject([{ id: NODE_URL, type: 'arweave-node' }]);
});

async function selectMenuAction(label: string) {
	await React.act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Tab actions"]').click());
	const item = [...container.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')].find(
		(item) => item.textContent === label
	);
	await React.act(async () => item.click());
}

it.each(['explorer', 'aos'] as const)(
	'defaults %s to a single page, navigates in the current browser tab, and disables other actions',
	async (type) => {
		localStorage.removeItem('settings');
		const id = 'a'.repeat(43);
		const savedTabs = JSON.stringify([{ id: 'b'.repeat(43), label: 'Saved', type: 'transaction', tabKey: 'saved' }]);
		localStorage.setItem(`${type}-transactions`, savedTabs);
		const open = vi.spyOn(window, 'open').mockReturnValue(null);
		await render(`/${type}/${id}`);
		expect(currentPath).toBe(`/${type}/${id}`);
		expect(container.querySelector('[data-tab-index]')).toBeNull();
		expect(container.textContent).not.toContain(id);
		expect(container.textContent).not.toContain('Saved');
		const link = container.querySelector<HTMLAnchorElement>(`a[href="#/explorer/${linkedId}"]`);
		expect(link.target).toBe('');
		await React.act(async () => link.click());
		expect(open).not.toHaveBeenCalled();
		expect(currentPath).toBe(`/explorer/${linkedId}`);
		expect(container.querySelectorAll('[data-tab-key]')).toHaveLength(1);
		await React.act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Tab actions"]').click());
		const actions = [...container.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
		expect(actions.map((action) => [action.textContent, action.disabled])).toEqual([
			['Enable in-app tabs', false],
			['Pinned', true],
			['New', true],
			['Clear', true],
		]);
		await React.act(async () => actions[3].click());
		expect(container.querySelector('[role="dialog"]')).toBeNull();
		expect(localStorage.getItem(`${type}-transactions`)).toBe(savedTabs);
		await React.act(async () => navigate(-1));
		expect(currentPath).toBe(`/${type}/${id}`);
		open.mockRestore();
	}
);

it.each(['explorer', 'aos'] as const)(
	'keeps the current %s resource and saved tabs when toggling modes',
	async (type) => {
		const id = 'a'.repeat(43);
		const otherId = 'b'.repeat(43);
		await render(`/${type}/${id}`);
		await React.act(async () => navigate(`/${type}/${otherId}`));
		expect(container.querySelectorAll('[data-tab-index]')).toHaveLength(2);
		await selectMenuAction('Disable in-app tabs');
		expect(container.querySelector('[data-tab-index]')).toBeNull();
		expect(container.querySelectorAll('[data-tab-key]')).toHaveLength(1);
		expect(currentPath).toBe(`/${type}/${otherId}`);
		await React.act(async () => navigate(`/${type}/${id}/messages?cursor=saved`));
		expect(currentRoute).toBe(`/${type}/${id}/messages?cursor=saved`);
		expect(container.querySelectorAll('[data-tab-key]')).toHaveLength(1);
		await selectMenuAction('Enable in-app tabs');
		expect(container.querySelectorAll('[data-tab-index]')).toHaveLength(2);
		expect(currentRoute).toBe(`/${type}/${id}/messages?cursor=saved`);
		expect(JSON.parse(localStorage.getItem(`${type}-transactions`))).toHaveLength(2);
	}
);

it('keeps an empty single-page explorer empty despite a saved workspace', async () => {
	localStorage.removeItem('settings');
	localStorage.setItem(
		'explorer-transactions',
		JSON.stringify([{ id: linkedId, label: linkedId, type: 'transaction', tabKey: 'saved' }])
	);
	await render('/explorer/');
	expect(currentPath).toBe('/explorer/');
	expect(container.querySelector('[data-transaction]')?.getAttribute('data-transaction')).toBe('');
});

it('opens message actions in the current browser tab after disabling in-app tabs', async () => {
	await render('/explorer/' + 'a'.repeat(43));
	await selectMenuAction('Disable in-app tabs');
	const open = vi.spyOn(window, 'open').mockReturnValue(null);
	await React.act(async () => openMessage(linkedId));
	expect(open).not.toHaveBeenCalled();
	expect(currentPath).toBe(`/explorer/${linkedId}`);
	expect(container.querySelectorAll('[data-tab-key]')).toHaveLength(1);
	open.mockRestore();
});

it('ignores late results from a replaced single page', async () => {
	localStorage.removeItem('settings');
	const id = 'a'.repeat(43);
	await render('/explorer/' + id);
	const resolvePrevious = resolveTransaction;
	await React.act(async () => navigate('/explorer/' + linkedId));
	await React.act(async () =>
		resolvePrevious({ node: { id, tags: [{ name: 'Name', value: 'Old page' }] } } as GQLNodeResponseType)
	);
	expect(currentPath).toBe('/explorer/' + linkedId);
	expect(container.querySelector('[data-transaction]')?.getAttribute('data-transaction')).toBe(linkedId);
});
