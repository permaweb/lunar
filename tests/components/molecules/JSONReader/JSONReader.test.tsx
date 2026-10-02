// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { JSONReader } from '../../../../src/components/molecules/JSONReader';
import { darkTheme, theme } from '../../../../src/helpers/themes';

vi.mock('providers/LanguageProvider', () => ({
	useLanguageProvider: () => ({
		current: 'en',
		object: {
			en: { collapseExpandAll: 'Toggle all', enterFullScreen: 'Enter Full Screen', exitFullScreen: 'Exit Full Screen' },
		},
	}),
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

async function render(
	data: unknown,
	preserveViewState = true,
	footer?: React.ReactNode,
	options?: { hideHeader?: boolean; noFullScreen?: boolean; noWrapper?: boolean }
) {
	await React.act(async () =>
		root.render(
			<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
				<ThemeProvider theme={theme(darkTheme)}>
					<JSONReader {...options} data={data} preserveViewState={preserveViewState} footer={footer} />
				</ThemeProvider>
			</MemoryRouter>
		)
	);
}

it('can enter and exit fullscreen without showing a separate reader header', async () => {
	await render({ note: 'Message input' }, true, undefined, { hideHeader: true, noWrapper: true });
	const reader = container.firstElementChild as HTMLDivElement;
	const button = reader.querySelector('button')!;
	const fullscreenDescriptor = Object.getOwnPropertyDescriptor(document, 'fullscreenElement');
	const exitDescriptor = Object.getOwnPropertyDescriptor(document, 'exitFullscreen');
	let fullscreenElement: Element | null = null;
	Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fullscreenElement });
	reader.requestFullscreen = vi.fn(async () => {
		fullscreenElement = reader;
		document.dispatchEvent(new Event('fullscreenchange'));
	});
	const exitFullscreen = vi.fn(async () => {
		fullscreenElement = null;
		document.dispatchEvent(new Event('fullscreenchange'));
	});
	Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exitFullscreen });

	try {
		expect(reader.querySelectorAll('button')).toHaveLength(1);
		expect(button.textContent).toBe('Enter Full Screen');
		expect(reader.classList.contains('border-wrapper-alt3')).toBe(false);
		await React.act(async () => button.click());
		expect(reader.requestFullscreen).toHaveBeenCalledTimes(1);
		expect(document.fullscreenElement).toBe(reader);
		expect(button.textContent).toBe('Exit Full Screen');
		expect(reader.textContent).toContain('Message input');
		await React.act(async () => button.click());
		expect(exitFullscreen).toHaveBeenCalledTimes(1);
		expect(document.fullscreenElement).toBeNull();
		expect(button.textContent).toBe('Enter Full Screen');
		await React.act(async () => button.click());
		await React.act(async () => exitFullscreen());
		expect(button.textContent).toBe('Enter Full Screen');
		expect(reader.classList.contains('border-wrapper-alt3')).toBe(false);
	} finally {
		if (fullscreenDescriptor) Object.defineProperty(document, 'fullscreenElement', fullscreenDescriptor);
		else Reflect.deleteProperty(document, 'fullscreenElement');
		if (exitDescriptor) Object.defineProperty(document, 'exitFullscreen', exitDescriptor);
		else Reflect.deleteProperty(document, 'exitFullscreen');
	}
});

it('keeps headerless readers without controls when fullscreen is disabled', async () => {
	await render({ note: 'Drawer input' }, true, undefined, { hideHeader: true, noFullScreen: true });
	expect(container.querySelector('button')).toBeNull();
	expect(container.textContent).toContain('Drawer input');
});

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
