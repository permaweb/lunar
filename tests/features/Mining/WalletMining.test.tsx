// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { arweaveNodeApi, getCachedNodeHistories } from '../../../src/api/arweaveNode';
import { useWalletMining, WalletMining, WalletMiningInfo, WalletMiningTabs } from '../../../src/features/Mining';
import { darkTheme, theme } from '../../../src/helpers/themes';
import { MINER_ADDRESS, NODE_INFO, NODE_URL, nodeBlock } from '../../fixtures/arweaveNode';

vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden={'true'} /> }));
vi.mock('react-redux', () => ({ useDispatch: () => vi.fn(), useSelector: () => null }));
vi.mock('store', () => ({ store: { getState: () => ({}) } }));
vi.mock('store/transactions/reducer', () => ({ selectTransaction: () => null }));
vi.mock('api/arweaveNode', async () => ({
	...(await vi.importActual('../../../src/api/arweaveNode')),
	arweaveNodeApi: { getPendingRewards: vi.fn() },
	getCachedNodeHistories: vi.fn(),
}));
function Harness(props: { isActive: boolean; address?: string; tabs?: boolean }) {
	const address = props.address ?? MINER_ADDRESS;
	const mining = useWalletMining(address, props.isActive);
	const navigate = useNavigate();
	return (
		<>
			{mining.isMiner && (
				<>
					<WalletMiningInfo updatedAt={mining.history?.savedAt} isActive={props.isActive} />
					{props.tabs ? (
						<WalletMiningTabs
							key={address}
							address={address}
							mining={mining}
							isActive={props.isActive}
							transactions={<TransactionStub />}
						/>
					) : (
						<WalletMining address={address} mining={mining} />
					)}
					<button onClick={mining.refresh}>Refresh mining</button>
					{props.tabs && <button onClick={() => navigate('/explorer/another-wallet')}>Other wallet</button>}
				</>
			)}
		</>
	);
}
const transactionMounted = vi.fn();
function TransactionStub() {
	React.useEffect(() => {
		transactionMounted();
	}, []);
	return <div>Wallet transaction table</div>;
}
let overlay: HTMLElement;
let container: HTMLElement;
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
	vi.resetAllMocks();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.mocked(getCachedNodeHistories).mockResolvedValue([]);
	vi.mocked(arweaveNodeApi.getPendingRewards).mockResolvedValue('0');
	container = document.createElement('main');
	overlay = document.createElement('div');
	overlay.id = 'overlay';
	document.body.append(container, overlay);
	root = createRoot(container);
});
afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	overlay.remove();
	vi.unstubAllGlobals();
});
async function render(isActive = true, address = MINER_ADDRESS, tabs = false) {
	await React.act(async () =>
		root.render(
			<MemoryRouter initialEntries={[`/explorer/${address}`]}>
				<ThemeProvider theme={theme(darkTheme)}>
					<Harness isActive={isActive} address={address} tabs={tabs} />
				</ThemeProvider>
			</MemoryRouter>
		)
	);
}
it('detects an indexed miner and shows scoped rewards, coverage and clickable blocks', async () => {
	vi.mocked(getCachedNodeHistories).mockResolvedValue([
		{ node: NODE_URL, network: NODE_INFO.network, savedAt: 1700000000000, blocks: [nodeBlock(100), nodeBlock(99)] },
	]);
	vi.mocked(arweaveNodeApi.getPendingRewards).mockResolvedValue('1234567890123');
	await render();
	expect(container.textContent).toContain('Mining');
	expect(container.textContent).toContain('Indexed Total Rewards');
	expect(container.textContent).toContain('1.234567890123 AR');
	expect(container.textContent).toContain('99–100');
	expect(container.textContent).toContain('Last Block Mined');
	expect(container.querySelectorAll('a[href*="/explorer/"]').length).toBeGreaterThan(2);
	expect(arweaveNodeApi.getPendingRewards).toHaveBeenCalledWith(NODE_URL, MINER_ADDRESS, expect.any(AbortSignal));
});
it('detects mining from live reserved rewards when the address has no cached blocks', async () => {
	vi.mocked(arweaveNodeApi.getPendingRewards).mockResolvedValue('1000000000000');
	await render();
	expect(container.textContent).toContain('Mining');
	expect(container.textContent).toContain('1 AR');
	expect(container.textContent).toContain('No blocks for this miner');
});
it('does not identify normal wallets, unsupported responses, or failed lookups as miners', async () => {
	await render();
	expect(container.textContent).toBe('');
	await React.act(async () => root.unmount());
	root = createRoot(container);
	vi.mocked(arweaveNodeApi.getPendingRewards).mockRejectedValue(new Error('Offline'));
	await render();
	expect(container.textContent).toBe('');
});
it('does not start background requests for hidden wallet tabs', async () => {
	await render(false);
	expect(arweaveNodeApi.getPendingRewards).not.toHaveBeenCalled();
	expect(getCachedNodeHistories).not.toHaveBeenCalled();
});

