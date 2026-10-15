// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { getLatestAddressSnapshot } from '../../../src/api/addresses';
import { getLatestHolderTransactions, getTokenHolders } from '../../../src/api/holders';
import { getAoPrice } from '../../../src/api/prices';
import { URLS } from '../../../src/helpers/config';
import { darkTheme, theme } from '../../../src/helpers/themes';
import { Wallets } from '../../../src/views/Wallets';
import { HOLDER_ADDRESSES, HOLDERS_SNAPSHOT } from '../../fixtures/holders';

vi.mock('api/holders', () => ({ getTokenHolders: vi.fn(), getLatestHolderTransactions: vi.fn() }));
vi.mock('api/addresses', () => ({ getLatestAddressSnapshot: vi.fn(), getAddressChunk: vi.fn() }));
vi.mock('api/prices', () => ({ getAoPrice: vi.fn(), getArPrice: vi.fn().mockResolvedValue(null) }));
vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden="true" /> }));
vi.mock('providers/SettingsProvider', () => ({
	useSettingsProvider: () => ({ settings: { inAppTabs: { explorer: true } } }),
}));
vi.mock('store', () => ({ store: { getState: () => ({}) } }));
vi.mock('store/transactions/reducer', () => ({ selectTransaction: () => null }));

let container: HTMLElement;
let root: ReturnType<typeof createRoot>;
let location: string;
let observers: Map<Element, IntersectionObserverCallback>;

