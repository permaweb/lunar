// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { arweaveNodeApi, ArweaveNodeError } from '../../../src/api/arweaveNode';
import { getLatestAddressSnapshot } from '../../../src/api/addresses';
import { getBlocks, getBlockMetadataByHeight, getTransactions } from '../../../src/api/blocks';
import { ArweaveNode } from '../../../src/features/Explorer/components/organisms/ArweaveNode';
import { getArweaveNodeRoute } from '../../../src/helpers/arweaveNode';
import { darkTheme, theme } from '../../../src/helpers/themes';
import { MINER_ADDRESS, NODE_INFO, NODE_URL, nodeBlock } from '../../fixtures/arweaveNode';

vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden={'true'} /> }));
vi.mock('api/blocks', async () => ({
	...(await vi.importActual('../../../src/api/blocks')),
	getBlocks: vi.fn(),
	getBlockMetadataByHeight: vi.fn(),
	getTransactions: vi.fn(),
}));
vi.mock('api/addresses', async () => ({
	...(await vi.importActual('../../../src/api/addresses')),
	getLatestAddressSnapshot: vi.fn(),
}));
vi.mock('react-redux', () => ({ useDispatch: () => vi.fn(), useSelector: () => null }));
vi.mock('store', () => ({ store: { getState: () => ({}) } }));
vi.mock('store/transactions/reducer', () => ({ selectTransaction: () => null }));
vi.mock('api/arweaveNode', async () => ({
	...(await vi.importActual('../../../src/api/arweaveNode/types')),
	arweaveNodeApi: {
		getInfo: vi.fn(),
		getBlocks: vi.fn(),
		getPending: vi.fn(),
		getBalance: vi.fn(),
		getTransaction: vi.fn(),
	},
}));
let container: HTMLElement;
let root: ReturnType<typeof createRoot>;
let navigate: ReturnType<typeof useNavigate>;
let currentPath = '';
const onLoadingChange = vi.fn();

