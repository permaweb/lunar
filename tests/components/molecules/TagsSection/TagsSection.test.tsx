// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { TagsSection } from '../../../../src/components/molecules/TagsSection';
import { darkTheme, theme } from '../../../../src/helpers/themes';

vi.mock('react-svg', () => ({ ReactSVG: () => null }));
vi.mock('store', () => ({ store: { getState: () => ({ transactions: {} }) } }));

let container: HTMLElement;
let root: ReturnType<typeof createRoot>;
const copy = vi.fn();

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	Object.defineProperty(navigator, 'clipboard', { value: { writeText: copy }, configurable: true });
	container = document.createElement('main');
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

async function render(props: React.ComponentProps<typeof TagsSection>) {
	await React.act(async () =>
		root.render(
			<MemoryRouter>
				<ThemeProvider theme={theme(darkTheme)}>
					<TagsSection {...props} />
				</ThemeProvider>
			</MemoryRouter>
		)
	);
}

it('keeps transaction tags sorted, counted, and linked to the explorer', async () => {
	const id = 'a'.repeat(43);
	await render({
		tags: [
			{ name: 'Target', value: id },
			{ name: 'Action', value: 'Transfer' },
		],
	});
	expect(container.querySelector('h3')?.textContent).toBe('Tags');
	expect(container.textContent).toContain('(2)');
	expect([...container.querySelectorAll('.scroll-wrapper > div > span')].map((el) => el.textContent)).toEqual([
		'Action',
		'Target',
	]);
	expect(container.querySelector(`a[href="#/explorer/${id}"]`)).not.toBeNull();
});

it('shows and copies the complete value from the same control with keyboard access', async () => {
	const value = 'Full message value '.repeat(30);
	await render({ title: 'Message Fields', tags: [{ name: 'body', value }], compact: true });
	const button = container.querySelector('button');
	await React.act(async () => button.focus());
	expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(value);
	await React.act(async () => button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
	expect(document.querySelector('[role="tooltip"]')).toBeNull();
	await React.act(async () => button.click());
	expect(copy).toHaveBeenCalledWith(value);
	expect(document.querySelector('[role="tooltip"]')?.textContent).toBe('Copied!');
});

it('preserves zero, false and empty text while distinguishing loading and empty lists', async () => {
	await render({
		tags: [
			{ name: 'zero', value: '0' },
			{ name: 'false', value: 'false' },
			{ name: 'empty', value: '' },
		],
	});
	expect([...container.querySelectorAll('button')].map((button) => button.textContent)).toEqual(['false', '0']);
	await render({ tags: [] });
	expect(container.textContent).toContain('None');
	await render({ tags: null });
	expect(container.textContent).toContain('(-)');
	expect(container.textContent).not.toContain('None');
});
