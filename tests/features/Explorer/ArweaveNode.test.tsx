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
	...(await vi.importActual('../../../src/api/arweaveNode')),
	arweaveNodeApi: {
		getInfo: vi.fn(),
		getBlocks: vi.fn(),
		getPending: vi.fn(),
		getBalance: vi.fn(),
		getPendingRewards: vi.fn(),
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
	vi.mocked(arweaveNodeApi.getInfo).mockImplementation(async () => ({ ...NODE_INFO }));
	vi.mocked(arweaveNodeApi.getBlocks).mockImplementation(async (_node, anchor, count) =>
		Array.from({ length: Math.min(anchor.height + 1, count) }, (_, index) => nodeBlock(anchor.height - index))
	);
	vi.mocked(arweaveNodeApi.getBlockTransactionIds).mockImplementation(async (_node, hash) =>
		Array.from({ length: 5 }, (_, index) => `${hash.slice(-5)}${index}`.padStart(43, 'b'))
	);
	vi.mocked(arweaveNodeApi.getBalance).mockResolvedValue('9007199254740993');
	vi.mocked(arweaveNodeApi.getPendingRewards).mockResolvedValue('1500000000000');
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
	const commit = '1234567890abcdef1234567890abcdef12345678';
	vi.mocked(arweaveNodeApi.getInfo).mockResolvedValueOnce({ ...NODE_INFO, gitHash: commit });
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
	expect(container.textContent).toContain('Release / Git Commit: 100 /1234567');
	expect(container.textContent).not.toContain('Version / Release');
	const commitLink = container.querySelector<HTMLAnchorElement>(
		`a[href="https://github.com/ArweaveTeam/arweave/commit/${commit}"]`
	);
	expect(commitLink?.textContent).toBe('1234567');
	expect(commitLink?.target).toBe('_blank');
	expect(commitLink?.rel).toBe('noopener noreferrer');
	const blocks = [...container.querySelectorAll('p')].find((paragraph) => paragraph.textContent === 'Recent Blocks')
		?.parentElement?.parentElement?.parentElement;
	expect(blocks.firstElementChild?.textContent).not.toContain('Page (');
	expect(blocks.lastElementChild?.textContent).toContain('Page (1)');
	expect(
		[...blocks.querySelectorAll('button')]
			.filter((button) => button.textContent === 'Next')
			.every((button) => !button.disabled)
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

it('progressively lists indexed miners and opens coverage information', async () => {
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
	expect(minerList?.lastElementChild?.textContent).toContain('Page (1)');
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

it('pages backward through node blocks, reuses previous pages and indexes the same range for miners', async () => {
	await render();
	await click('Next');
	expect(arweaveNodeApi.getBlocks).toHaveBeenLastCalledWith(
		NODE_URL,
		{ height: 75, hash: nodeBlock(75).hash },
		25,
		expect.any(AbortSignal),
		expect.any(Function)
	);
	let rows = [...container.querySelectorAll('.block-list-element')];
	expect(rows).toHaveLength(25);
	expect(rows[0].querySelector('a > p').textContent).toBe('75');
	await click('Previous');
	expect(arweaveNodeApi.getBlocks).toHaveBeenCalledTimes(2);
	expect(container.querySelector('.block-list-element a > p').textContent).toBe('100');
	await click('Next');
	expect(arweaveNodeApi.getBlocks).toHaveBeenCalledTimes(3);
	expect(container.querySelector('.block-list-element a > p').textContent).toBe('75');
	await click('Next');
	await click('Next');
	await click('Next');
	rows = [...container.querySelectorAll('.block-list-element')];
	expect(rows).toHaveLength(1);
	expect(rows[0].querySelector('a > p').textContent).toBe('0');
	const next = [...container.querySelectorAll('button')].filter(
		(button) => button.textContent === 'Next' && !button.closest('[style*="display: none"]')
	);
	expect(next.every((button) => button.disabled)).toBe(true);
	await go('miners');
	expect(container.textContent).not.toContain('Continue Indexing');
	expect(container.textContent).toContain('Total Rewards: 1,246,913.57 AR');
	expect(container.textContent).toContain('0–100');
	expect(container.textContent).toContain('Start Time');
	expect(container.textContent).toContain('End Time');
	for (const height of [0, 100])
		expect(container.textContent).toContain(
			new Date(nodeBlock(height).timestamp * 1000).toLocaleString(undefined, { timeZoneName: 'short' })
		);
	await click('Tab Information');
	expect(overlay.textContent).toContain('101 indexed blocks · heights 0–100');
});

it('indexes older blocks from the miner paginator and progressively updates the count and pages', async () => {
	const minerBlock = (height: number) => nodeBlock(height, String(height).padStart(43, 'm'));
	vi.mocked(arweaveNodeApi.getBlocks).mockResolvedValueOnce(
		Array.from({ length: 25 }, (_, index) => minerBlock(100 - index))
	);
	await render(true, 'miners');
	const heading = [...container.querySelectorAll('p')].find((p) =>
		p.textContent.startsWith('Indexed Mining Addresses')
	);
	const list = heading.parentElement.parentElement.parentElement;
	expect(heading.textContent).toContain('(25)');
	expect(list.lastElementChild.textContent).toContain('Page (1)');
	let progress: (blocks: ReturnType<typeof nodeBlock>[]) => void;
	let finish: (blocks: ReturnType<typeof nodeBlock>[]) => void;
	vi.mocked(arweaveNodeApi.getBlocks).mockImplementationOnce(
		(_node, _anchor, _count, _signal, onProgress) =>
			new Promise((resolve) => {
				progress = onProgress;
				finish = resolve;
			})
	);
	await click('Next');
	expect(arweaveNodeApi.getBlocks).toHaveBeenLastCalledWith(
		NODE_URL,
		{ height: 75, hash: nodeBlock(75).hash },
		25,
		expect.any(AbortSignal),
		expect.any(Function)
	);
	const nextButtons = [...list.querySelectorAll('button')].filter((button) => button.textContent === 'Next');
	expect(nextButtons.every((button) => button.disabled)).toBe(true);
	await React.act(async () => nextButtons.forEach((button) => button.click()));
	expect(arweaveNodeApi.getBlocks).toHaveBeenCalledTimes(2);
	await React.act(async () => progress([minerBlock(75)]));
	expect(heading.textContent).toContain('(26)');
	expect(list.lastElementChild.textContent).toContain('Page (2)');
	expect(list.querySelectorAll('[role="rowgroup"] [role="row"]')).toHaveLength(1);
	await React.act(async () => finish(Array.from({ length: 25 }, (_, index) => minerBlock(75 - index))));
	expect(heading.textContent).toContain('(50)');
	expect(list.querySelectorAll('[role="rowgroup"] [role="row"]')).toHaveLength(25);
	expect(container.textContent).toContain('51–100');
	await click('Previous');
	await click('Next');
	expect(arweaveNodeApi.getBlocks).toHaveBeenCalledTimes(3);
	expect(heading.textContent).toContain('(51)');
	expect(list.lastElementChild.textContent).toContain('Page (2)');
	await go('transactions');
	expect(container.textContent).toContain('Indexed Confirmed Transactions(375)');
});

it.each(['overview', 'transactions', 'miners'])(
	'indexes in the background on %s Next before the final page, keeping cached navigation available',
	async (tab) => {
		vi.mocked(arweaveNodeApi.getBlocks).mockImplementation(async (_node, anchor, count) =>
			Array.from({ length: Math.min(anchor.height + 1, count) }, (_, index) => {
				const height = anchor.height - index;
				return nodeBlock(height, String(height).padStart(43, 'm'));
			})
		);
		await render();
		await click('Next');
		await click('Next');
		if (tab === 'overview') {
			await click('Previous');
			await click('Previous');
		} else await go(tab);
		expect(arweaveNodeApi.getBlocks).toHaveBeenCalledTimes(3);
		let fail: (error: Error) => void;
		let signal: AbortSignal;
		vi.mocked(arweaveNodeApi.getBlocks).mockImplementationOnce(
			(_node, _anchor, _count, requestSignal) =>
				new Promise((_resolve, reject) => {
					signal = requestSignal;
					fail = reject;
				})
		);
		await click('Next');
		expect(arweaveNodeApi.getBlocks).toHaveBeenLastCalledWith(
			NODE_URL,
			{ height: 25, hash: nodeBlock(25).hash },
			25,
			expect.any(AbortSignal),
			expect.any(Function)
		);
		const heading = [...container.querySelectorAll('p')].find((p) =>
			p.textContent.startsWith(
				tab === 'overview'
					? 'Block History'
					: tab === 'transactions'
					? 'Indexed Confirmed Transactions'
					: 'Indexed Mining Addresses'
			)
		);
		const list = heading.parentElement.parentElement.parentElement;
		expect(list.lastElementChild.textContent).toContain('Page (2)');
		const rows = () =>
			list.querySelectorAll(
				tab === 'overview'
					? '.block-list-element'
					: tab === 'transactions'
					? '.transaction-list-element'
					: '[role="rowgroup"] [role="row"]'
			);
		expect(rows()).toHaveLength(25);
		const secondPageText = [...rows()].map((row) => row.textContent);
		await click('Next');
		expect(list.lastElementChild.textContent).toContain('Page (3)');
		await click('Previous');
		expect(list.lastElementChild.textContent).toContain('Page (2)');
		expect([...rows()].map((row) => row.textContent)).toEqual(secondPageText);
		expect(arweaveNodeApi.getBlocks).toHaveBeenCalledTimes(4);
		expect(signal.aborted).toBe(false);
		await React.act(async () => fail(new ArweaveNodeError('timeout')));
		expect(list.lastElementChild.textContent).toContain('Page (2)');
		expect(rows()).toHaveLength(25);
		expect(container.querySelector('[role="alert"]')).not.toBeNull();
		await click('Next');
		expect(arweaveNodeApi.getBlocks).toHaveBeenCalledTimes(5);
		expect(container.querySelector('[role="alert"]')).toBeNull();
	}
);

it('continues indexing repeated miners after a failed read and stops at genesis', async () => {
	await render(true, 'miners');
	vi.mocked(arweaveNodeApi.getBlocks).mockRejectedValueOnce(new ArweaveNodeError('timeout'));
	await click('Next');
	expect(container.querySelector('[role="alert"]')).not.toBeNull();
	expect(container.textContent).toContain('76–100');
	expect(container.textContent).toContain('Indexed Mining Addresses(1)');
	await click('Next');
	expect(container.querySelector('[role="alert"]')).toBeNull();
	expect(container.textContent).toContain('51–100');
	expect(
		container.querySelector(`button[aria-label="View indexed blocks mined by ${MINER_ADDRESS}"]`).textContent
	).toBe('50');
	await click('Next');
	await click('Next');
	await click('Next');
	expect(container.textContent).toContain('0–100');
	expect(container.textContent).toContain('Indexed Mining Addresses(1)');
	expect(
		container.querySelector(`button[aria-label="View indexed blocks mined by ${MINER_ADDRESS}"]`).textContent
	).toBe('101');
	const table = container.querySelector('[role="table"]');
	const list = table.parentElement.parentElement;
	expect(list.lastElementChild.textContent).toContain('Page (1 of 1)');
	expect(
		[...list.querySelectorAll('button')]
			.filter((button) => button.textContent === 'Next')
			.every((button) => button.disabled)
	).toBe(true);
	expect(arweaveNodeApi.getBlocks).toHaveBeenCalledTimes(6);
});

it('uses Next to find miners in older blocks when the current filter has no matches', async () => {
	const olderMiner = 'b'.repeat(43);
	vi.mocked(arweaveNodeApi.getBlocks).mockImplementation(async (_node, anchor, count) =>
		Array.from({ length: Math.min(anchor.height + 1, count) }, (_, index) => {
			const height = anchor.height - index;
			return nodeBlock(height, height <= 75 ? olderMiner : MINER_ADDRESS);
		})
	);
	await render(true, 'miners');
	await click('Filter');
	const dialog = overlay.querySelector<HTMLElement>('[role="dialog"]');
	const input = dialog.querySelector<HTMLInputElement>('input');
	await React.act(async () => {
		Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, olderMiner);
		input.dispatchEvent(new Event('input', { bubbles: true }));
	});
	await React.act(async () =>
		dialog.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
	);
	expect(container.textContent).toContain('No indexed mining addresses match');
	await click('Next');
	expect(container.textContent).not.toContain('No indexed mining addresses match');
	expect(container.textContent).toContain('Indexed Mining Addresses(1)');
	expect(container.querySelector(`button[aria-label="View indexed blocks mined by ${olderMiner}"]`).textContent).toBe(
		'25'
	);
	expect(container.textContent).toContain('51–100');
	expect(arweaveNodeApi.getBlocks).toHaveBeenCalledTimes(2);
});

it('refreshes the node tip before reading blocks and retains the table if status refresh fails', async () => {
	await render();
	const tableRefresh = [...container.querySelectorAll('button')].find(
		(button) => button.textContent === 'Refresh' && !button.closest('[style*="display: none"]')
	);
	let finish: (info: typeof NODE_INFO) => void;
	vi.mocked(arweaveNodeApi.getInfo).mockReturnValueOnce(
		new Promise((resolve) => {
			finish = resolve;
		})
	);
	await React.act(async () => tableRefresh.click());
	expect(arweaveNodeApi.getBlocks).toHaveBeenCalledTimes(1);
	expect(container.querySelectorAll('.block-list-element')).toHaveLength(25);
	await React.act(async () => finish({ ...NODE_INFO, height: 101, hash: nodeBlock(101).hash }));
	expect(arweaveNodeApi.getBlocks).toHaveBeenLastCalledWith(
		NODE_URL,
		{ height: 101, hash: nodeBlock(101).hash },
		25,
		expect.any(AbortSignal),
		expect.any(Function)
	);
	expect(container.querySelector('.block-list-element a > p').textContent).toBe('101');
	vi.mocked(arweaveNodeApi.getInfo).mockRejectedValueOnce(new ArweaveNodeError('timeout'));
	await React.act(async () => tableRefresh.click());
	expect(container.querySelector('.block-list-element a > p').textContent).toBe('101');
	expect(container.querySelector('[role="alert"]').textContent).toContain('did not respond in time');
});

it('keeps an older block page in place during automatic tip refresh', async () => {
	vi.useFakeTimers();
	await render();
	await click('Next');
	vi.mocked(arweaveNodeApi.getInfo).mockResolvedValue({ ...NODE_INFO, height: 101, hash: nodeBlock(101).hash });
	await React.act(async () => vi.advanceTimersByTimeAsync(60_000));
	expect(container.querySelector('.block-list-element a > p').textContent).toBe('75');
	expect(container.querySelectorAll('.block-list-element')).toHaveLength(25);
});

it('shows per-miner rewards and expands indexed blocks beneath each miner without navigating away', async () => {
	const other = 'b'.repeat(43);
	vi.mocked(arweaveNodeApi.getBlocks).mockImplementation(async (_node, anchor, count) =>
		Array.from({ length: Math.min(anchor.height + 1, count) }, (_, i) => ({
			...nodeBlock(anchor.height - i, i % 2 ? other : MINER_ADDRESS),
			reward: i % 2 ? '2000000000000' : '1000000000000',
		}))
	);
	await render(true, 'miners');
	const table = container.querySelector('[role="table"]');
	expect([...table.querySelectorAll('[role="columnheader"]')].map((cell) => cell.textContent)).toEqual([
		'Wallet Address',
		'Balance',
		'Pending Rewards',
		'Total Rewards',
		'Blocks Mined',
		'Last Block Mined',
	]);
	const rows = table.querySelectorAll('[role="rowgroup"] [role="row"]');
	expect(rows[0].textContent).toContain('13.00 AR');
	expect(rows[1].textContent).toContain('24.00 AR');
	expect(rows[0].textContent).toContain('1.5 AR');
	await click(`View indexed blocks mined by ${MINER_ADDRESS}`);
	expect(currentPath).toBe(getArweaveNodeRoute(NODE_URL, 'miners'));
	expect(overlay.querySelector('[role="dialog"]')).toBeNull();
	const toggle = rows[0].querySelector<HTMLButtonElement>('button[aria-expanded]');
	expect(toggle.getAttribute('aria-expanded')).toBe('true');
	const details = rows[0].nextElementSibling;
	expect(details.querySelector('[role="region"]').id).toBe(toggle.getAttribute('aria-controls'));
	expect(details.querySelector('[role="cell"]').getAttribute('aria-colspan')).toBe('6');
	expect(details.querySelectorAll('.block-list-element')).toHaveLength(13);
	expect(
		[...details.querySelectorAll('.block-list-element')].map((row) => Number(row.querySelector('a > p').textContent))
	).toEqual(Array.from({ length: 13 }, (_, i) => 100 - i * 2));
	await click(`View indexed blocks mined by ${other}`);
	expect(rows[1].nextElementSibling.querySelectorAll('.block-list-element')).toHaveLength(12);
	expect(details.querySelectorAll('.block-list-element')).toHaveLength(13);
	expect(arweaveNodeApi.getBlocks).toHaveBeenCalledTimes(1);
	const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
	expect(result.violations).toEqual([]);
	await click(`Hide indexed blocks mined by ${MINER_ADDRESS}`);
	expect(toggle.getAttribute('aria-expanded')).toBe('false');
	expect(rows[0].nextElementSibling).toBe(rows[1]);
	expect(rows[1].nextElementSibling.querySelectorAll('.block-list-element')).toHaveLength(12);
	expect(document.activeElement.getAttribute('aria-label')).toBe(`View indexed blocks mined by ${MINER_ADDRESS}`);
});

it('shows all inline miner blocks with column headers, no table actions or pagination, and working block links', async () => {
	await render();
	await click('Next');
	await go('miners');
	await click(`View indexed blocks mined by ${MINER_ADDRESS}`);
	const details = container.querySelector('[role="region"]');
	const rows = details.querySelectorAll('.block-list-element');
	expect(rows).toHaveLength(50);
	expect(details.textContent).toContain('Height');
	expect(details.textContent).toContain('Block ID');
	expect(details.textContent).toContain('Previous Block');
	expect(details.textContent).not.toContain('Indexed Blocks Mined');
	expect(details.textContent).not.toContain('Page (');
	expect(details.querySelectorAll('button')).toHaveLength(0);
	expect(rows[0].querySelector('a > p').textContent).toBe('100');
	expect(arweaveNodeApi.getBlocks).toHaveBeenCalledTimes(2);
	const lastBlockLink = rows[49].querySelector<HTMLAnchorElement>('a');
	expect(lastBlockLink.getAttribute('href')).toBe(`#/explorer/${nodeBlock(51).hash}`);
	await React.act(async () => lastBlockLink.click());
	expect(currentPath).toBe(`/explorer/${nodeBlock(51).hash}`);
});

it('leaves unsupported pending rewards unavailable while showing balances and indexed totals', async () => {
	vi.mocked(arweaveNodeApi.getPendingRewards).mockResolvedValue(null);
	await render(true, 'miners');
	const cells = container.querySelectorAll('[role="rowgroup"] [role="cell"]');
	expect(cells[1].textContent).toContain('9,007.199254740993 AR');
	expect(cells[2].textContent).toBe('Unavailable');
	expect(cells[3].textContent).toBe('308,641.97 AR');
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
	expect(list.lastElementChild.textContent).toContain('Page (1)');
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
	expect(list.lastElementChild.textContent).toContain('Page (2)');
	expect(list.querySelectorAll('.transaction-list-element')).toHaveLength(25);
	expect(vi.mocked(arweaveNodeApi.getTransaction).mock.calls.every(([, id]) => !firstIds.has(id))).toBe(true);
	await go('miners');
	expect(signals.every((signal) => signal.aborted)).toBe(true);
});

it('loads older blocks from the confirmed transaction paginator, including ranges without transactions', async () => {
	vi.mocked(arweaveNodeApi.getBlocks).mockImplementation(async (_node, anchor, count) =>
		Array.from({ length: Math.min(anchor.height + 1, count) }, (_, index) => {
			const block = nodeBlock(anchor.height - index);
			return { ...block, transactions: block.height > 50 ? 0 : 5 };
		})
	);
	await render(true, 'transactions');
	expect(container.querySelectorAll('.transaction-list-element')).toHaveLength(0);
	await click('Next');
	expect(arweaveNodeApi.getBlocks).toHaveBeenLastCalledWith(
		NODE_URL,
		{ height: 75, hash: nodeBlock(75).hash },
		25,
		expect.any(AbortSignal),
		expect.any(Function)
	);
	expect(container.querySelectorAll('.transaction-list-element')).toHaveLength(0);
	await click('Next');
	expect(arweaveNodeApi.getBlocks).toHaveBeenLastCalledWith(
		NODE_URL,
		{ height: 50, hash: nodeBlock(50).hash },
		25,
		expect.any(AbortSignal),
		expect.any(Function)
	);
	expect(container.querySelectorAll('.transaction-list-element')).toHaveLength(25);
	expect(arweaveNodeApi.getBlockTransactionIds).toHaveBeenCalledTimes(5);
	expect(container.textContent).not.toContain('Continue Indexing');
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
