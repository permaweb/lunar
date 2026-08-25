// @vitest-environment jsdom

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	attachFrame: vi.fn(),
	detachFrame: vi.fn(),
	hasExtension: false,
	presentationListeners: new Set<(state: { status: 'hidden' | 'open' | 'request'; method?: string }) => void>(),
}));

vi.mock('api/wallet', () => ({
	hasInjectedPermawebWallet: vi.fn(() => mocks.hasExtension),
	resolveWebWalletConnectionUrl: vi
		.fn()
		.mockReturnValue(
			new URL('https://wallet.example/?permawebos-web-wallet=1&client-origin=https%3A%2F%2Flunar.example')
		),
	webWalletClientProvider: {
		attachFrame: mocks.attachFrame,
		detachFrame: mocks.detachFrame,
		subscribeToPresentation: vi.fn((listener) => {
			mocks.presentationListeners.add(listener);
			return () => mocks.presentationListeners.delete(listener);
		}),
	},
}));

vi.mock('providers/LanguageProvider', () => ({
	useLanguageProvider: () => ({
		current: 'en',
		object: {
			en: {
				close: 'Close',
				completeWalletRequest: 'Complete the wallet request.',
				embeddedPermawebOsWallet: 'Embedded PermawebOS Wallet',
				unknownError: 'Unknown error',
			},
		},
	}),
}));

import { EmbeddedWallet } from '../../../../../../src/features/embeddedWallet';
import { darkTheme, theme } from '../../../../../../src/helpers/themes';

let root: Root | undefined;
let container: HTMLDivElement | undefined;
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
	if (root) React.act(() => root?.unmount());
	container?.remove();
	root = undefined;
	container = undefined;
	mocks.hasExtension = false;
	mocks.presentationListeners.clear();
	vi.clearAllMocks();
});

function emitPresentation(state: { status: 'hidden' | 'open' | 'request'; method?: string }) {
	for (const listener of [...mocks.presentationListeners]) listener(state);
}

describe('EmbeddedWallet', () => {
	it('does not mount the fallback when the extension is available', async () => {
		mocks.hasExtension = true;
		container = document.createElement('div');
		document.body.append(container);
		root = createRoot(container);

		await React.act(async () => {
			root?.render(
				<ThemeProvider theme={theme(darkTheme)}>
					<EmbeddedWallet />
				</ThemeProvider>
			);
		});

		expect(container.querySelector('iframe')).toBeNull();
		expect(mocks.attachFrame).not.toHaveBeenCalled();
	});

	it('uses the packaged movable window and reveals it only for wallet requests', async () => {
		container = document.createElement('div');
		document.body.append(container);
		root = createRoot(container);

		await React.act(async () => {
			root?.render(
				<ThemeProvider theme={theme(darkTheme)}>
					<EmbeddedWallet />
				</ThemeProvider>
			);
		});

		const frame = container.querySelector('iframe');
		const wrapper = container.querySelector<HTMLElement>('[data-web-wallet-window]');
		expect(frame?.title).toBe('Embedded PermawebOS Wallet');
		expect(frame?.tabIndex).toBe(-1);
		expect(frame?.getAttribute('referrerpolicy')).toBe('no-referrer');
		expect(frame?.getAttribute('sandbox')).toContain('allow-storage-access-by-user-activation');
		expect(mocks.attachFrame).toHaveBeenCalledWith(frame);
		expect(wrapper?.getAttribute('aria-hidden')).toBe('true');
		expect(wrapper?.dataset.position).toBe('top-right');
		expect(wrapper?.style.top).toBe('16px');
		expect(wrapper?.style.right).toBe('16px');
		expect(wrapper?.style.width).toContain('390px');
		expect(wrapper?.style.height).toContain('640px');

		await React.act(async () => {
			emitPresentation({ status: 'request', method: 'connect' });
		});
		expect(wrapper?.getAttribute('role')).toBe('dialog');
		expect(wrapper?.getAttribute('aria-hidden')).toBe('false');
		expect(frame?.tabIndex).toBe(0);
		expect(mocks.detachFrame).not.toHaveBeenCalled();

		const closeButton = container.querySelector<HTMLButtonElement>('button[aria-label="Close"]');
		await React.act(async () => closeButton?.click());
		expect(wrapper?.getAttribute('aria-hidden')).toBe('true');
		expect(frame?.isConnected).toBe(true);
		expect(mocks.detachFrame).not.toHaveBeenCalled();

		await React.act(async () => {
			emitPresentation({ status: 'request', method: 'connect' });
		});
		expect(wrapper?.getAttribute('aria-hidden')).toBe('false');
		expect(frame?.tabIndex).toBe(0);
		expect(mocks.detachFrame).not.toHaveBeenCalled();

		await React.act(async () => {
			emitPresentation({ status: 'hidden' });
		});
		expect(wrapper?.getAttribute('role')).toBeNull();
		expect(frame?.tabIndex).toBe(-1);

		await React.act(async () => {
			emitPresentation({ status: 'open' });
		});
		expect(wrapper?.getAttribute('aria-hidden')).toBe('false');
		expect(frame?.tabIndex).toBe(0);

		React.act(() => root?.unmount());
		root = undefined;
		expect(mocks.detachFrame).toHaveBeenCalledWith(frame);
	});
});
