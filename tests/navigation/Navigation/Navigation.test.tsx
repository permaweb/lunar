// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { arweaveNodeApi, ArweaveNodeError } from '../../../src/api/arweaveNode';
import { getBlock } from '../../../src/api/blocks';
import { getArweaveNodeRoute } from '../../../src/helpers/arweaveNode';
import { searchTxById } from '../../../src/helpers/search';
import { darkTheme, theme } from '../../../src/helpers/themes';
import { Navigation } from '../../../src/navigation/Navigation';
import { NODE_INFO, NODE_URL } from '../../fixtures/arweaveNode';

const mocks = vi.hoisted(() => ({ dispatch: vi.fn(), api: { getGQLData: vi.fn(), readProcess: vi.fn() } }));
vi.mock('react-redux', () => ({ useDispatch: () => mocks.dispatch }));
vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden={'true'} /> }));
vi.mock('wallet/WalletConnect', () => ({ WalletConnect: () => null }));
vi.mock('store', () => ({ store: {} }));
vi.mock('helpers/prices', () => ({ getArPrice: async () => null, getAoPrice: async () => null }));
vi.mock('helpers/search', () => ({ searchTxById: vi.fn() }));
vi.mock('providers/PermawebProvider', () => ({ usePermawebProvider: () => ({ legacyApi: mocks.api }) }));
vi.mock('api/blocks', () => ({ getBlock: vi.fn() }));
vi.mock('api/arweaveNode', async () => ({
	...(await vi.importActual('../../../src/api/arweaveNode/types')),
	arweaveNodeApi: { getInfo: vi.fn() },
}));
let container: HTMLElement;
let overlay: HTMLElement;
let root: ReturnType<typeof createRoot>;
let path: string;
function Harness() {
	path = useLocation().pathname;
	return <Navigation open={false} toggle={() => {}} />;
}
beforeEach(async () => {
	vi.clearAllMocks();
	vi.useFakeTimers();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.mocked(arweaveNodeApi.getInfo).mockResolvedValue(NODE_INFO);
	container = document.createElement('main');
	overlay = document.createElement('div');
	overlay.id = 'overlay';
	document.body.append(container, overlay);
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
	await React.act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="Search"]').click());
});
afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	overlay.remove();
	vi.useRealTimers();
	vi.unstubAllGlobals();
});
async function enter(value: string) {
	const input = overlay.querySelector('input');
	await React.act(async () => {
		Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
		input.dispatchEvent(new Event('input', { bubbles: true }));
	});
	await React.act(async () => vi.advanceTimersByTimeAsync(250));
}

async function pressKey(key: string, target: EventTarget = document, options: KeyboardEventInit = {}) {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options });
	await React.act(async () => {
		target.dispatchEvent(event);
	});
	return event;
}

it('opens the focused search overlay from the desktop field and restores focus on Escape', async () => {
	await pressKey('Escape');
	const trigger = container.querySelector<HTMLInputElement>('input[aria-label="Search"]');
	expect(trigger.placeholder).toBe('Search');
	expect(trigger.readOnly).toBe(true);
	expect(trigger.parentElement.textContent).toContain('/');
	trigger.focus();
	await React.act(async () => trigger.click());
	expect(overlay.querySelector('[role="dialog"]').getAttribute('aria-label')).toBe('Search');
	expect(document.activeElement).toBe(overlay.querySelector('input'));
	expect(document.body.style.overflowY).toBe('hidden');
	await pressKey('Escape');
	expect(overlay.querySelector('[role="dialog"]')).toBeNull();
	expect(document.activeElement).toBe(trigger);
	expect(document.body.style.overflowY).toBe('auto');
});

it('opens with slash without inserting it, supports typing slashes, and contains keyboard focus', async () => {
	await pressKey('Escape');
	const shortcut = await pressKey('/');
	expect(shortcut.defaultPrevented).toBe(true);
	const input = overlay.querySelector('input');
	expect(document.activeElement).toBe(input);
	expect(input.value).toBe('');
	expect((await pressKey('/', input)).defaultPrevented).toBe(false);
	await pressKey('Tab', input, { shiftKey: true });
	const close = overlay.querySelector<HTMLButtonElement>('button[aria-label="Close"]');
	expect(document.activeElement).toBe(close);
	await pressKey('Tab', close);
	expect(document.activeElement).toBe(input);
	await React.act(async () => close.click());
	expect(overlay.querySelector('[role="dialog"]')).toBeNull();
});

it.each(['Enter', ' ', '/'])('opens the desktop field with %s', async (key) => {
	await pressKey('Escape');
	const trigger = container.querySelector<HTMLInputElement>('input[aria-label="Search"]');
	trigger.focus();
	await pressKey(key, trigger);
	expect(document.activeElement).toBe(overlay.querySelector('input'));
});

