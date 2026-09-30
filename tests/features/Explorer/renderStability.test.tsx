// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import App from '../../../src/app/App';
import { PinnedTabsProvider } from '../../../src/providers/PinnedTabsProvider';
import { SettingsProvider, useSettingsProvider } from '../../../src/providers/SettingsProvider';

const mocks = vi.hoisted(() => ({ loadTable: vi.fn(), unmountTable: vi.fn(), commit: vi.fn() }));
vi.mock('react-redux', () => ({ useDispatch: () => dispatch }));
vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden="true" /> }));
vi.mock('store', () => ({ store: { getState: () => ({ transactions: {} }) } }));
vi.mock('store/transactions/reducer', () => ({ pruneTransactionCache: vi.fn() }));
vi.mock('helpers/serviceWorkerManager', () => ({
	serviceWorkerManager: { register: vi.fn(), checkArNSUpdate: vi.fn() },
}));
vi.mock('helpers/search', () => ({
	searchTxById: async (args: { txId: string }) => ({
		cursor: null,
		node: { id: args.txId, tags: [{ name: 'Type', value: 'Wallet' }], owner: {}, data: null, block: null },
	}),
}));
vi.mock('api/balances', () => ({ readAoBalance: async () => '0', readArBalance: async () => '0' }));
vi.mock('api/http', () => ({ requestRemote: async () => new Response(null, { status: 404 }) }));
vi.mock('api/aoNetwork', () => {
	const status = { source: 'peers' };
	return { getAoReadTransport: () => ({ getStatus: () => status, subscribe: () => () => {} }) };
});
vi.mock('providers/PermawebProvider', () => ({ usePermawebProvider: () => permaweb }));
vi.mock('providers/ArweaveProvider', () => ({ useArweaveProvider: () => ({ walletAddress: null }) }));
vi.mock('providers/NotificationProvider', () => ({
	NotificationViewport: () => null,
	useNotifications: () => notifications,
}));
vi.mock('features/Mining', () => ({ useWalletMining: () => ({ isMiner: false }) }));
vi.mock('features/Profiles', () => ({ ProfileManagerOverlay: () => null }));
vi.mock('navigation/Navigation', () => ({ Navigation: () => null }));
vi.mock('navigation/Footer', () => ({ Footer: () => null }));
vi.mock('components/molecules/MessageList', () => ({
	MessageList: (props: { txId: string; onMessageOpen: (id: string) => void }) => {
		const [page, setPage] = React.useState(1);
		React.useEffect(() => {
			mocks.loadTable(props.txId);
			return () => mocks.unmountTable(props.txId);
		}, [props.txId]);
		return (
			<div data-table={props.txId}>
				<span data-page>{page}</span>
				<button onClick={() => setPage((value) => value + 1)}>Next page</button>
				<button onClick={() => props.onMessageOpen(linkedId)}>Open message</button>
			</div>
		);
	},
}));

const dispatch = vi.fn();
const permaweb = { legacyApi: {} };
const notifications = { addNotification: vi.fn(), removeNotification: vi.fn() };
const walletId = 'a'.repeat(43);
const linkedId = 'b'.repeat(43);
let settings: ReturnType<typeof useSettingsProvider>;
let container: HTMLElement;
let root: ReturnType<typeof createRoot>;
let frames: Map<number, FrameRequestCallback>;
let nextFrame = 0;

function Harness() {
	settings = useSettingsProvider();
	return <App />;
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: query === '(prefers-reduced-motion: reduce)',
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
	}));
	frames = new Map();
	vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
		frames.set(++nextFrame, callback);
		return nextFrame;
	});
	vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
	vi.stubGlobal('scrollTo', vi.fn());
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			disconnect() {}
		}
	);
	Element.prototype.scrollTo = vi.fn();
	localStorage.clear();
	localStorage.setItem('app-version', '0.0.2');
	vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2000);
	vi.stubGlobal('innerHeight', 800);
	vi.stubGlobal('scrollY', 0);
	container = document.createElement('main');
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

