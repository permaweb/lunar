// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { Disclosure } from '../../../../src/components/atoms/Disclosure';
import { darkTheme, theme } from '../../../../src/helpers/themes';

let container: HTMLElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	container = document.createElement('main');
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

it('uses native disclosure semantics and retains content state when collapsed', async () => {
	await React.act(async () =>
		root.render(
			<ThemeProvider theme={theme(darkTheme)}>
				<Disclosure label="Read log">
					<input aria-label="Filter reads" defaultValue="Initial read" />
				</Disclosure>
			</ThemeProvider>
		)
	);
	const disclosure = container.querySelector('details');
	const summary = disclosure.querySelector('summary');
	const chevron = summary.querySelector('svg');
	const closedPath = chevron.querySelector('path').getAttribute('d');
	async function toggle() {
		await React.act(async () => {
			const toggled = new Promise<void>((resolve) =>
				disclosure.addEventListener('toggle', () => resolve(), { once: true })
			);
			summary.click();
			await toggled;
		});
	}
	expect(disclosure.open).toBe(false);
	expect(chevron.getAttribute('aria-hidden')).toBe('true');
	expect(getComputedStyle(chevron).transform).toBe('rotate(0deg)');
	await toggle();
	expect(disclosure.open).toBe(true);
	expect(chevron.querySelector('path').getAttribute('d')).toBe(closedPath);
	expect(getComputedStyle(chevron).transform).toBe('rotate(90deg)');
	const input = disclosure.querySelector('input');
	input.value = 'Updated filter';
	await toggle();
	expect(disclosure.open).toBe(false);
	expect(chevron.querySelector('path').getAttribute('d')).toBe(closedPath);
	expect(getComputedStyle(chevron).transform).toBe('rotate(0deg)');
	await toggle();
	expect(disclosure.querySelector('input').value).toBe('Updated filter');
	expect((await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })).violations).toEqual([]);
});
