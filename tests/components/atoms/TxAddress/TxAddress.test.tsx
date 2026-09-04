// @vitest-environment jsdom

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ExplorerLink, TxAddress } from '../../../../src/components/atoms/TxAddress';
import { URLS } from '../../../../src/helpers/config';
import { darkTheme, theme } from '../../../../src/helpers/themes';

const { navigate, selectTransaction } = vi.hoisted(() => ({
	navigate: vi.fn(),
	selectTransaction: vi.fn(() => null),
}));

vi.mock('react-router-dom', () => ({
	useNavigate: () => navigate,
	useLocation: () => ({ pathname: '/' }),
}));
vi.mock('react-svg', () => ({ ReactSVG: () => null }));
vi.mock('providers/LanguageProvider', () => ({
	useLanguageProvider: () => ({
		object: { en: { copied: 'Copied', copy: 'Copy', inspect: 'Inspect' } },
		current: 'en',
	}),
}));
vi.mock('store', () => ({ store: { getState: () => ({}) } }));
vi.mock('store/transactions/reducer', () => ({ selectTransaction }));

const ETH_ADDRESS = '0x1234567890aBcDEF1234567890AbcDef1234aBcD';

describe('TxAddress shared list formatting', () => {
	let container: HTMLDivElement;
	let root: Root;

	beforeAll(() => {
		(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
	});

	beforeEach(() => {
		vi.useFakeTimers();
		navigate.mockReset();
		selectTransaction.mockReset();
		selectTransaction.mockReturnValue(null);
		container = document.createElement('div');
		document.body.appendChild(container);
		root = createRoot(container);
	});

	afterEach(() => {
		React.act(() => {
			vi.runOnlyPendingTimers();
			root.unmount();
		});
		container.remove();
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	function renderAddress(node: React.ReactNode) {
		React.act(() => root.render(<ThemeProvider theme={theme(darkTheme)}>{node}</ThemeProvider>));
	}

	it('shortens ETH owner/recipient labels used by transaction and message lists', () => {
		renderAddress(<TxAddress address={ETH_ADDRESS} nameMaxLength={20} />);
		expect(container.querySelector('p')?.textContent).toBe('0x1234...aBcD');
	});

	it('keeps the full address for navigation', () => {
		renderAddress(<TxAddress address={ETH_ADDRESS} />);
		React.act(() => container.querySelector('p')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
		expect(navigate).toHaveBeenCalledWith(`${URLS.explorer}${ETH_ADDRESS}`);
	});

	it('copies the full address, not the shortened label', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
		renderAddress(<TxAddress address={ETH_ADDRESS} />);
		await React.act(async () => {
			container.querySelector('p')?.dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
		});
		expect(writeText).toHaveBeenCalledWith(ETH_ADDRESS);
		expect(navigate).not.toHaveBeenCalled();
	});

	it('preserves explicit labels', () => {
		renderAddress(<ExplorerLink value={ETH_ADDRESS} label={'Wallet label'} />);
		expect(container.querySelector('p')?.textContent).toBe('Wallet label');
	});

	it('preserves cached names', () => {
		selectTransaction.mockReturnValue({ node: { tags: [{ name: 'Name', value: 'Named wallet' }] } });
		renderAddress(<TxAddress address={ETH_ADDRESS} />);
		expect(container.querySelector('p')?.textContent).toBe('Named wallet');
	});
});