function Harness() {
	const current = useLocation();
	location = current.pathname + current.search;
	return <Wallets />;
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	observers = new Map();
	vi.stubGlobal(
		'IntersectionObserver',
		class {
			private targets = new Set<Element>();
			constructor(private callback: IntersectionObserverCallback, options: IntersectionObserverInit) {
				expect(options.rootMargin).toBe('0px');
			}
			observe(target: Element) {
				this.targets.add(target);
				observers.set(target, this.callback);
			}
			disconnect() {
				for (const target of this.targets) observers.delete(target);
			}
		}
	);
	vi.mocked(getLatestAddressSnapshot).mockResolvedValue({
		blockHeight: 123,
		walletListRoot: 'r'.repeat(64),
		addresses: [{ address: 'r'.repeat(43), balance: '1000000000000', lastTransaction: null }],
		nextCursor: null,
	});
	vi.mocked(getTokenHolders).mockResolvedValue(HOLDERS_SNAPSHOT);
	vi.mocked(getLatestHolderTransactions).mockImplementation(async ({ addresses }) =>
		Object.fromEntries(addresses.map((address) => [address, { status: 'empty' }]))
	);
	vi.mocked(getAoPrice).mockResolvedValue(2);
	container = document.createElement('main');
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

async function render(path = URLS.wallets) {
	await React.act(async () =>
		root.render(
			<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
				<ThemeProvider theme={theme(darkTheme)}>
					<Harness />
				</ThemeProvider>
			</MemoryRouter>
		)
	);
}

async function selectNetwork(network: 'ao' | 'arweave') {
	await React.act(async () => container.querySelector<HTMLInputElement>(`input[value="${network}"]`).click());
}

async function clickButton(label: string, bottom = false) {
	const buttons = Array.from(container.querySelectorAll('button')).filter((element) => element.textContent === label);
	const button = bottom ? buttons[buttons.length - 1] : buttons[0];
	expect(button).toBeDefined();
	await React.act(async () => button.click());
}

async function showRows(...indexes: number[]) {
	const rows = container.querySelectorAll('[role="row"][tabindex="0"]');
	const visible = [...observers].filter(([target]) =>
		indexes.some((index) => target.closest('[role="row"]') === rows[index])
	);
	await React.act(async () => {
		for (const [target, callback] of visible)
			callback([{ target, isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
	});
}

it('defaults /wallets to the existing Arweave table and loads AO only when selected', async () => {
	await render();
	expect(URLS.wallets).toBe('/wallets/');
	expect(container.querySelector('h1').textContent).toBe('Wallets');
	expect(container.querySelector<HTMLInputElement>('input[value="arweave"]').checked).toBe(true);
	expect(container.querySelector('[role="table"]').getAttribute('aria-label')).toBe('Addresses');
	expect(container.textContent).toContain('Block 123');
	expect(container.textContent).toContain('1 AR');
	expect(container.textContent).toContain('Last Transaction');
	expect(getTokenHolders).not.toHaveBeenCalled();
	expect(getLatestHolderTransactions).not.toHaveBeenCalled();
	expect(getAoPrice).not.toHaveBeenCalled();
	await selectNetwork('ao');
	expect(location).toBe('/wallets/?network=ao');
	expect(getTokenHolders).toHaveBeenCalledOnce();
	expect(getAoPrice).toHaveBeenCalledOnce();
	expect(container.textContent).toContain('900,719,925.474099 AO');
	expect(container.querySelector('[role="row"][tabindex="0"]').textContent).toContain('$1,801,439,850.95');
	expect(Array.from(container.querySelectorAll('[role="columnheader"]')).map((header) => header.textContent)).toEqual([
		'Address',
		'Balance',
		'Value',
		'Last Transaction',
	]);
	expect(container.querySelector(`[title="${HOLDERS_SNAPSHOT.holders[0].balance}"]`)).not.toBeNull();
	expect(container.querySelector('[role="table"]').getAttribute('aria-label')).toBe('Top Holders');
	expect(container.textContent).not.toContain('Top 100 of 335,454 addresses');
	expect(getLatestHolderTransactions).not.toHaveBeenCalled();
	await showRows(0);
	expect(getLatestHolderTransactions).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({ addresses: [HOLDER_ADDRESSES[0]], signal: expect.any(AbortSignal) })
	);
	expect((await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })).violations).toEqual([]);
	await selectNetwork('arweave');
	expect(location).toBe('/wallets/');
	expect(container.textContent).toContain('1 AR');
	expect(container.textContent).not.toContain('900,719,925');
});

it('loads only visible last transactions independently and opens a completed transaction while another is pending', async () => {
	const transactionId = 't'.repeat(43);
	const pending = new Map<string, (transactions: Record<string, { status: 'found'; transactionId: string }>) => void>();
	vi.mocked(getLatestHolderTransactions).mockImplementation(
		({ addresses }) => new Promise((resolve) => pending.set(addresses[0], resolve))
	);
	await render('/wallets/?network=ao');
	expect(container.textContent).toContain('900,719,925.474099 AO');
	expect(getLatestHolderTransactions).not.toHaveBeenCalled();
	const lastCell = (index: number) =>
		container.querySelectorAll('[role="row"][tabindex="0"]')[index].querySelectorAll('[role="cell"]')[3];
	expect(lastCell(0).textContent).toBe('—');
	await showRows(0, 1);
	expect(getLatestHolderTransactions).toHaveBeenCalledTimes(2);
	expect(lastCell(0).textContent).toContain('Loading');
	expect(lastCell(1).textContent).toContain('Loading');
	expect(lastCell(2).textContent).toBe('—');
	await React.act(async () =>
		pending.get(HOLDER_ADDRESSES[0])({ [HOLDER_ADDRESSES[0]]: { status: 'found', transactionId } })
	);
	expect(lastCell(0).textContent).not.toContain('Loading');
	expect(lastCell(1).textContent).toContain('Loading');
	await showRows(2);
	expect(getLatestHolderTransactions).toHaveBeenCalledTimes(3);
	expect(getLatestHolderTransactions).toHaveBeenLastCalledWith(
		expect.objectContaining({ addresses: [HOLDER_ADDRESSES[2]] })
	);
	const link = container.querySelector<HTMLAnchorElement>(`a[href="#/explorer/${transactionId}"]`);
	expect(link).not.toBeNull();
	await React.act(async () => link.click());
	expect(location).toBe(`/explorer/${transactionId}`);
});

it('keeps balances on a last-transaction lookup failure and retries through Refresh', async () => {
	vi.mocked(getLatestHolderTransactions).mockRejectedValueOnce(new Error('offline'));
	await render('/wallets/?network=ao');
	await showRows(0);
	expect(container.textContent).toContain('900,719,925.474099 AO');
	expect(container.textContent).toContain('Some last transactions could not be loaded');
	await clickButton('Refresh');
	await showRows(0);
	expect(container.textContent).not.toContain('Some last transactions could not be loaded');
	expect(container.querySelector('[role="row"][tabindex="0"]').querySelectorAll('[role="cell"]')[3].textContent).toBe(
		'—'
	);
});

it('cancels prior-page transaction lookups and ignores their late updates', async () => {
	const transactionId = 't'.repeat(43);
	let resolve: (transactions: Record<string, { status: 'found'; transactionId: string }>) => void;
	vi.mocked(getLatestHolderTransactions).mockReturnValueOnce(
		new Promise((finish) => {
			resolve = finish;
		})
	);
	await render('/wallets/?network=ao');
	await showRows(0);
	const first = vi.mocked(getLatestHolderTransactions).mock.calls[0][0];
	await clickButton('Next');
	expect(first.signal.aborted).toBe(true);
	expect(getLatestHolderTransactions).toHaveBeenCalledTimes(1);
	await showRows(0);
	expect(vi.mocked(getLatestHolderTransactions).mock.calls[1][0].addresses).toEqual([HOLDER_ADDRESSES[50]]);
	await React.act(async () => resolve({ [HOLDER_ADDRESSES[0]]: { status: 'found', transactionId } }));
	expect(container.querySelector(`a[href="#/explorer/${transactionId}"]`)).toBeNull();
});

it.each(['arweave', 'ao'])('scrolls to the page top only from the bottom %s paginator', async (network) => {
	const scrollTo = vi.fn();
	const matchMedia = vi.fn().mockReturnValue({ matches: false });
	vi.stubGlobal('scrollTo', scrollTo);
	vi.stubGlobal('matchMedia', matchMedia);
	vi.mocked(getLatestAddressSnapshot).mockResolvedValue({
		blockHeight: 123,
		walletListRoot: 'r'.repeat(64),
		addresses: HOLDER_ADDRESSES.map((address) => ({ address, balance: '1000000000000', lastTransaction: null })),
		nextCursor: null,
	});
	await render(network === 'ao' ? '/wallets/?network=ao' : '/wallets/');
	await clickButton('Previous', true);
	expect(scrollTo).not.toHaveBeenCalled();
	await clickButton('Next');
	expect(scrollTo).not.toHaveBeenCalled();
	expect(container.querySelector(`[title="${HOLDER_ADDRESSES[50]}"]`)).not.toBeNull();
	await clickButton('Previous', true);
	expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, top: 0, behavior: 'smooth' });
	expect(container.querySelector(`[title="${HOLDER_ADDRESSES[0]}"]`)).not.toBeNull();
	await clickButton('Next', true);
	expect(scrollTo).toHaveBeenCalledTimes(2);
	expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, top: 0, behavior: 'smooth' });
	await clickButton('Next', true);
	expect(scrollTo).toHaveBeenCalledTimes(2);
	matchMedia.mockReturnValue({ matches: true });
	await clickButton('Previous', true);
	expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, top: 0, behavior: 'auto' });
});