function Harness(props: { isActive: boolean }) {
	navigate = useNavigate();
	currentPath = useLocation().pathname;
	return <ArweaveNode node={NODE_URL} isActive={props.isActive} onLoadingChange={onLoadingChange} />;
}
async function render(isActive = true, tab = '') {
	await React.act(async () =>
		root.render(
			<MemoryRouter initialEntries={[getArweaveNodeRoute(NODE_URL, tab)]}>
				<ThemeProvider theme={theme(darkTheme)}>
					<Harness isActive={isActive} />
				</ThemeProvider>
			</MemoryRouter>
		)
	);
}
async function go(tab: string) {
	await React.act(async () => navigate(getArweaveNodeRoute(NODE_URL, tab)));
}
async function click(label: string) {
	const button = [...container.querySelectorAll('button')].find(
		(button) => button.textContent === label && !button.disabled
	);
	expect(button, label).toBeDefined();
	await React.act(async () => button.click());
}
beforeEach(() => {
	vi.resetAllMocks();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.mocked(arweaveNodeApi.getInfo).mockResolvedValue(NODE_INFO);
	vi.mocked(arweaveNodeApi.getBlocks).mockImplementation(async (_node, anchor, count) =>
		Array.from({ length: Math.min(anchor.height + 1, count) }, (_, index) => nodeBlock(anchor.height - index))
	);
	vi.mocked(arweaveNodeApi.getBalance).mockResolvedValue('9007199254740993');
	vi.mocked(arweaveNodeApi.getPending).mockResolvedValue(['b'.repeat(43)]);
	vi.mocked(arweaveNodeApi.getTransaction).mockImplementation(async (_node, id) => ({
		id,
		tags: [],
		owner: MINER_ADDRESS,
		recipient: null,
		quantity: '0',
		fee: '1000000000000',
		dataSize: '10',
		denomination: 1,
		contentType: 'text/plain',
		appName: 'Example',
	}));
	container = document.createElement('main');
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.clearAllMocks();
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

it('shows three tabs and node overview without eagerly reading mempool metadata or balances', async () => {
	await render();
	expect(container.textContent).toContain('arweave.N.1');
	expect(container.textContent).toContain('Recent Blocks');
	expect(container.textContent).toContain('Overview');
	expect(container.textContent).toContain('Mempool');
	expect(container.textContent).toContain('Miners');
	expect(container.querySelector('input')?.value).toBe(NODE_URL);
	const visit = container.querySelector<HTMLAnchorElement>(`a[href="${NODE_URL}"]`);
	expect(visit?.textContent).toBe('Visit Node');
	expect(visit?.target).toBe('_blank');
	expect(visit?.rel).toContain('noopener');
	expect(container.querySelector('h2')).toBeNull();
	expect(container.querySelector('table')).toBeNull();
	expect(container.textContent).toContain('Previous Block');
	expect(getBlocks).not.toHaveBeenCalled();
	expect(getBlockMetadataByHeight).not.toHaveBeenCalled();
	expect(getLatestAddressSnapshot).not.toHaveBeenCalled();
	expect(arweaveNodeApi.getPending).not.toHaveBeenCalled();
	expect(arweaveNodeApi.getBalance).not.toHaveBeenCalled();
	expect(arweaveNodeApi.getBlocks).toHaveBeenCalledWith(
		NODE_URL,
		{ height: 100, hash: NODE_INFO.hash },
		25,
		expect.any(AbortSignal)
	);
	const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
	expect(result.violations).toEqual([]);
});

it('lists all indexed miners, exact balances, block counts, and last blocks, and indexes older history once', async () => {
	await render(true, 'miners');
	expect(container.textContent).toContain('9,007.199254740993 AR');
	expect(container.textContent).toContain('25 indexed blocks · heights 76–100');
	expect(container.querySelector('[role="table"] [role="columnheader"]')?.textContent).toBe('Wallet Address');
	expect(container.textContent).toContain('Blocks Mined');
	expect(getLatestAddressSnapshot).not.toHaveBeenCalled();
	expect(container.querySelector('a[href="#/explorer/' + MINER_ADDRESS + '"]')).not.toBeNull();
	await click('Index 100 Older Blocks');
	expect(container.textContent).toContain('101 indexed blocks · heights 0–100');
	expect(arweaveNodeApi.getBlocks).toHaveBeenCalledTimes(2);
	await go('mempool');
	await go('miners');
	expect(arweaveNodeApi.getBlocks).toHaveBeenCalledTimes(2);
	expect(currentPath).toBe(getArweaveNodeRoute(NODE_URL, 'miners'));
	const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
	expect(result.violations).toEqual([]);
});

it('keeps the successful mempool and observation baseline on refresh failure', async () => {
	await render(true, 'mempool');
	expect(arweaveNodeApi.getBlocks).not.toHaveBeenCalled();
	expect(container.textContent).toContain('First read');
	expect(container.textContent).toContain('Owner');
	expect(container.textContent).toContain('First Observed');
	expect(getTransactions).not.toHaveBeenCalled();
	vi.mocked(arweaveNodeApi.getPending).mockRejectedValueOnce(new ArweaveNodeError('timeout'));
	// Mempool has its own refresh button after the common node refresh.
	const refresh = [...container.querySelectorAll('button')].find(
		(button) =>
			button.textContent === 'Refresh' &&
			button.parentElement?.parentElement?.textContent?.includes('Pending Transactions')
	);
	await React.act(async () => refresh.click());
	expect(container.textContent).toContain('Showing the last successful observation');
	expect(container.textContent).toContain('10 Bytes');
	vi.mocked(arweaveNodeApi.getPending).mockResolvedValueOnce(['c'.repeat(43)]);
	await React.act(async () => refresh.click());
	expect(container.textContent).toContain('1 added · 1 removed');
	expect(container.textContent).not.toContain('Showing the last successful observation');
});

it('paginates metadata, cancels work when inactive, and stops polling', async () => {
	vi.useFakeTimers();
	const ids = Array.from({ length: 30 }, (_, index) => String(index).padStart(43, 'b'));
	vi.mocked(arweaveNodeApi.getPending).mockResolvedValue(ids);
	const signals: AbortSignal[] = [];
	vi.mocked(arweaveNodeApi.getTransaction).mockImplementation((_node, _id, signal) => {
		signals.push(signal);
		return new Promise(() => {});
	});
	await render(true, 'mempool');
	expect(signals).toHaveLength(25);
	await click('Next');
	expect(signals).toHaveLength(30);
	expect(signals.slice(0, 25).every((signal) => signal.aborted)).toBe(true);
	await render(false);
	expect(signals.every((signal) => signal.aborted)).toBe(true);
	const reads = vi.mocked(arweaveNodeApi.getPending).mock.calls.length;
	await React.act(async () => vi.advanceTimersByTimeAsync(120_000));
	expect(arweaveNodeApi.getPending).toHaveBeenCalledTimes(reads);
});