async function render(tabsEnabled: boolean) {
	localStorage.setItem('settings', JSON.stringify({ inAppTabs: { explorer: tabsEnabled }, showNodeStatus: false }));
	await React.act(async () => {
		// Preload the route inside act so the initial Suspense resolution is included in the render.
		await import('../../../src/views/Explorer');
		root.render(
			<MemoryRouter
				initialEntries={[`/explorer/${walletId}`]}
				future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
			>
				<SettingsProvider>
					<PinnedTabsProvider>
						<React.Profiler id="app" onRender={mocks.commit}>
							<Harness />
						</React.Profiler>
					</PinnedTabsProvider>
				</SettingsProvider>
			</MemoryRouter>
		);
	});
	expect(container.querySelector(`[data-table="${walletId}"]`)).not.toBeNull();
	await React.act(async () => container.querySelector<HTMLButtonElement>('[data-table] button').click());
	return { table: container.querySelector('[data-table]'), loads: mocks.loadTable.mock.calls.length };
}

async function scrollTo(top: number) {
	await React.act(async () => {
		vi.stubGlobal('scrollY', top);
		window.dispatchEvent(new Event('scroll'));
		const pending = [...frames.values()];
		frames.clear();
		pending.forEach((callback) => callback(0));
	});
}

it.each([false, true])(
	'keeps table state and avoids app commits at scroll boundaries (tabs: %s)',
	async (tabsEnabled) => {
		const { table, loads } = await render(tabsEnabled);
		mocks.commit.mockClear();
		for (const top of [1200, 1205, 600, 0, -5, 1200, 0]) {
			await scrollTo(top);
			expect(container.querySelector('[data-table]')).toBe(table);
			expect(table.querySelector('[data-page]').textContent).toBe('2');
			expect(mocks.loadTable).toHaveBeenCalledTimes(loads);
		}
		expect(mocks.commit).not.toHaveBeenCalled();
	}
);

it.each([false, true])('keeps table state when opening and closing panels (tabs: %s)', async (tabsEnabled) => {
	const { table, loads } = await render(tabsEnabled);
	mocks.unmountTable.mockClear();
	for (const open of [true, false]) {
		await React.act(async () => settings.setShowNodeSettings(open));
		expect(!!document.querySelector('[role="dialog"]')).toBe(open);
		expect(container.querySelector('[data-table]')).toBe(table);
		expect(table.querySelector('[data-page]').textContent).toBe('2');
		expect(mocks.loadTable).toHaveBeenCalledTimes(loads);
		await React.act(async () => settings.updateSettings('sidebarOpen', open));
		expect(container.querySelector('[data-table]')).toBe(table);
		expect(mocks.loadTable).toHaveBeenCalledTimes(loads);
	}
	expect(mocks.unmountTable).not.toHaveBeenCalled();
	await React.act(async () => table.querySelectorAll<HTMLButtonElement>('button')[1].click());
	expect(container.querySelector(`[data-table="${linkedId}"]`)).not.toBeNull();
	expect(container.querySelectorAll('[data-tab-key]')).toHaveLength(tabsEnabled ? 2 : 1);
});

it('keeps table state when opening and closing the pinned panel', async () => {
	const { table, loads } = await render(true);
	await React.act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Tab actions"]').click());
	const pinned = [...container.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')].find(
		(item) => item.textContent === 'Pinned'
	);
	await React.act(async () => pinned.click());
	expect(document.querySelector('[role="dialog"]')).not.toBeNull();
	expect(container.querySelector('[data-table]')).toBe(table);
	expect(table.querySelector('[data-page]').textContent).toBe('2');
	await React.act(async () => {
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
	});
	expect(document.querySelector('[role="dialog"]')).toBeNull();
	expect(container.querySelector('[data-table]')).toBe(table);
	expect(mocks.loadTable).toHaveBeenCalledTimes(loads);
});