it('keeps AO balances available without a USD price and retries the price on Refresh', async () => {
	vi.mocked(getAoPrice).mockResolvedValueOnce(null);
	await render('/wallets/?network=ao');
	const firstRow = () => container.querySelector('[role="row"][tabindex="0"]');
	expect(firstRow().textContent).toContain('900,719,925.474099 AO');
	expect(firstRow().querySelectorAll('[role="cell"]')[2].textContent).toBe('-');
	expect(container.querySelector('[role="alert"]')).toBeNull();
	await clickButton('Refresh');
	expect(firstRow().querySelectorAll('[role="cell"]')[2].textContent).toBe('$1,801,439,850.95');
	expect(getAoPrice).toHaveBeenCalledTimes(2);
});

it('ignores an older USD price response after refreshing', async () => {
	let resolvePrice: (price: number) => void;
	vi.mocked(getAoPrice).mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				resolvePrice = resolve;
			})
	);
	await render('/wallets/?network=ao');
	expect(container.querySelector('[role="row"][tabindex="0"]').textContent).toContain('900,719,925.474099 AO');
	await clickButton('Refresh');
	await React.act(async () => resolvePrice(1));
	expect(container.querySelector('[role="row"][tabindex="0"]').textContent).toContain('$1,801,439,850.95');
});

