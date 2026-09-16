// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { ActionMenu } from '../../../../src/components/atoms/ActionMenu';
import { darkTheme, theme } from '../../../../src/helpers/themes';

vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden="true" /> }));

let container: HTMLElement;
let root: ReturnType<typeof createRoot>;
const onSelect = vi.fn();

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	container = document.createElement('main');
	document.body.append(container);
	root = createRoot(container);
});

async function render(label?: string) {
	await React.act(async () =>
		root.render(
			<ThemeProvider theme={theme(darkTheme)}>
				<ActionMenu
					ariaLabel="Tab actions"
					label={label}
					icon="ellipsis.svg"
					items={['Pinned', 'New', 'Clear'].map((label) => ({ id: label, label, onSelect }))}
				/>
			</ThemeProvider>
		)
	);
}

afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

const trigger = () => container.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]');
const items = () => Array.from(container.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
async function press(key: string) {
	await React.act(async () =>
		document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
	);
}

it.each([undefined, 'Actions'])('supports keyboard navigation and focus restoration with label %s', async (label) => {
	await render(label);
	expect(trigger().textContent).toBe(label ?? '');
	trigger().focus();
	await press('ArrowUp');
	expect(document.activeElement).toBe(items()[2]);
	await press('ArrowDown');
	expect(document.activeElement).toBe(items()[0]);
	await press('End');
	expect(document.activeElement).toBe(items()[2]);
	await press('Home');
	expect(document.activeElement).toBe(items()[0]);
	await press('Escape');
	expect(container.querySelector('[role="menu"]')).toBeNull();
	expect(document.activeElement).toBe(trigger());
	expect(trigger().getAttribute('aria-expanded')).toBe('false');
});

it.each([undefined, 'Actions'])('runs actions and passes accessibility checks with label %s', async (label) => {
	await render(label);
	await React.act(async () => trigger().click());
	expect(document.activeElement).toBe(items()[0]);
	expect((await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })).violations).toEqual([]);
	await React.act(async () => items()[1].click());
	expect(onSelect).toHaveBeenCalledTimes(1);
	expect(container.querySelector('[role="menu"]')).toBeNull();
	expect(document.activeElement).toBe(trigger());
});

it.each([undefined, 'Actions'])('closes on an outside pointer action with label %s', async (label) => {
	await render(label);
	await React.act(async () => trigger().click());
	await React.act(async () => document.body.dispatchEvent(new Event('pointerdown', { bubbles: true })));
	expect(container.querySelector('[role="menu"]')).toBeNull();
	expect(onSelect).not.toHaveBeenCalled();
});
