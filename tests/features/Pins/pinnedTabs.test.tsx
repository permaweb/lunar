// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { ExplorerControls } from '../../../src/components/molecules/ExplorerControls';
import { normalizePin, parsePinnedTabs, PINNED_TABS_KEY } from '../../../src/helpers/pinnedTabs';
import { darkTheme, theme } from '../../../src/helpers/themes';
import { PinnedTabsProvider } from '../../../src/providers/PinnedTabsProvider';
import { WalletConnect } from '../../../src/wallet/WalletConnect';

const id = 'a'.repeat(43);
const target = { id, label: 'Saved address', type: 'wallet' as const, route: `/explorer/${id}/transactions?limit=25` };
vi.mock('react-svg', () => ({
	ReactSVG: () => (
		<svg aria-hidden="true">
			<path />
		</svg>
	),
}));
vi.mock('api/balances', () => ({ readArBalance: vi.fn(async () => '0'), readAoBalance: vi.fn(async () => '0') }));
vi.mock('providers/ArweaveProvider', () => ({
	useArweaveProvider: () => ({ walletAddress: id, wallet: {}, disconnect: vi.fn() }),
}));
let container: HTMLElement;
let overlay: HTMLElement;
let root: ReturnType<typeof createRoot>;
let path = '';
function Harness() {
	path = useLocation().pathname + useLocation().search;
	return (
		<>
			<WalletConnect />
			<ExplorerControls
				pinTarget={target}
				value={id}
				onValueChange={() => {}}
				valid
				loading={false}
				onSubmit={() => {}}
				isFullscreen={false}
				onFullscreen={() => {}}
			/>
		</>
	);
}
async function render() {
	await React.act(async () =>
		root.render(
			<MemoryRouter>
				<ThemeProvider theme={theme(darkTheme)}>
					<PinnedTabsProvider>
						<Harness />
					</PinnedTabsProvider>
				</ThemeProvider>
			</MemoryRouter>
		)
	);
}
async function click(label: string) {
	const button = [...document.querySelectorAll('button')].find(
		(button) => button.getAttribute('aria-label') === label || button.textContent === label
	);
	expect(button).toBeDefined();
	await React.act(async () => {
		button.focus();
		button.click();
	});
}
beforeEach(() => {
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	localStorage.removeItem(PINNED_TABS_KEY);
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

it('pins from the first action, persists independently, and opens the saved route from the wallet panel', async () => {
	await render();
	const controls = container.querySelector('form');
	expect(controls.querySelector('button')?.getAttribute('aria-label')).toBe('Pin Tab');
	await click('Pin Tab');
	expect(container.querySelector('button[aria-label="Unpin Tab"]')?.getAttribute('aria-pressed')).toBe('true');
	expect(parsePinnedTabs(localStorage.getItem(PINNED_TABS_KEY))).toMatchObject([target]);
	await React.act(async () => root.unmount());
	root = createRoot(container);
	await render();
	expect(container.querySelector('button[aria-label="Unpin Tab"]')).not.toBeNull();
	await click('Profile menu');
	const menuText = container.textContent;
	expect(menuText.indexOf('Pinned')).toBeLessThan(menuText.indexOf('Wallet Address'));
	await click('Pinned');
	const dialog = overlay.querySelector('[role="dialog"]');
	expect(dialog?.textContent).toContain('Saved address');
	const results = await axe.run(overlay, { rules: { 'color-contrast': { enabled: false } } });
	expect(results.violations).toEqual([]);
	await React.act(async () => dialog.querySelector<HTMLButtonElement>(`button[title="${id}"]`).click());
	expect(path).toBe(target.route);
	expect(overlay.querySelector('[role="dialog"]')).toBeNull();
	await click('Unpin Tab');
	expect(parsePinnedTabs(localStorage.getItem(PINNED_TABS_KEY))).toEqual([]);
});

it('rejects corrupt pins and external routes while preserving valid individual entries', () => {
	const valid = { ...target, pinnedAt: 1 };
	expect(parsePinnedTabs('{bad')).toEqual([]);
	expect(
		parsePinnedTabs(
			JSON.stringify({ version: 1, tabs: [valid, { ...valid, route: 'https://example.com' }, valid, null] })
		)
	).toEqual([valid]);
	expect(normalizePin({ ...target, route: `/explorer/${'b'.repeat(43)}` })).toBeNull();
	const node = 'http://38.22.0.55:1984';
	expect(
		normalizePin({
			id: node,
			type: 'arweave-node',
			label: 'Node',
			route: `/explorer/arweave-node/${encodeURIComponent(node)}/miners`,
		})?.route
	).toBe(`/explorer/${encodeURIComponent(node)}/miners`);
});
