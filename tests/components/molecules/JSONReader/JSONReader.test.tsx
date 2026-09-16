// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { JSONReader } from '../../../../src/components/molecules/JSONReader';
import { darkTheme, theme } from '../../../../src/helpers/themes';

vi.mock('providers/LanguageProvider', () => ({
	useLanguageProvider: () => ({ current: 'en', object: { en: { collapseExpandAll: 'Toggle all' } } }),
}));
vi.mock('components/atoms/Button', () => ({
	Button: (props) => (
		<button onClick={props.onPress} disabled={props.disabled}>
			{props.label ?? props.tooltip}
		</button>
	),
}));

let container: HTMLElement;
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	container = document.createElement('div');
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

async function render(data: unknown, preserveViewState = true, footer?: React.ReactNode) {
	await React.act(async () =>
		root.render(
			<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
				<ThemeProvider theme={theme(darkTheme)}>
					<JSONReader data={data} preserveViewState={preserveViewState} footer={footer} />
				</ThemeProvider>
			</MemoryRouter>
		)
	);
}

it('preserves loaded rows, collapsed sections, and the scroll container during progressive updates', async () => {
	const data = {
		balances: Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`holder-${i}`, `balance-${i}`])),
		orders: { first: { status: 'pending-order' } },
	};
	await render(data);
	expect(container.textContent).not.toContain('balance-30');
	const loadMore = Array.from(container.querySelectorAll('button')).find((button) =>
		button.textContent.includes('Load 25')
	)!;
	await React.act(async () => loadMore.click());
	expect(container.textContent).toContain('balance-30');
	const toggle = Array.from(container.querySelectorAll('button')).find(
		(button) => button.textContent === 'Toggle all'
	)!;
	await React.act(async () => toggle.click());
	expect(container.textContent).not.toContain('pending-order');
	const scroll = container.querySelector('.scroll-wrapper')!;
	scroll.scrollTop = 120;
	await render({ ...data, results: { output: 'new linked value' } });
	expect(container.textContent).toContain('new linked value');
	expect(container.textContent).toContain('balance-30');
	expect(container.textContent).not.toContain('pending-order');
	expect(container.querySelector('.scroll-wrapper')).toBe(scroll);
	expect(scroll.scrollTop).toBe(120);
});

it('keeps continuation controls outside the scroll container as state grows', async () => {
	const onClick = vi.fn();
	const footer = <button onClick={onClick}>Load more data</button>;
	await render({ name: 'Deep process' }, true, footer);
	const button = Array.from(container.querySelectorAll('button')).find(
		(item) => item.textContent === 'Load more data'
	)!;
	expect(container.querySelector('.scroll-wrapper')?.contains(button)).toBe(false);
	await React.act(async () => button.click());
	expect(onClick).toHaveBeenCalledTimes(1);
	await render({ name: 'Deep process', next: { ready: true } }, true, footer);
	expect(container.contains(button)).toBe(true);
	await render({ name: 'Deep process', next: { ready: true } });
	expect(container.textContent).not.toContain('Load more data');
});

it('limits a newly arrived collection immediately and preserves exact integer strings', async () => {
	await render({ name: 'Token' });
	await render({
		name: 'Token',
		balances: Array.from({ length: 100 }, (_, i) => `holder-${i}`),
		supply: '900719925474099312345',
	});
	expect(container.textContent).toContain('holder-24');
	expect(container.textContent).not.toContain('holder-25');
	expect(container.textContent).toContain('900719925474099312345');
});

it('resets loaded rows for callers replacing independent documents', async () => {
	const data = Array.from({ length: 60 }, (_, i) => `item-${i}`);
	await render(data, false);
	const loadMore = Array.from(container.querySelectorAll('button')).find((button) =>
		button.textContent.includes('Load 25')
	)!;
	await React.act(async () => loadMore.click());
	expect(container.textContent).toContain('item-30');
	await render([...data], false);
	expect(container.textContent).not.toContain('item-30');
});
