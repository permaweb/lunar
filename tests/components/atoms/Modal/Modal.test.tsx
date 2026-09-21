// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { Modal } from '../../../../src/components/atoms/Modal';
import { transitionExitMs } from '../../../../src/helpers/animations';
import { darkTheme, theme } from '../../../../src/helpers/themes';

vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden="true" /> }));

let container: HTMLElement;
let overlay: HTMLElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	overlay = document.createElement('div');
	overlay.id = 'overlay';
	container = document.createElement('main');
	document.body.append(container, overlay);
	root = createRoot(container);
});

afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	overlay.remove();
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

async function render(children: React.ReactNode, options: { type?: 'modal' | 'panel'; onClose?: () => void } = {}) {
	await React.act(async () =>
		root.render(
			<ThemeProvider theme={theme(darkTheme)}>
				<Modal type={options.type} header="Settings" onClose={options.onClose ?? vi.fn()}>
					{children}
				</Modal>
			</ThemeProvider>
		)
	);
}

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
const closeButton = () => document.querySelector<HTMLElement>('[role="dialog"] [aria-label="Close"]');

it('focuses the first text field on open', async () => {
	await render(<input aria-label="Endpoint" />);

	expect(document.activeElement).toBe(document.querySelector('input[aria-label="Endpoint"]'));
});

it('focuses the dialog instead of the close button when there is no text field', async () => {
	await render(<button type="button">Confirm</button>);

	expect(document.activeElement).toBe(dialog());
	expect(document.activeElement).not.toBe(closeButton());
});

it('keeps Shift+Tab from the focused dialog inside the dialog', async () => {
	await render(<button type="button">Confirm</button>);

	await React.act(async () => {
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
	});

	expect(document.activeElement?.textContent).toBe('Confirm');
});

it('closes a regular modal immediately', async () => {
	const onClose = vi.fn();
	await render(<p>Body</p>, { onClose });

	await React.act(async () => closeButton().click());

	expect(onClose).toHaveBeenCalledOnce();
});

it('lets a panel slide out before reporting the close, once', async () => {
	vi.useFakeTimers();
	const onClose = vi.fn();
	await render(<p>Body</p>, { type: 'panel', onClose });

	await React.act(async () => closeButton().click());
	await React.act(async () => {
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
	});
	expect(onClose).not.toHaveBeenCalled();

	await React.act(async () => {
		vi.advanceTimersByTime(transitionExitMs);
	});
	expect(onClose).toHaveBeenCalledOnce();
});

it('closes a panel immediately when reduced motion is preferred', async () => {
	vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('prefers-reduced-motion') }));
	const onClose = vi.fn();
	await render(<p>Body</p>, { type: 'panel', onClose });

	await React.act(async () => closeButton().click());

	expect(onClose).toHaveBeenCalledOnce();
});