function button(label: string) {
	return [...container.querySelectorAll('button')].find(
		(element) => element.textContent === label || element.getAttribute('aria-label') === label
	)!;
}
it('puts the reporting node in the grid and keeps scope and update time in the information panel', async () => {
	vi.mocked(getCachedNodeHistories).mockResolvedValue([
		{ node: NODE_URL, network: NODE_INFO.network, savedAt: 1700000000000, blocks: [nodeBlock(100)] },
	]);
	await render();
	expect(container.textContent).toContain('Reporting Node');
	expect(container.textContent).not.toContain('All-time mining totals');
	expect(container.textContent).not.toContain('Index Updated');
	await React.act(async () => button('Miner Information').click());
	expect(overlay.textContent).toContain('All-time mining totals are unavailable.');
	expect(overlay.textContent).toContain('Index Updated:');
});
it('preserves miner identity during a refresh or lookup failure, without leaking it to another address', async () => {
	vi.mocked(arweaveNodeApi.getPendingRewards).mockResolvedValue('1000000000000');
	await render();
	let fail: (error: Error) => void;
	vi.mocked(arweaveNodeApi.getPendingRewards).mockImplementation(
		() =>
			new Promise((_resolve, reject) => {
				fail = reject;
			})
	);
	await React.act(async () => button('Refresh mining').click());
	expect(container.textContent).toContain('Mining');
	expect(container.textContent).toContain('Loading...');
	await React.act(async () => fail(new Error('Offline')));
	expect(container.textContent).toContain('Mining');
	vi.mocked(arweaveNodeApi.getPendingRewards).mockResolvedValue('0');
	await render(true, 'b'.repeat(43));
	expect(container.textContent).toBe('');
});
it('defaults to Mining, opens transactions on demand, and retains their state across tab changes', async () => {
	vi.mocked(getCachedNodeHistories).mockResolvedValue([
		{ node: NODE_URL, network: NODE_INFO.network, savedAt: 1700000000000, blocks: [nodeBlock(100)] },
	]);
	await render(true, MINER_ADDRESS, true);
	expect(transactionMounted).not.toHaveBeenCalled();
	await React.act(async () => button('Transactions').click());
	expect(transactionMounted).toHaveBeenCalledTimes(1);
	expect(container.textContent).toContain('Wallet transaction table');
	await React.act(async () => button('Mining').click());
	await React.act(async () => button('Transactions').click());
	await React.act(async () => button('Refresh mining').click());
	expect(transactionMounted).toHaveBeenCalledTimes(1);
	await React.act(async () => button('Other wallet').click());
	const transactionTable = [...container.querySelectorAll('div')].find(
		(element) => element.textContent === 'Wallet transaction table' && element.childElementCount === 0
	);
	expect(transactionTable.parentElement.style.display).toBe('block');
});
