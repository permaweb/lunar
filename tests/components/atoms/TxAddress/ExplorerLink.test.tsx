// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { ExplorerLink } from '../../../../src/components/atoms/TxAddress';
import type { InAppTabsSettings, TabPageType } from '../../../../src/helpers/tabMode';
import { darkTheme, theme } from '../../../../src/helpers/themes';

vi.mock('providers/SettingsProvider', () => ({ useSettingsProvider: () => ({ settings: { inAppTabs: modes } }) }));
vi.mock('store', () => ({ store: { getState: () => ({}) } }));
vi.mock('store/transactions/reducer', () => ({ selectTransaction: () => null }));
vi.mock('react-svg', () => ({ ReactSVG: (props) => <svg onClick={props.onClick} aria-hidden="true" /> }));

const id = 'a'.repeat(43);
const writeText = vi.fn().mockResolvedValue(undefined);
const onPress = vi.fn();
const onRowClick = vi.fn();
const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
let modes: InAppTabsSettings;
let currentPath: string;
let container: HTMLElement;
let root: ReturnType<typeof createRoot>;

function Harness() {
	currentPath = useLocation().pathname;
	return (
		<div onClick={onRowClick}>
			<ExplorerLink value={id} onPress={onPress} />
		</div>
	);
}

beforeEach(() => {
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.clearAllMocks();
	modes = { explorer: false, aos: false, graphql: false };
	Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
	container = document.createElement('div');
	root = createRoot(container);
});

afterEach(async () => {
	await React.act(async () => root.unmount());
	if (clipboardDescriptor) Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
	else delete navigator.clipboard;
	vi.useRealTimers();
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

it.each(['explorer', 'aos', 'graphql'] as TabPageType[])(
	'preserves native modified link clicks from %s without copying or activating the row',
	async (page) => {
		const path = `/${page}/${id}`;
		await render(path);
		const link = container.querySelector('a');
		expect(link.getAttribute('href')).toBe(`#/explorer/${id}`);
		for (const modifiers of [{ metaKey: true }, { ctrlKey: true }]) {
			await React.act(async () => window.dispatchEvent(new KeyboardEvent('keydown', modifiers)));
			expect(link.querySelector('.info').textContent).toBe('Open in New Tab');
			for (const target of [link, link.querySelector('svg')]) {
				const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...modifiers });
				await React.act(async () => target.dispatchEvent(event));
				expect(event.defaultPrevented).toBe(false);
			}
		}
		expect(writeText).not.toHaveBeenCalled();
		expect(onPress).not.toHaveBeenCalled();
		expect(onRowClick).not.toHaveBeenCalled();
		expect(currentPath).toBe(path);
	}
);

it.each([{ metaKey: true }, { ctrlKey: true }])(
	'keeps copy shortcuts when in-app tabs are enabled: %j',
	async (modifiers) => {
		vi.useFakeTimers();
		modes.explorer = true;
		await render('/explorer/');
		await React.act(async () => window.dispatchEvent(new KeyboardEvent('keydown', modifiers)));
		expect(container.querySelector('.info').textContent).toBe('Copy');
		const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...modifiers });
		await React.act(async () => container.querySelector('a').dispatchEvent(event));
		expect(event.defaultPrevented).toBe(true);
		expect(writeText).toHaveBeenCalledWith(id);
		expect(onPress).not.toHaveBeenCalled();
		expect(currentPath).toBe('/explorer/');
		vi.clearAllTimers();
	}
);
