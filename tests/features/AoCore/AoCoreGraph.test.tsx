// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { type MessageValue, parseAoCoreMessage } from '../../../src/api/aoCore';
import { AoReadError } from '../../../src/api/aoNetwork';
import { AoCoreInfo } from '../../../src/features/AoCore/components/organisms/AoCoreInfo';
import { DEFAULT_AO_NETWORK } from '../../../src/helpers/aoNetwork';
import { darkTheme, theme } from '../../../src/helpers/themes';

const mocks = vi.hoisted(() => ({
	read: vi.fn(),
	network: null,
	flow: { fitView: vi.fn(), zoomIn: vi.fn(), zoomOut: vi.fn() },
}));
vi.mock('api/aoCore', async (original) => ({ ...(await original()), readAoCoreValue: mocks.read }));
vi.mock('providers/SettingsProvider', () => ({
	useSettingsProvider: () => ({ settings: { aoNetwork: mocks.network ?? DEFAULT_AO_NETWORK } }),
}));
vi.mock('react-svg', () => ({ ReactSVG: () => null }));
vi.mock('store', () => ({ store: { getState: () => ({ transactions: {} }) } }));
// Only the canvas is replaced in DOM tests. Real node cards, state, adapter calls,
// coverage evidence, and view switching are exercised; canvas layout is checked in a browser.
vi.mock('@xyflow/react', () => ({
	ReactFlowProvider: (props) => props.children,
	ReactFlow: (props) => (
		<div>
			{props.nodes.map((node) => {
				const Card = props.nodeTypes[node.type];
				return (
					<div key={node.id} data-node-id={node.id}>
						<Card id={node.id} data={node.data} />
					</div>
				);
			})}
			{props.edges.map((edge) => (
				<span key={edge.id} data-edge={edge.id}>
					{edge.label}
				</span>
			))}
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

let container: HTMLElement;
let root: ReturnType<typeof createRoot>;
const id = 'a'.repeat(43);
const link = 'b'.repeat(43);
const fixture = {
	device: 'message@1.0',
	'base-hashpath': 'base/path',
	'body+link': link,
	profile: { count: 42, enabled: false },
	commitments: {
		signed: { 'commitment-device': 'httpsig@1.0', signature: 'signature', committed: ['base-hashpath', 'body'] },
		unsigned: { 'commitment-device': 'httpsig@1.0', type: 'hmac-sha256', committed: ['base-hashpath'] },
		unknown: { 'commitment-device': 'httpsig@1.0' },
	},
};
let currentMessage: ReturnType<typeof parseAoCoreMessage>;

beforeEach(() => {
	vi.clearAllMocks();
	mocks.read.mockReset();
	mocks.network = null;
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.stubGlobal('matchMedia', () => ({ matches: true }));
	container = document.createElement('main');
	document.body.append(container);
	root = createRoot(container);
	currentMessage = parseAoCoreMessage(JSON.stringify(fixture), id);
});
afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});
async function render(value?: object, requestedId = id) {
	if (value) currentMessage = parseAoCoreMessage(JSON.stringify(value), requestedId);
	await React.act(async () =>
		root.render(
			<MemoryRouter>
				<ThemeProvider theme={theme(darkTheme)}>
					<AoCoreInfo
						state={{
							status: 'ready',
							result: { data: currentMessage, source: 'peers', provider: 'https://ao.example' },
						}}
						onRetry={vi.fn()}
					/>
				</ThemeProvider>
			</MemoryRouter>
		)
	);
}
async function mode(value: 'graph' | 'table') {
	await React.act(async () => (container.querySelector(`input[value="${value}"]`) as HTMLInputElement).click());
	await React.act(async () => {
		await vi.dynamicImportSettled();
	});
}
async function click(label: string, within: Element = container) {
	const button = [...within.querySelectorAll('button')].find(
		(entry) => entry.getAttribute('aria-label') === label || entry.textContent === label
	);
	expect(button, label).toBeDefined();
	await React.act(async () => button.click());
}
function result(value: MessageValue) {
	return { data: { value, rawText: '', headers: {} }, provider: 'https://child.example', source: 'peers' };
}

it('switches views without refetching the root and expands inline messages from the same decoded data', async () => {
	await render();
	expect(container.querySelector('[role=table]')).not.toBeNull();
	await mode('graph');
	expect(container.querySelector('[role=table]')).toBeNull();
	expect(container.textContent).toContain('base/path');
	expect(container.textContent).toContain('message@1.0');
	expect(mocks.read).not.toHaveBeenCalled();
	await click('Expand profile');
	expect(container.querySelectorAll('[data-node-id]')).toHaveLength(2);
	expect(container.querySelector('[data-edge]').textContent).toBe('profile');
	expect(container.textContent).toContain('42');
	expect(container.textContent).toContain('false');
	await click('Collapse profile');
	expect(container.querySelectorAll('[data-node-id]')).toHaveLength(1);
	await mode('table');
	expect(container.querySelector('[role=table][aria-label="Message Fields"]')).not.toBeNull();
	expect(mocks.read).not.toHaveBeenCalled();
});

it('shows exact coverage evidence and highlights only the selected message’s matching fields', async () => {
	await render();
	await mode('graph');
	await click('Expand profile');
	await click('Show coverage for base-hashpath');
	expect(container.textContent).toContain('committed · item 1: base-hashpath');
	expect(container.textContent).toContain('Unsigned commitment');
	expect(container.textContent).toContain('Unknown: committed list missing or malformed');
	await click('Highlight fields listed by signed');
	const highlighted = container.querySelectorAll('[data-covered]');
	expect(highlighted).toHaveLength(1);
	expect(highlighted[0].textContent).toContain('base-hashpath');
	expect(container.querySelector('[data-node-id="message-1"] [data-covered]')).toBeNull();
	expect(container.textContent).toContain('Not cryptographically verified');
	const accessibility = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
	expect(accessibility.violations).toEqual([]);
	await click('Highlight fields listed by signed');
	expect(container.querySelector('[data-covered]')).toBeNull();
});

it('loads links only when expanded and aborts closed branches without accepting late results', async () => {
	let resolveFirst: (value: unknown) => void;
	mocks.read.mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				resolveFirst = resolve;
			})
	);
	await render();
	await mode('graph');
	await click('Expand body+link');
	expect(mocks.read).toHaveBeenCalledTimes(1);
	expect(mocks.read.mock.calls[0][1]).toBe(link);
	expect(container.textContent).toContain('Loading linked value');
	const signal = mocks.read.mock.calls[0][2].signal;
	await click('Collapse body+link');
	expect(signal.aborted).toBe(true);
	mocks.read.mockResolvedValueOnce(result({ child: 'fresh', balance: 90071992547409931234n }));
	await click('Expand body+link');
	await React.act(async () => resolveFirst(result({ child: 'stale' })));
	expect(container.textContent).toContain('fresh');
	expect(container.textContent).toContain('90071992547409931234');
	expect(container.textContent).not.toContain('stale');
	expect(container.textContent).toContain('https://child.example');
});

