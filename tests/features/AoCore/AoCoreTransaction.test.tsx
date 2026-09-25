// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { parseAoCoreMessage } from '../../../src/api/aoCore';
import { AoCoreTransaction } from '../../../src/features/AoCore';
import { DEFAULT_AO_NETWORK } from '../../../src/helpers/aoNetwork';
import { darkTheme, theme } from '../../../src/helpers/themes';

const mocks = vi.hoisted(() => ({ read: vi.fn(), props: null, network: null }));
vi.mock('api/aoCore', async (original) => ({ ...(await original()), readAoCoreMessage: mocks.read }));
vi.mock('providers/SettingsProvider', () => ({
	useSettingsProvider: () => ({ settings: { aoNetwork: mocks.network ?? DEFAULT_AO_NETWORK } }),
}));
vi.mock('components/organisms/Transaction', () => ({
	Transaction: (props) => {
		mocks.props = props;
		return (
			<div>
				Overview{props.inspector?.label}
				<div data-testid="tab-actions">{props.inspector?.actions}</div>
			</div>
		);
	},
}));
vi.mock('components/molecules/Editor', () => ({ Editor: () => null }));
vi.mock('components/molecules/JSONReader', () => ({ JSONReader: () => null }));
vi.mock('react-svg', () => ({ ReactSVG: () => null }));

let container: HTMLElement;
let overlay: HTMLElement;
let root: ReturnType<typeof createRoot>;
const id = 'a'.repeat(43);
const response = (raw: unknown, requestedId = id) => ({
	data: parseAoCoreMessage(JSON.stringify(raw), requestedId),
	provider: 'https://ao.example',
	source: 'peers',
});
beforeEach(() => {
	vi.clearAllMocks();
	mocks.network = null;
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('prefers-reduced-motion') }));
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
async function render(txId = id, path = `/explorer/${id}/info`, active = true) {
	await React.act(async () =>
		root.render(
			<MemoryRouter initialEntries={[path]}>
				<ThemeProvider theme={theme(darkTheme)}>
					<AoCoreTransaction
						txId={txId}
						type="transaction"
						active={active}
						onMessageOpen={vi.fn()}
						processMessagesView={() => null}
					/>
				</ThemeProvider>
			</MemoryRouter>
		)
	);
}

it('keeps ordinary transactions on Overview when only Type or an HTTP signature is present', async () => {
	mocks.read.mockResolvedValue(response({ Type: 'Message', signature: 'untrusted' }));
	await render();
	expect(container.textContent).toBe('Overview');
});

it('adds AO Core Info when the ID resolves without indexed transaction metadata', async () => {
	mocks.read.mockResolvedValue(response({ device: 'process@1.0' }));
	await render();
	expect(container.textContent).toBe('OverviewAO Core');
	expect(mocks.props.inspector.id).toBe(id);
	expect(mocks.read).toHaveBeenCalledTimes(1);
	expect(container.querySelector('[data-testid="tab-actions"]')?.textContent).toBe('');
});

it('allows explicit AO exploration of a validated ordinary map', async () => {
	mocks.read.mockResolvedValue(response({ body: 'plain data' }));
	await render(id, `/explorer/${id}/ao-core`);
	expect(container.textContent).toContain('AO Core');
});

it('opens message info from the tab actions and closes it when the tab becomes inactive', async () => {
	mocks.read.mockResolvedValue(response({ device: 'process@1.0' }));
	const path = `/explorer/${id}/ao-core`;
	await render(id, path);
	const button = container.querySelector<HTMLButtonElement>(
		'[data-testid="tab-actions"] button[aria-label="AO Core Message Info"]'
	);
	expect(button).not.toBeNull();
	expect(button.getAttribute('aria-expanded')).toBe('false');
	await React.act(async () => button.click());
	expect(button.getAttribute('aria-expanded')).toBe('true');
	expect(document.querySelector('[role="dialog"]')?.textContent).toContain('How this message is resolved');
	expect(mocks.read).toHaveBeenCalledTimes(1);
	await render(id, path, false);
	expect(document.querySelector('[role="dialog"]')).toBeNull();
	expect(container.querySelector('[data-testid="tab-actions"] button')).toBeNull();
	await render(id, path);
	expect(document.querySelector('[role="dialog"]')).toBeNull();
	expect(mocks.read).toHaveBeenCalledTimes(1);
});

it('resumes an interrupted read when the tab becomes active again', async () => {
	let finishFirst: (value: unknown) => void;
	mocks.read.mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finishFirst = resolve;
			})
	);
	await render();
	const signal = mocks.read.mock.calls[0][2].signal;
	await render(id, `/explorer/${id}/info`, false);
	expect(signal.aborted).toBe(true);
	mocks.read.mockResolvedValue(response({ device: 'process@1.0' }));
	await render();
	await React.act(async () => finishFirst(response({ device: 'stale@1.0' })));
	expect(mocks.read).toHaveBeenCalledTimes(2);
	expect(mocks.props.inspector.badges[0].label).toBe('process@1.0');
});

it('reloads a settled message on explicit refresh and a network change', async () => {
	mocks.read.mockResolvedValue(response({ device: 'message@1.0' }));
	await render();
	mocks.read.mockResolvedValue(response({ device: 'refreshed@1.0' }));
	await React.act(async () => mocks.props.inspector.onRefresh());
	expect(mocks.read).toHaveBeenCalledTimes(2);
	expect(mocks.props.inspector.badges[0].label).toBe('refreshed@1.0');
	mocks.network = { ...DEFAULT_AO_NETWORK, peers: ['https://new.example'] };
	mocks.read.mockResolvedValue(response({ device: 'other-network@1.0' }));
	await render();
	expect(mocks.read).toHaveBeenCalledTimes(3);
	expect(mocks.props.inspector.badges[0].label).toBe('other-network@1.0');
});

it('does not carry explicit exploration context to a different ID', async () => {
	mocks.read.mockResolvedValue(response({ body: 'plain data' }));
	await render(id, `/explorer/${id}/ao-core`);
	expect(mocks.props.inspector).toBeDefined();
	const nextId = 'b'.repeat(43);
	mocks.read.mockResolvedValue(response({ body: 'different data' }, nextId));
	await render(nextId);
	expect(mocks.props.inspector).toBeUndefined();
});

it('cancels stale reads and never attaches a previous message to a new ID', async () => {
	let finishFirst: (value: unknown) => void;
	mocks.read.mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finishFirst = resolve;
			})
	);
	await render();
	const signal = mocks.read.mock.calls[0][2].signal;
	const nextId = 'b'.repeat(43);
	mocks.read.mockResolvedValue(response({ body: 'plain data' }, nextId));
	await render(nextId);
	expect(signal.aborted).toBe(true);
	await React.act(async () => finishFirst(response({ device: 'process@1.0' })));
	expect(container.textContent).toBe('Overview');
});
