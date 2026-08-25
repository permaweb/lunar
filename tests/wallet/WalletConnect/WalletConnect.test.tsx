// @vitest-environment jsdom

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	handleOpenWallet: vi.fn(),
	isEmbeddedWallet: true,
	navigate: vi.fn(),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('react-svg', () => ({ ReactSVG: () => <span aria-hidden="true" /> }));
vi.mock('components/atoms/Avatar', () => ({
	Avatar: (props: { callback?: (() => void) | null }) => (
		<button type="button" aria-label="Wallet menu" onClick={() => props.callback?.()} />
	),
}));
vi.mock('helpers/balances', () => ({ readAoBalance: vi.fn().mockResolvedValue('0') }));
vi.mock('providers/ArweaveProvider', () => ({
	useArweaveProvider: () => ({
		wallet: {},
		walletAddress: 'A'.repeat(43),
		walletType: 'permaweb-os',
		isEmbeddedWallet: mocks.isEmbeddedWallet,
		handleDisconnect: vi.fn(),
		handleOpenWallet: mocks.handleOpenWallet,
		setWalletModalVisible: vi.fn(),
	}),
}));
vi.mock('providers/PermawebProvider', () => ({
	usePermawebProvider: () => ({
		profile: null,
		setShowProfileManager: vi.fn(),
	}),
}));
vi.mock('providers/SettingsProvider', () => ({
	useSettingsProvider: () => ({
		settings: {
			theme: 'dark-primary',
			syncWithSystem: false,
			preferredLightTheme: 'light-primary',
			preferredDarkTheme: 'dark-primary',
		},
		updateSettings: vi.fn(),
		setShowNodeSettings: vi.fn(),
	}),
}));
vi.mock('wrappers/CloseHandler', () => ({
	CloseHandler: (props: { children: React.ReactNode }) => <>{props.children}</>,
}));

import { darkTheme, theme } from '../../../src/helpers/themes';
import WalletConnect from '../../../src/wallet/WalletConnect/WalletConnect';

let root: Root | undefined;
let container: HTMLDivElement | undefined;
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
	vi.useFakeTimers();
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: vi.fn().mockResolvedValue('0') }));
	mocks.isEmbeddedWallet = true;
});

afterEach(() => {
	if (root) React.act(() => root?.unmount());
	container?.remove();
	root = undefined;
	container = undefined;
	vi.useRealTimers();
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});

async function renderWalletConnect() {
	container = document.createElement('div');
	document.body.append(container);
	root = createRoot(container);
	await React.act(async () => {
		root?.render(
			<ThemeProvider theme={theme(darkTheme)}>
				<WalletConnect />
			</ThemeProvider>
		);
		await vi.advanceTimersByTimeAsync(200);
	});
	await React.act(async () => {
		container?.querySelector<HTMLButtonElement>('button[aria-label="Wallet menu"]')?.click();
	});
}

describe('WalletConnect embedded wallet action', () => {
	it('opens the iframe wallet from the connected wallet dropdown', async () => {
		await renderWalletConnect();
		const openButton = [...(container?.querySelectorAll('button') ?? [])].find(
			(button) => button.textContent?.trim() === 'Open wallet'
		);

		expect(openButton).toBeDefined();
		await React.act(async () => openButton?.click());
		expect(mocks.handleOpenWallet).toHaveBeenCalledOnce();
		expect(container?.textContent).not.toContain('Open wallet');
	});

	it('does not offer the iframe action for an injected extension connection', async () => {
		mocks.isEmbeddedWallet = false;
		await renderWalletConnect();

		expect(container?.textContent).not.toContain('Open wallet');
	});
});