it('supports direct AO links, paginates the top list, and opens a holder in Explorer', async () => {
	await render('/wallets/?network=ao');
	expect(getLatestAddressSnapshot).not.toHaveBeenCalled();
	expect(container.querySelectorAll('[role="row"][tabindex="0"]')).toHaveLength(50);
	expect(container.querySelector(`[title="${HOLDER_ADDRESSES[0]}"]`)).not.toBeNull();
	expect(container.querySelector(`[title="${HOLDER_ADDRESSES[50]}"]`)).toBeNull();
	await clickButton('Next');
	expect(container.textContent).toContain('Page 2 of 2');
	expect(container.querySelector(`[title="${HOLDER_ADDRESSES[0]}"]`)).toBeNull();
	expect(container.querySelector(`[title="${HOLDER_ADDRESSES[50]}"]`)).not.toBeNull();
	expect(
		Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
			.filter((button) => button.textContent === 'Next')
			.every((button) => button.disabled)
	).toBe(true);
	await React.act(async () => container.querySelector<HTMLElement>('[role="row"][tabindex="0"]').click());
	expect(location).toBe(`/explorer/${HOLDER_ADDRESSES[50]}`);
});

it('retains loaded balances when refresh fails and recovers through Refresh', async () => {
	await render('/wallets/?network=ao');
	vi.mocked(getTokenHolders).mockRejectedValueOnce(new Error('offline'));
	await clickButton('Refresh');
	expect(container.querySelector('[role="alert"]').textContent).toContain('Showing the last loaded snapshot.');
	expect(container.querySelectorAll('[role="row"][tabindex="0"]')).toHaveLength(50);
	await clickButton('Refresh');
	expect(container.querySelector('[role="alert"]')).toBeNull();
});

it('shows initial failures and empty snapshots without pretending to have balances', async () => {
	vi.mocked(getTokenHolders).mockRejectedValueOnce(new Error('offline'));
	await render('/wallets/?network=ao');
	expect(container.querySelector('[role="alert"]').textContent).toContain('Unable to load top holders');
	expect(container.querySelector('[role="table"]')).toBeNull();
	vi.mocked(getTokenHolders).mockResolvedValueOnce({ ...HOLDERS_SNAPSHOT, holders: [], totalHolders: 0 });
	await clickButton('Refresh');
	expect(container.textContent).toContain('No token holders have been published yet.');
	expect(container.querySelector('[role="alert"]')).toBeNull();
});

it('aborts a superseded AO read and ignores its late result after switching to Arweave', async () => {
	let resolve: (value: typeof HOLDERS_SNAPSHOT) => void;
	vi.mocked(getTokenHolders).mockImplementationOnce(
		() =>
			new Promise((finish) => {
				resolve = finish;
			})
	);
	await render('/wallets/?network=ao');
	const signal = vi.mocked(getTokenHolders).mock.calls[0][0].signal;
	expect(container.textContent).toContain('Loading top holders');
	await selectNetwork('arweave');
	expect(signal.aborted).toBe(true);
	await React.act(async () => resolve(HOLDERS_SNAPSHOT));
	expect(container.textContent).toContain('1 AR');
	expect(container.textContent).not.toContain('900,719,925');
});
