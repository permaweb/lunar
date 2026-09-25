// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { parseAoCoreMessage } from '../../../src/api/aoCore';
import { ExplorerTabs } from '../../../src/features/Explorer';
import { DEFAULT_AO_NETWORK } from '../../../src/helpers/aoNetwork';
import { darkTheme, theme } from '../../../src/helpers/themes';
import { PinnedTabsProvider } from '../../../src/providers/PinnedTabsProvider';

const mocks = vi.hoisted(() => ({
	read: vi.fn(),
	readValue: vi.fn(),
	dispatch: vi.fn(),
	legacyApi: { getGQLData: vi.fn() },
	flow: { fitView: vi.fn(), zoomIn: vi.fn(), zoomOut: vi.fn() },
}));
vi.mock('api/aoCore', async (original) => ({
	...(await original()),
	readAoCoreMessage: mocks.read,
	readAoCoreValue: mocks.readValue,
}));
vi.mock('providers/SettingsProvider', () => ({
	useSettingsProvider: () => ({ settings: { aoNetwork: DEFAULT_AO_NETWORK } }),
}));
vi.mock('helpers/search', () => ({ searchTxById: vi.fn().mockResolvedValue(null) }));
vi.mock('react-redux', () => ({ useDispatch: () => mocks.dispatch }));
vi.mock('react-svg', () => ({ ReactSVG: () => null }));
vi.mock('store', () => ({ store: { getState: () => ({ transactions: {} }) } }));
vi.mock('providers/PermawebProvider', () => ({ usePermawebProvider: () => ({ legacyApi: mocks.legacyApi }) }));
vi.mock('providers/ArweaveProvider', () => ({ useArweaveProvider: () => ({ walletAddress: null }) }));
vi.mock('providers/NotificationProvider', () => ({ useNotifications: () => ({ addNotification: vi.fn() }) }));
vi.mock('features/Mining', () => ({ useWalletMining: () => ({ isMiner: false }) }));
vi.mock('api/http', () => ({
	requestRemote: vi.fn().mockImplementation(async () => new Response(null, { status: 404 })),
}));
vi.mock('api/blocks', async (original) => ({
	...(await original()),
	getCurrentBlockHeight: vi.fn().mockResolvedValue(null),
	getTransactionById: vi.fn().mockResolvedValue(null),
}));
vi.mock('components/molecules/Editor', () => ({ Editor: () => null }));
vi.mock('components/molecules/JSONReader', () => ({ JSONReader: () => null }));
// Exercise the real explorer tabs, inspector, graph state, and node cards without canvas measurement in jsdom.
vi.mock('@xyflow/react', () => ({
	ReactFlowProvider: (props) => props.children,
	ReactFlow: (props) => (
		<div>
			{props.nodes.map((node) => {
				const Card = props.nodeTypes[node.type];
				return <Card key={node.id} id={node.id} data={node.data} />;
			})}
		</div>
	),
	Handle: () => null,
	Background: () => null,
	Position: { Left: 'left', Right: 'right' },
	MarkerType: { ArrowClosed: 'arrowclosed' },
	useReactFlow: () => mocks.flow,
	useNodesInitialized: () => true,
	applyNodeChanges: (_changes, nodes) => nodes,
}));

const id = 'a'.repeat(43);
const linkedId = 'b'.repeat(43);
const path = `/explorer/${id}/ao-core`;
let container: HTMLElement;
let root: ReturnType<typeof createRoot>;
let navigate: ReturnType<typeof useNavigate>;

function Harness() {
	navigate = useNavigate();
	return <ExplorerTabs type="explorer" />;
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.stubGlobal('matchMedia', () => ({ matches: true }));
	Element.prototype.scrollTo = vi.fn();
	localStorage.clear();
	window.history.replaceState(null, '', `/#${path}`);
	container = document.createElement('main');
	document.body.append(container);
	root = createRoot(container);
	mocks.read.mockImplementation(async (_transport, requestedId) => ({
		data: parseAoCoreMessage(
			JSON.stringify(
				requestedId === id
					? {
							device: 'message@1.0',
							'body+link': linkedId,
							profile: { name: 'Alice' },
							commitments: { signed: { signature: 'signature', committed: ['profile'] } },
					  }
					: { device: 'message@1.0', child: true }
			),
			requestedId
		),
		provider: 'https://ao.example',
		source: 'peers',
	}));
	mocks.readValue.mockResolvedValue({
		data: { value: { nested: { count: 42 } }, rawText: '', headers: {} },
		provider: 'https://ao.example',
		source: 'peers',
	});
});

afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

async function render() {
	await React.act(async () =>
		root.render(
			<HashRouter>
				<ThemeProvider theme={theme(darkTheme)}>
					<PinnedTabsProvider>
						<Routes>
							<Route path="/explorer/:txid/*" element={<Harness />} />
						</Routes>
					</PinnedTabsProvider>
				</ThemeProvider>
			</HashRouter>
		)
	);
}

async function click(label: string, within: Element) {
	const button = [...within.querySelectorAll<HTMLButtonElement>('button')].find(
		(entry) => entry.getAttribute('aria-label') === label || entry.textContent === label
	);
	expect(button, label).toBeDefined();
	await React.act(async () => button.click());
}

it.each(['table', 'graph'] as const)(
	'preserves the %s inspector after following a link and returning by tab or history',
	async (mode) => {
		await render();
		const pane = container.querySelector('[data-tab-key]');
		const section = pane.querySelector('section[aria-label="Message Fields"]');
		if (mode === 'graph') {
			await React.act(async () => pane.querySelector<HTMLInputElement>('input[value="graph"]').click());
			await React.act(async () => {
				await vi.dynamicImportSettled();
			});
		}
		await click('Expand body+link', pane);
		await click('Expand nested', pane);
		await click('Show coverage for profile', pane);
		if (mode === 'graph') await click('Highlight fields listed by signed', pane);
		const fitCount = mocks.flow.fitView.mock.calls.length;
		for (const via of ['tab', 'history']) {
			const link = pane.querySelector<HTMLAnchorElement>(`a[href="#/explorer/${linkedId}"]`);
			expect(link).not.toBeNull();
			await React.act(async () => link.click());
			expect(window.location.hash).toContain(linkedId);
			expect(container.querySelectorAll('[data-tab-key]')).toHaveLength(2);
			if (via === 'tab') {
				await React.act(async () => container.querySelector<HTMLElement>('[data-tab-index="0"]').click());
			} else {
				await React.act(async () => {
					navigate(-1);
					await new Promise((resolve) => setTimeout(resolve, 20));
				});
			}
			expect(window.location.hash).toBe(`#${path}`);
			expect(pane.querySelector('section[aria-label="Message Fields"]')).toBe(section);
			expect(pane.querySelector<HTMLInputElement>(`input[value="${mode}"]`).checked).toBe(true);
			expect(pane.querySelector('[aria-label="Collapse body+link"]')).not.toBeNull();
			expect(pane.querySelector('[aria-label="Collapse nested"]')).not.toBeNull();
			expect(pane.textContent).toContain('42');
			expect(pane.textContent).toContain('committed · item 1: profile');
			if (mode === 'graph') {
				expect(pane.querySelector('[data-covered]')).not.toBeNull();
				expect(mocks.flow.fitView).toHaveBeenCalledTimes(fitCount);
			}
		}
		expect(mocks.read.mock.calls.filter((call) => call[1] === id)).toHaveLength(1);
		expect(mocks.readValue).toHaveBeenCalledTimes(1);
	}
);

it('keeps an explicitly explored message open even when it has no AO metadata', async () => {
	mocks.read.mockImplementation(async (_transport, requestedId) => ({
		data: parseAoCoreMessage(JSON.stringify({ profile: { address: linkedId } }), requestedId),
		provider: 'https://ao.example',
		source: 'peers',
	}));
	await render();
	const pane = container.querySelector('[data-tab-key]');
	await click('Expand profile', pane);
	const section = pane.querySelector('section[aria-label="Message Fields"]');
	await React.act(async () => pane.querySelector<HTMLAnchorElement>(`a[href="#/explorer/${linkedId}"]`).click());
	await React.act(async () => container.querySelector<HTMLElement>('[data-tab-index="0"]').click());
	expect(pane.querySelector('section[aria-label="Message Fields"]')).toBe(section);
	expect(pane.querySelector('[aria-label="Collapse profile"]')).not.toBeNull();
	expect(mocks.read.mock.calls.filter((call) => call[1] === id)).toHaveLength(1);
});
