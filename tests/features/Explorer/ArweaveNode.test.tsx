// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { getLatestAddressSnapshot } from '../../../src/api/addresses';
import { arweaveNodeApi, ArweaveNodeError } from '../../../src/api/arweaveNode';
import { getBlockMetadataByHeight, getBlocks, getTransactions } from '../../../src/api/blocks';
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
		getBlockTransactionIds: vi.fn(),
	},
}));
let container: HTMLElement;
let overlay: HTMLElement;
let root: ReturnType<typeof createRoot>;
let navigate: ReturnType<typeof useNavigate>;
let currentPath = '';
const onLoadingChange = vi.fn();
const onResolved = vi.fn();

function Harness(props: { isActive: boolean }) {
	navigate = useNavigate();
	currentPath = useLocation().pathname;
	return (
		<ArweaveNode node={NODE_URL} isActive={props.isActive} onLoadingChange={onLoadingChange} onResolved={onResolved} />
	);
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
	const button = [...document.querySelectorAll('button')].find(
		(button) =>
			(button.textContent === label || button.getAttribute('aria-label') === label) &&
			!button.disabled &&
			!button.closest('[style*="display: none"]')
	);
	expect(button, label).toBeDefined();
	await React.act(async () => {
		button.focus();
		button.click();
	});
}
beforeEach(() => {
	vi.resetAllMocks();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.mocked(arweaveNodeApi.getInfo).mockResolvedValue(NODE_INFO);
	vi.mocked(arweaveNodeApi.getBlocks).mockImplementation(async (_node, anchor, count) =>
		Array.from({ length: Math.min(anchor.height + 1, count) }, (_, index) => nodeBlock(anchor.height - index))
	);
	vi.mocked(arweaveNodeApi.getBlockTransactionIds).mockImplementation(async (_node, hash) =>
		Array.from({ length: 5 }, (_, index) => `${hash.slice(-5)}${index}`.padStart(43, 'b'))
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
	overlay = document.createElement('div');
	overlay.id = 'overlay';
	document.body.append(overlay);
	container = document.createElement('main');
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	overlay.remove();
	vi.clearAllMocks();
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

it('shows four tabs and node overview without eagerly reading mempool metadata or balances', async () => {
	await render();
	expect(container.textContent).toContain('arweave.N.1');
	expect(container.textContent).toContain('Recent Blocks');
	expect(container.textContent).toContain('Overview');
	expect(container.textContent).toContain('Mempool');
	expect(container.textContent).toContain('Miners');
	expect(container.querySelector('input')?.value).toBe(NODE_URL);
	const visit = container.querySelector<HTMLButtonElement>('button[aria-label="Visit Node"]');
	expect(visit).not.toBeNull();
	const open = vi.spyOn(window, 'open').mockImplementation(() => null);
	await React.act(async () => visit.click());
	expect(open).toHaveBeenCalledWith(NODE_URL, '_blank', 'noopener,noreferrer');
	expect(container.querySelectorAll('button[aria-label="Copy Full URL"]')).toHaveLength(1);
	expect(container.textContent).not.toContain('Git Commit');
	const blocks = [...container.querySelectorAll('p')].find((paragraph) => paragraph.textContent === 'Recent Blocks')
		?.parentElement?.parentElement?.parentElement;
	expect(blocks.firstElementChild?.textContent).not.toContain('Page (');
	expect(blocks.lastElementChild?.textContent).toContain('Page (1 of 1)');
	expect(
		[...blocks.querySelectorAll('button')]
			.filter((button) => ['Previous', 'Next'].includes(button.textContent))
			.every((button) => button.disabled)
	).toBe(true);

	expect(container.querySelector('h2')).toBeNull();
	expect(container.querySelector('table')?.closest('[style*="display: none"]')).not.toBeNull();
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
		expect.any(AbortSignal),
		expect.any(Function)
	);
	const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
	expect(result.violations).toEqual([]);
});

it('lists indexed miners and opens coverage information before continuing manual indexing', async () => {
	let finishIndexing: (blocks: ReturnType<typeof nodeBlock>[]) => void;
	let progress: (blocks: ReturnType<typeof nodeBlock>[]) => void;
	vi.mocked(arweaveNodeApi.getBlocks).mockImplementationOnce(
		(_node, _anchor, _count, _signal, onProgress) =>
			new Promise((resolve) => {
				finishIndexing = resolve;
				progress = onProgress;
			})
	);
	await render(true, 'miners');
	const minerHeader = [...container.querySelectorAll('p')].find((paragraph) =>
		paragraph.textContent?.startsWith('Indexed Mining Addresses')
	)?.parentElement?.parentElement;
	const minerList = minerHeader?.parentElement;
	expect(minerHeader?.textContent).not.toContain('Page (');
	expect(minerList?.lastElementChild?.textContent).toContain('Page (1 of 1)');
	expect(minerList?.querySelector('[role="status"]')?.textContent).toBe('Indexing blocks from this node...');
	expect(minerList.parentElement.textContent.match(/Indexing blocks from this node\.\.\./g)).toHaveLength(1);
	await React.act(async () => progress([nodeBlock(100)]));
	expect(container.querySelector('[role="table"]')).not.toBeNull();
	expect(container.textContent).toContain('9,007.199254740993 AR');
	expect(arweaveNodeApi.getBalance).toHaveBeenCalledTimes(1);
	expect(minerList.contains(minerHeader)).toBe(true);
	await React.act(async () => finishIndexing(Array.from({ length: 25 }, (_, index) => nodeBlock(100 - index))));
	expect(container.textContent).toContain('9,007.199254740993 AR');
	expect(container.textContent).not.toContain('25 indexed blocks');
	await click('Tab Information');
	expect(overlay.querySelector('[role="dialog"]')?.textContent).toContain('25 indexed blocks · heights 76–100');
	await click('Close');
	expect(document.activeElement?.getAttribute('aria-label')).toBe('Tab Information');
	expect(container.querySelector('[role="table"] [role="columnheader"]')?.textContent).toBe('Wallet Address');
	expect(container.textContent).toContain('Blocks Mined');
	expect(getLatestAddressSnapshot).not.toHaveBeenCalled();
	expect(container.querySelector('a[href="#/explorer/' + MINER_ADDRESS + '"]')).not.toBeNull();
	expect(
		[...container.querySelectorAll('button')].some((button) => button.textContent === 'Index 100 Older Blocks')
	).toBe(false);
	await go('mempool');
	await go('miners');
	expect(arweaveNodeApi.getBlocks).toHaveBeenCalledTimes(1);
	expect(currentPath).toBe(getArweaveNodeRoute(NODE_URL, 'miners'));
	const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
	expect(result.violations).toEqual([]);
});

it('continues indexing 100 older blocks before Filter and updates the summed rewards chip', async () => {
	await render(true, 'miners');
	const indexButton = [...container.querySelectorAll('button')].find(
		(button) => button.textContent === 'Continue Indexing' && !button.closest('[style*="display: none"]')
	);
	expect(indexButton.parentElement.parentElement.textContent).toMatch(/Continue Indexing.*Filter/);
	expect(container.textContent).toContain('Total Rewards: 308,641.97 AR');
	await click('Continue Indexing');
	expect(arweaveNodeApi.getBlocks).toHaveBeenLastCalledWith(
		NODE_URL,
		{ height: 75, hash: nodeBlock(75).hash },
		100,
		expect.any(AbortSignal),
		expect.any(Function)
	);
	expect(container.textContent).toContain('Total Rewards: 1,246,913.57 AR');
	expect(indexButton).toHaveProperty('disabled', true);
	await click('Tab Information');
	expect(overlay.textContent).toContain('101 indexed blocks · heights 0–100');
});

it('loads confirmed transactions from the selected node, pages metadata, and cancels hidden work', async () => {
	await render(true, 'transactions');
	expect(currentPath).toBe(getArweaveNodeRoute(NODE_URL, 'transactions'));
	expect(arweaveNodeApi.getPending).not.toHaveBeenCalled();
	expect(getTransactions).not.toHaveBeenCalled();
	const heading = [...container.querySelectorAll('p')].find((p) =>
		p.textContent.startsWith('Indexed Confirmed Transactions')
	);
	const list = heading.parentElement.parentElement.parentElement;
	expect(list.querySelectorAll('.transaction-list-element')).toHaveLength(25);
	expect(list.firstElementChild.textContent).not.toContain('Page (');
	expect(list.lastElementChild.textContent).toContain('Page (1 of 5)');
	expect(arweaveNodeApi.getBlockTransactionIds).toHaveBeenCalledTimes(5);
	expect(
		vi
			.mocked(arweaveNodeApi.getTransaction)
			.mock.calls.every(([node, , , state]) => node === NODE_URL && state === 'confirmed')
	).toBe(true);
	const firstIds = new Set(vi.mocked(arweaveNodeApi.getTransaction).mock.calls.map(([, id]) => id));
	expect(firstIds.size).toBe(25);
	vi.mocked(arweaveNodeApi.getTransaction).mockClear();
	const signals: AbortSignal[] = [];
	vi.mocked(arweaveNodeApi.getTransaction).mockImplementation((_node, _id, signal) => {
		signals.push(signal);
		return new Promise(() => {});
	});
	await click('Next');
	expect(list.lastElementChild.textContent).toContain('Page (2 of 5)');
	expect(list.querySelectorAll('.transaction-list-element')).toHaveLength(25);
	expect(vi.mocked(arweaveNodeApi.getTransaction).mock.calls.every(([, id]) => !firstIds.has(id))).toBe(true);
	await go('miners');
	expect(signals.every((signal) => signal.aborted)).toBe(true);
});

it('renders confirmed IDs before all blocks respond and retains valid rows on a partial failure', async () => {
	let progress: (blocks: ReturnType<typeof nodeBlock>[]) => void;
	let finish: (blocks: ReturnType<typeof nodeBlock>[]) => void;
	vi.mocked(arweaveNodeApi.getBlocks).mockImplementationOnce(
		(_node, _anchor, _count, _signal, onProgress) =>
			new Promise((resolve) => {
				progress = onProgress;
				finish = resolve;
			})
	);
	let rejectIds: (error: Error) => void;
	vi.mocked(arweaveNodeApi.getBlockTransactionIds)
		.mockImplementationOnce(async () => ['b'.repeat(43), 'c'.repeat(43)])
		.mockImplementationOnce(
			() =>
				new Promise((_resolve, reject) => {
					rejectIds = reject;
				})
		);
	await render(true, 'transactions');
	const heading = [...container.querySelectorAll('p')].find((p) =>
		p.textContent.startsWith('Indexed Confirmed Transactions')
	);
	const list = heading.parentElement.parentElement.parentElement;
	expect(list.querySelector('[role="status"]')?.textContent).toBe('Reading confirmed transactions from this node...');
	const blocks = [
		{ ...nodeBlock(100), transactions: 2 },
		{ ...nodeBlock(99), transactions: 5 },
	];
	await React.act(async () => progress(blocks));
	expect(list.querySelectorAll('.transaction-list-element')).toHaveLength(2);
	expect(list.textContent).toContain('10 Bytes');
	await React.act(async () => rejectIds(new ArweaveNodeError('timeout')));
	await React.act(async () => finish(blocks));
	expect(list.querySelectorAll('.transaction-list-element')).toHaveLength(2);
	expect(container.textContent).toContain('This node did not respond in time');
	await click('Tab Information');
	expect(overlay.textContent).toContain('newest blocks first');
	await click('Close');
	const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
	expect(result.violations).toEqual([]);
});

it('keeps the full confirmed page visible while refreshing IDs and reuses confirmed metadata', async () => {
	await render(true, 'transactions');
	const heading = [...container.querySelectorAll('p')].find((p) =>
		p.textContent.startsWith('Indexed Confirmed Transactions')
	);
	const list = heading.parentElement.parentElement.parentElement;
	const readIds = vi.mocked(arweaveNodeApi.getBlockTransactionIds).getMockImplementation();
	const metadataReads = vi.mocked(arweaveNodeApi.getTransaction).mock.calls.length;
	const waiting: { signal: AbortSignal; finish: () => Promise<void> }[] = [];
	vi.mocked(arweaveNodeApi.getBlockTransactionIds).mockImplementation((node, hash, signal) => {
		if (hash === NODE_INFO.hash) return readIds(node, hash, signal);
		return new Promise((resolve) =>
			waiting.push({ signal, finish: async () => resolve(await readIds(node, hash, signal)) })
		);
	});
	await click('Refresh');
	expect(waiting).toHaveLength(4);
	expect(list.querySelectorAll('.transaction-list-element')).toHaveLength(25);
	expect(arweaveNodeApi.getTransaction).toHaveBeenCalledTimes(metadataReads);
	await go('mempool');
	expect(waiting.every(({ signal }) => signal.aborted)).toBe(true);
	await React.act(async () => {
		for (const request of waiting) await request.finish();
	});
	expect(list.querySelectorAll('.transaction-list-element')).toHaveLength(25);
});

it('shows added and removed IDs in separately paginated, accessible tables', async () => {
	const old = Array.from({ length: 30 }, (_, index) => String(index).padStart(43, 'b'));
	const added = Array.from({ length: 27 }, (_, index) => String(index).padStart(43, 'c'));
	vi.mocked(arweaveNodeApi.getPending).mockResolvedValueOnce(old).mockResolvedValueOnce(added);
	await render(true, 'mempool');
	await click('Refresh');
	const [addedTable, removedTable] = [...container.querySelectorAll('table')];
	expect(addedTable.getAttribute('aria-labelledby')).not.toBe(removedTable.getAttribute('aria-labelledby'));
	expect(addedTable.querySelectorAll('tbody tr')).toHaveLength(25);
	expect(removedTable.querySelectorAll('tbody tr')).toHaveLength(25);
	expect(addedTable.querySelector('a').getAttribute('href')).toBe(`#/explorer/${added[0]}`);
	const next = [...addedTable.parentElement.querySelectorAll('button')].find((button) => button.textContent === 'Next');
	await React.act(async () => next.click());
	expect(addedTable.querySelectorAll('tbody tr')).toHaveLength(2);
	expect(addedTable.parentElement.textContent).toContain('Page (2 of 2)');
	expect(removedTable.parentElement.textContent).toContain('Page (1 of 2)');
	const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
	expect(result.violations).toEqual([]);
});

it('keeps the successful mempool and observation baseline on refresh failure', async () => {
	await render(true, 'mempool');
	expect(arweaveNodeApi.getBlocks).not.toHaveBeenCalled();
	expect(container.querySelector('table')?.textContent).toContain('First read');
	await click('Tab Information');
	expect(overlay.textContent).toContain('First read');
	await click('Close');
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
	await click('Tab Information');
	expect(overlay.textContent).toContain('1 added · 1 removed');
	await click('Close');
	expect(container.textContent).toContain('Added (1)');
	expect(container.textContent).not.toContain('Showing the last successful observation');
});

it('renders mempool rows progressively inside a stable table and keeps completed details during refresh', async () => {
	const ids = ['b'.repeat(43), 'c'.repeat(43), 'd'.repeat(43)];
	let resolveIds: (value: string[]) => void;
	vi.mocked(arweaveNodeApi.getPending).mockReturnValueOnce(
		new Promise((resolve) => {
			resolveIds = resolve;
		})
	);
	const pending = new Map<
		string,
		{
			resolve: (value: Awaited<ReturnType<typeof arweaveNodeApi.getTransaction>>) => void;
			reject: (error: Error) => void;
		}
	>();
	const readTransaction = vi.mocked(arweaveNodeApi.getTransaction).getMockImplementation();
	vi.mocked(arweaveNodeApi.getTransaction).mockImplementation(
		(_node, id) =>
			new Promise((resolve, reject) => {
				pending.set(id, { resolve, reject });
			})
	);
	await render(true, 'mempool');
	const heading = [...container.querySelectorAll('p')].find((paragraph) =>
		paragraph.textContent?.startsWith('Pending Transactions')
	);
	const list = heading.parentElement.parentElement.parentElement;
	expect(list.querySelector('[role="status"]')?.textContent).toBe('Refreshing pending transactions...');
	expect(list.textContent.match(/Refreshing pending transactions\.\.\./g)).toHaveLength(1);
	await React.act(async () => resolveIds(ids));
	expect(list.querySelectorAll('.transaction-list-element')).toHaveLength(3);
	const rows = [...list.querySelectorAll('.transaction-list-element')];
	expect(rows.every((row) => row.textContent.includes('Loading...'))).toBe(true);
	await React.act(async () =>
		pending.get(ids[1]).resolve(await readTransaction(NODE_URL, ids[1], new AbortController().signal))
	);
	expect(rows[1].textContent).toContain('10 Bytes');
	expect(rows[0].textContent).toContain('Loading...');
	expect(list.isConnected).toBe(true);
	await React.act(async () => pending.get(ids[0]).reject(new ArweaveNodeError('not-found')));
	expect(rows[0].textContent).not.toContain('Loading...');
	expect(rows[2].textContent).toContain('Loading...');
	await React.act(async () =>
		pending.get(ids[2]).resolve(await readTransaction(NODE_URL, ids[2], new AbortController().signal))
	);
	vi.mocked(arweaveNodeApi.getPending).mockResolvedValue(ids);
	const refresh = [...list.querySelectorAll('button')].find((button) => button.textContent === 'Refresh');
	await React.act(async () => refresh.click());
	expect(rows[1].textContent).toContain('10 Bytes');
	expect(rows[2].textContent).toContain('10 Bytes');
	expect(list.querySelector('[role="status"]')).toBeNull();
	await render(false);
	await React.act(async () =>
		pending
			.get(ids[1])
			.resolve({ ...(await readTransaction(NODE_URL, ids[1], new AbortController().signal)), dataSize: '999' })
	);
	expect(rows[1].textContent).toContain('10 Bytes');
	expect(rows[1].textContent).not.toContain('999 Bytes');
});

it('renders partial block history immediately and retains it if a later block fails', async () => {
	let progress: (blocks: ReturnType<typeof nodeBlock>[]) => void;
	let reject: (error: Error) => void;
	vi.mocked(arweaveNodeApi.getBlocks).mockImplementationOnce(
		(_node, _anchor, _count, _signal, onProgress) =>
			new Promise((_resolve, fail) => {
				progress = onProgress;
				reject = fail;
			})
	);
	await render();
	const heading = [...container.querySelectorAll('p')].find((paragraph) => paragraph.textContent === 'Recent Blocks');
	const list = heading.parentElement.parentElement.parentElement;
	expect(list.querySelector('[role="status"]')?.textContent).toBe('Indexing blocks from this node...');
	await React.act(async () => progress([nodeBlock(100)]));
	expect(list.querySelector(`a[href="#/explorer/${NODE_INFO.hash}"]`)).not.toBeNull();
	expect(list.isConnected).toBe(true);
	await React.act(async () => progress([nodeBlock(100), nodeBlock(99)]));
	await React.act(async () => reject(new ArweaveNodeError('timeout')));
	expect(list.querySelector(`a[href="#/explorer/${NODE_INFO.hash}"]`)).not.toBeNull();
	expect(list.querySelector('[role="status"]')).toBeNull();
	expect(container.querySelector('[role="alert"]')).not.toBeNull();
	await go('miners');
	expect(container.textContent).toContain('9,007.199254740993 AR');
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
	const mempoolHeader = [...container.querySelectorAll('p')].find((paragraph) =>
		paragraph.textContent?.startsWith('Pending Transactions')
	)?.parentElement?.parentElement;
	expect(mempoolHeader?.textContent).not.toContain('Page (');
	expect(mempoolHeader?.parentElement?.lastElementChild?.textContent).toContain('Page (2 of 2)');
	expect(signals).toHaveLength(30);
	expect(signals.slice(0, 25).every((signal) => signal.aborted)).toBe(true);
	await render(false);
	expect(signals.every((signal) => signal.aborted)).toBe(true);
	const reads = vi.mocked(arweaveNodeApi.getPending).mock.calls.length;
	await React.act(async () => vi.advanceTimersByTimeAsync(120_000));
	expect(arweaveNodeApi.getPending).toHaveBeenCalledTimes(reads);
});

it('opens the miner filter panel, applies a query, and restores focus when closed', async () => {
	await render(true, 'miners');
	expect(container.querySelector('input[aria-label="Filter Mining Address"]')).toBeNull();
	await click('Filter');
	const dialog = overlay.querySelector<HTMLElement>('[role="dialog"]');
	const input = dialog.querySelector<HTMLInputElement>('input');
	expect(document.activeElement).toBe(input);
	await React.act(async () => {
		Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'missing-miner');
		input.dispatchEvent(new Event('input', { bubbles: true }));
	});
	expect(container.textContent).toContain('9,007.199254740993 AR');
	await React.act(async () =>
		dialog.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
	);
	expect(overlay.querySelector('[role="dialog"]')).toBeNull();
	expect(container.textContent).toContain('No indexed mining addresses match');
	expect(document.activeElement?.textContent).toBe('Filter');
	await click('Filter');
	await click('Clear');
	await React.act(async () =>
		overlay.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
	);
	expect(container.textContent).toContain('9,007.199254740993 AR');
	await click('Tab Information');
	const result = await axe.run(overlay, { rules: { 'color-contrast': { enabled: false } } });
	expect(result.violations).toEqual([]);
	await React.act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
	expect(overlay.querySelector('[role="dialog"]')).toBeNull();
});

it('confirms node type from info before loading the requested mempool', async () => {
	let resolveInfo: (value: typeof NODE_INFO) => void;
	vi.mocked(arweaveNodeApi.getInfo).mockImplementation(
		() =>
			new Promise((resolve) => {
				resolveInfo = resolve;
			})
	);
	await render(true, 'mempool');
	expect(onResolved).not.toHaveBeenCalled();
	expect(container.textContent).not.toContain('Arweave Node');
	expect(arweaveNodeApi.getPending).not.toHaveBeenCalled();
	await React.act(async () => resolveInfo(NODE_INFO));
	expect(onResolved).toHaveBeenCalledWith(NODE_URL);
	expect(arweaveNodeApi.getInfo).toHaveBeenCalledTimes(1);
	expect(arweaveNodeApi.getPending).toHaveBeenCalledTimes(1);
	expect(currentPath).toBe(`/explorer/${encodeURIComponent(NODE_URL)}/mempool`);
});

it('leaves the type unresolved for an invalid info response and allows retry', async () => {
	vi.mocked(arweaveNodeApi.getInfo).mockRejectedValueOnce(new ArweaveNodeError('invalid-response'));
	await render(true, 'mempool');
	expect(onResolved).not.toHaveBeenCalled();
	expect(container.querySelector('[role="alert"]')).not.toBeNull();
	expect(arweaveNodeApi.getPending).not.toHaveBeenCalled();
	await click('Refresh');
	expect(onResolved).toHaveBeenCalledWith(NODE_URL);
	expect(arweaveNodeApi.getPending).toHaveBeenCalledTimes(1);
});