it('retries failed links and prevents fetching ancestor cycles', async () => {
	mocks.read.mockRejectedValueOnce(new AoReadError('timeout')).mockResolvedValueOnce(result({ 'parent+link': id }));
	await render();
	await mode('graph');
	await click('Expand body+link');
	expect(container.querySelector('[role=alert]').textContent).toContain('timed out');
	await click('Retry AO read');
	await click('Expand parent+link');
	expect(container.textContent).toContain('This ID is already open in this branch');
	expect(mocks.read).toHaveBeenCalledTimes(2);
	await click('Collapse body+link');
	expect(container.querySelectorAll('[data-node-id]')).toHaveLength(1);
});

it('cancels pending reads and resets graph state when changing network, root ID, or view', async () => {
	mocks.read.mockImplementation(() => new Promise(() => {}));
	await render();
	await mode('graph');
	await click('Expand body+link');
	const first = mocks.read.mock.calls[0][2].signal;
	mocks.network = { ...DEFAULT_AO_NETWORK, peers: ['https://new.example'] };
	await render();
	expect(first.aborted).toBe(true);
	expect(container.querySelectorAll('[data-node-id]')).toHaveLength(1);
	await click('Expand body+link');
	const second = mocks.read.mock.calls[1][2].signal;
	await mode('table');
	expect(second.aborted).toBe(true);
	await mode('graph');
	await click('Expand body+link');
	const third = mocks.read.mock.calls[2][2].signal;
	await render({ device: 'message@1.0', newRoot: true }, 'c'.repeat(43));
	expect(third.aborted).toBe(true);
	expect(container.querySelector('[data-node-id]')).toBeNull();
	await mode('graph');
	expect(container.textContent).toContain('newRoot');
});

it('paginates large message cards and fits the graph after arranging', async () => {
	await render(Object.fromEntries(Array.from({ length: 101 }, (_, index) => [`field-${index}`, index])));
	await mode('graph');
	expect(container.textContent).toContain('field-49');
	expect(container.textContent).not.toContain('field-50');
	await click('Next');
	expect(container.textContent).toContain('field-50');
	expect(container.textContent).not.toContain('field-49');
	mocks.flow.fitView.mockClear();
	await click('Arrange');
	expect(mocks.flow.fitView).toHaveBeenCalled();
	mocks.flow.fitView.mockClear();
	await click('Fit view');
	expect(mocks.flow.fitView).toHaveBeenCalled();
	await click('Previous');
	expect(container.textContent).toContain('field-0');
});