it.each([
	'<input />',
	'<textarea></textarea>',
	'<select></select>',
	'<div contenteditable="true"><span></span></div>',
	'<div role="textbox"><span></span></div>',
])('does not capture slash while editing %s', async (markup) => {
	await pressKey('Escape');
	const editor = document.createElement('div');
	editor.innerHTML = markup;
	container.append(editor);
	const event = await pressKey('/', editor.querySelector('span') ?? editor.firstElementChild);
	expect(event.defaultPrevented).toBe(false);
	expect(overlay.querySelector('[role="dialog"]')).toBeNull();
});

it.each([{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }, { repeat: true }])(
	'does not capture modified, composed, or repeated slash: %j',
	async (options) => {
		await pressKey('Escape');
		expect((await pressKey('/', document, options)).defaultPrevented).toBe(false);
		expect(overlay.querySelector('[role="dialog"]')).toBeNull();
	}
);

it('leaves an existing modal and handled keyboard events alone', async () => {
	await pressKey('Escape');
	const dialog = document.createElement('div');
	dialog.setAttribute('role', 'dialog');
	dialog.setAttribute('aria-modal', 'true');
	container.append(dialog);
	expect((await pressKey('/')).defaultPrevented).toBe(false);
	expect(overlay.querySelector('[role="dialog"]')).toBeNull();
	dialog.remove();
	const event = new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true });
	event.preventDefault();
	await React.act(async () => document.dispatchEvent(event));
	expect(overlay.querySelector('[role="dialog"]')).toBeNull();
});

it('closes on backdrop clicks while keeping input clicks inside the overlay', async () => {
	await React.act(async () => overlay.querySelector('input').click());
	expect(overlay.querySelector('[role="dialog"]')).not.toBeNull();
	await React.act(async () => overlay.querySelector<HTMLElement>('[role="dialog"]').click());
	expect(overlay.querySelector('[role="dialog"]')).toBeNull();
});

it('has an accessible search dialog', async () => {
	vi.useRealTimers();
	const results = await axe.run(overlay, { rules: { 'color-contrast': { enabled: false } } });
	expect(results.violations).toEqual([]);
	await pressKey('Escape');
	const field = container.querySelector<HTMLInputElement>('input[aria-label="Search"]');
	const triggerResults = await axe.run(field, { rules: { 'color-contrast': { enabled: false } } });
	expect(triggerResults.violations).toEqual([]);
});

it.each([NODE_URL, 'https://arweave.net', 'https://node.example/', '8.8.8.8:1984'])(
	'opens an encoded node explorer route for %s after checking info',
	async (input) => {
		await enter(` ${input} `);
		const link = overlay.querySelector('a');
		expect(link?.getAttribute('href')).toBe(getArweaveNodeRoute(input));
		expect(arweaveNodeApi.getInfo).toHaveBeenCalledOnce();
		expect(getBlock).not.toHaveBeenCalled();
		expect(searchTxById).not.toHaveBeenCalled();
		await React.act(async () => link.click());
		expect(path).toBe(getArweaveNodeRoute(input));
		expect(overlay.querySelector('[role="dialog"]')).toBeNull();
	}
);
it('cancels outdated URL reads and ignores their late responses', async () => {
	let finish: (info: typeof NODE_INFO) => void;
	let firstSignal: AbortSignal;
	vi.mocked(arweaveNodeApi.getInfo).mockImplementationOnce((_node, signal) => {
		firstSignal = signal;
		return new Promise((resolve) => {
			finish = resolve;
		});
	});
	await enter(NODE_URL);
	expect(overlay.querySelector('input').disabled).toBe(false);
	await enter('https://another.node');
	expect(firstSignal.aborted).toBe(true);
	await React.act(async () => finish(NODE_INFO));
	expect(overlay.querySelector('a').getAttribute('href')).toBe(getArweaveNodeRoute('https://another.node'));
});
it('rejects unsafe URLs and shows a failed node lookup without creating a result', async () => {
	await enter('javascript:alert(1)');
	expect(arweaveNodeApi.getInfo).not.toHaveBeenCalled();
	vi.mocked(arweaveNodeApi.getInfo).mockRejectedValueOnce(new ArweaveNodeError('timeout'));
	await enter(NODE_URL);
	expect(overlay.textContent).toContain('This node did not respond in time');
	expect(overlay.querySelector('a')).toBeNull();
});
it('continues to support block heights and transaction IDs', async () => {
	vi.mocked(getBlock).mockResolvedValue({ height: 100 } as Awaited<ReturnType<typeof getBlock>>);
	await enter('100');
	expect(overlay.querySelector('a').getAttribute('href')).toBe('/explorer/100');
	const id = 'a'.repeat(43);
	vi.mocked(searchTxById).mockResolvedValue({ node: { id, tags: [] } } as Awaited<ReturnType<typeof searchTxById>>);
	await enter(id);
	expect(overlay.querySelector('a').getAttribute('href')).toBe(`/explorer/${id}`);
	expect(arweaveNodeApi.getInfo).not.toHaveBeenCalled();
});
