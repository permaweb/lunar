// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { JSONReader } from '../../../../src/components/molecules/JSONReader';
import { darkTheme, theme } from '../../../../src/helpers/themes';

vi.mock('providers/LanguageProvider', () => ({
	useLanguageProvider: () => ({
		current: 'en',
		object: {
			en: {
				collapseExpandAll: 'Toggle all',
				enterFullScreen: 'Enter Full Screen',
				exitFullScreen: 'Exit Full Screen',
				copyJSON: 'Copy JSON',
				expandLinkedValue: 'Expand linked value',
				loadingLinkedState: 'Loading linked values…',
				aoReadUnavailable: 'Linked value is unavailable',
				linkedStateCycle: 'This link points to a value already open in this branch.',
				linkedStateDepth: 'The linked value nesting limit has been reached.',
				retry: 'Retry',
			},
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
	options?: {
		hideHeader?: boolean;
		noFullScreen?: boolean;
		noWrapper?: boolean;
		onLoadLink?: (id: string, signal: AbortSignal) => Promise<unknown>;
	}
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

async function toggleLink(details: HTMLDetailsElement, isOpen: boolean) {
	await React.act(async () => {
		details.open = isOpen;
		details.dispatchEvent(new Event('toggle'));
	});
}

it('fetches linked values only when expanded, leaves nested links lazy, and reuses loaded values', async () => {
	const parent = 'p'.repeat(43);
	const child = 'c'.repeat(43);
	const onLoadLink = vi.fn(async (id) =>
		id === parent ? { 'nested+link': child } : { quantity: '900719925474099312345' }
	);
	await render({ 'balances+link': parent }, true, undefined, { onLoadLink });
	expect(onLoadLink).not.toHaveBeenCalled();
	const details = container.querySelector('details');
	await toggleLink(details, true);
	expect(onLoadLink).toHaveBeenCalledExactlyOnceWith(parent, expect.any(AbortSignal));
	expect(container.textContent).toContain('nested+link');
	const nested = details.querySelector('details');
	await toggleLink(nested, true);
	expect(onLoadLink).toHaveBeenCalledTimes(2);
	expect(onLoadLink.mock.calls[1][0]).toBe(child);
	expect(container.textContent).toContain('900719925474099312345');
	await toggleLink(nested, false);
	await toggleLink(nested, true);
	expect(onLoadLink).toHaveBeenCalledTimes(2);
	expect((await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })).violations).toEqual([]);
});

it('cancels collapsed linked reads, ignores their late results, and retries failed reads on demand', async () => {
	const id = 'p'.repeat(43);
	let resolve: (value: unknown) => void;
	const onLoadLink = vi
		.fn()
		.mockImplementationOnce(
			() =>
				new Promise((finish) => {
					resolve = finish;
				})
		)
		.mockRejectedValueOnce(new Error('offline'))
		.mockResolvedValueOnce({ name: 'Recovered value' });
	await render({ 'value+link': id }, true, undefined, { onLoadLink });
	const details = container.querySelector('details');
	await toggleLink(details, true);
	const signal = onLoadLink.mock.calls[0][1];
	await toggleLink(details, false);
	expect(signal.aborted).toBe(true);
	await React.act(async () => resolve({ name: 'Stale value' }));
	expect(container.textContent).not.toContain('Stale value');
	await toggleLink(details, true);
	expect(container.querySelector('[role="alert"]')?.textContent).toContain('Linked value is unavailable');
	const retry = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Retry');
	await React.act(async () => retry.click());
	expect(container.textContent).toContain('Recovered value');
	expect(onLoadLink).toHaveBeenCalledTimes(3);
});

it('blocks linked cycles and keeps ordinary IDs as regular values', async () => {
	const id = 'p'.repeat(43);
	const onLoadLink = vi.fn(async () => ({ 'cycle+link': id }));
	await render({ id, 'value+link': id }, true, undefined, { onLoadLink });
	expect(container.querySelectorAll('details')).toHaveLength(1);
	const details = container.querySelector('details');
	await toggleLink(details, true);
	await toggleLink(details.querySelector('details'), true);
	expect(onLoadLink).toHaveBeenCalledTimes(1);
	expect(container.textContent).toContain('already open in this branch');
});

it('limits the initial rows of a lazily loaded collection', async () => {
	const onLoadLink = vi.fn(async () => Array.from({ length: 100 }, (_, i) => `lazy-item-${i}`));
	await render({ 'values+link': 'p'.repeat(43) }, true, undefined, { onLoadLink });
	await toggleLink(container.querySelector('details'), true);
	expect(container.textContent).toContain('lazy-item-24');
	expect(container.textContent).not.toContain('lazy-item-25');
	const more = Array.from(container.querySelectorAll('button')).find((button) =>
		button.textContent.includes('Load 25')
	);
	await React.act(async () => more.click());
	expect(container.textContent).toContain('lazy-item-30');
	expect(onLoadLink).toHaveBeenCalledTimes(1);
});

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
