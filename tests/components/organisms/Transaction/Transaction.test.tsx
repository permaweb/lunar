// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestRemote } from '../../../../src/api/http';
import { Transaction } from '../../../../src/components/organisms/Transaction';
import { darkTheme, theme } from '../../../../src/helpers/themes';
import type { GQLNodeResponseType, TagType, TransactionType } from '../../../../src/helpers/types';
import { MessageVariantEnum } from '../../../../src/helpers/types';
import {
	EMPTY_TRANSFER_HEADERS,
	EMPTY_TRANSFER_ID,
	HYPERBUDDY_HTML,
	TOKEN_PROCESS_ID,
} from '../../../fixtures/transactionData';

const mocks = vi.hoisted(() => ({ lookup: vi.fn(), balance: vi.fn(), arBalance: vi.fn(), showFirstTab: false }));
vi.mock('helpers/search', () => ({ searchTxById: mocks.lookup }));
vi.mock('api/balances', () => ({ readAoBalance: mocks.balance, readArBalance: mocks.arBalance }));
vi.mock('react-redux', () => ({ useDispatch: () => vi.fn() }));
vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden={'true'} /> }));
vi.mock('store', () => ({ store: { getState: () => ({ transactions: {} }) } }));
vi.mock('providers/PermawebProvider', () => ({ usePermawebProvider: () => ({ legacyApi: {} }) }));
vi.mock('providers/ArweaveProvider', () => ({ useArweaveProvider: () => ({ walletAddress: null }) }));
vi.mock('providers/NotificationProvider', () => ({ useNotifications: () => ({ addNotification: vi.fn() }) }));
vi.mock('features/Mining', () => ({ useWalletMining: () => ({ isMiner: false }) }));
vi.mock('api/http', () => ({ requestRemote: vi.fn() }));
vi.mock('api/blocks', async (original) => ({
	...(await original<typeof import('../../../../src/api/blocks')>()),
	getCurrentBlockHeight: vi.fn().mockResolvedValue(null),
	getTransactionById: vi.fn().mockResolvedValue(null),
}));
vi.mock('components/atoms/URLTabs', () => ({
	URLTabs: (props: { tabs: { view: React.ComponentType }[] }) => {
		const View = props.tabs[0].view;
		return mocks.showFirstTab ? <View /> : null;
	},
}));
vi.mock('components/molecules/Editor', () => ({
	Editor: (props: { initialData: string }) => <pre data-testid={'editor'}>{props.initialData}</pre>,
}));
vi.mock('components/molecules/MessageList', () => ({ MessageList: () => null }));
vi.mock('components/molecules/MessageResult', () => ({ MessageResult: () => null }));
vi.mock('components/molecules/ProcessRead', () => ({ ProcessRead: () => null }));
vi.mock('components/molecules/HTMLViewer', () => ({
	HTMLViewer: (props: { html: string }) => <iframe title={'html-viewer'} srcDoc={props.html} />,
}));
vi.mock('components/molecules/ExplorerControls', async (original) => ({
	...(await original<typeof import('../../../../src/components/molecules/ExplorerControls')>()),
	ExplorerControls: (props) => <>{props.info}</>,
}));

const processId = 'hmW7EXCHRzfC6YAE8FKInptdS8-6BOl3fxjZfxmAOpY';
let container: HTMLElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
	vi.clearAllMocks();
	mocks.showFirstTab = false;
	vi.mocked(requestRemote).mockResolvedValue(new Response(null, { status: 404 }));
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	mocks.balance.mockResolvedValue('0');
	mocks.arBalance.mockResolvedValue('0');
	container = document.createElement('main');
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

async function render(type: TransactionType = 'process', txId = processId) {
	await React.act(async () =>
		root.render(
			<MemoryRouter>
				<ThemeProvider theme={theme(darkTheme)}>
					<Transaction txId={txId} type={type} active onMessageOpen={vi.fn()} processMessagesView={() => null} />
				</ThemeProvider>
			</MemoryRouter>
		)
	);
}

function transaction(tags: TagType[]): GQLNodeResponseType {
	return { cursor: null, node: { id: processId, tags, owner: { address: 'a'.repeat(43) }, data: null, block: null } };
}

it.each([
	{
		tags: [
			{ name: 'device', value: 'process@1.0' },
			{ name: 'scheduler-device', value: 'arweave-scheduler@1.0' },
		],
	},
	{
		tags: [
			{ name: 'Type', value: 'Process' },
			{ name: 'Variant', value: MessageVariantEnum.Mainnet },
		],
	},
])('does not automatically dry-run the AO token balance for mainnet metadata $tags', async ({ tags }) => {
	let resolve: (value: GQLNodeResponseType) => void;
	mocks.lookup.mockReturnValue(
		new Promise<GQLNodeResponseType>((done) => {
			resolve = done;
		})
	);
	await render();
	expect(mocks.balance).not.toHaveBeenCalled();
	await React.act(async () => resolve(transaction(tags)));
	expect(container.textContent).toContain('Process');
	expect(mocks.balance).not.toHaveBeenCalled();
});

it.each(['process', 'wallet'] as const)('keeps AO balance reads for a legacy %s', async (type) => {
	mocks.lookup.mockResolvedValue(
		transaction([
			{ name: 'Type', value: type },
			{ name: 'Variant', value: MessageVariantEnum.Legacynet },
		])
	);
	await render(type);
	expect(mocks.balance).toHaveBeenCalledWith(processId);
	if (type === 'wallet') expect(mocks.arBalance).toHaveBeenCalledWith(processId);
});

describe('transaction data', () => {
	const transferTags = [
		{ name: 'action', value: 'transfer' },
		{ name: 'recipient', value: 'n6QjVXFWUMHUIgNL6E7tEAHGGbKc2jFwW4bU-LYNbDU' },
		{ name: 'quantity', value: '1000000000000' },
	];

	function emptyTransfer(data: { size?: string; type?: string }) {
		return {
			cursor: null,
			node: {
				id: EMPTY_TRANSFER_ID,
				recipient: TOKEN_PROCESS_ID,
				tags: transferTags,
				data,
				owner: { address: 'a'.repeat(43) },
				block: { height: 2006276, timestamp: 1790089844 },
			},
		} as GQLNodeResponseType;
	}

	function getDataRequests() {
		return vi.mocked(requestRemote).mock.calls.filter(([url]) => url === `https://arweave.net/${EMPTY_TRANSFER_ID}`);
	}

	beforeEach(() => {
		mocks.showFirstTab = true;
		vi.mocked(requestRemote).mockImplementation(async (url) =>
			url === `https://arweave.net/${EMPTY_TRANSFER_ID}`
				? new Response(HYPERBUDDY_HTML, { headers: EMPTY_TRANSFER_HEADERS })
				: new Response(null, { status: 404 })
		);
	});

	it('renders a 0-byte transaction as empty without requesting its data', async () => {
		mocks.lookup.mockResolvedValue(emptyTransfer({ size: '0' }));
		await render('transaction', EMPTY_TRANSFER_ID);

		expect(container.querySelector('[data-testid="editor"]')?.textContent).toBe('No Data');
		expect(container.querySelector('iframe')).toBeNull();
		expect(container.innerHTML).not.toContain('Hyperbuddy');
		expect(getDataRequests()).toHaveLength(0);
	});

	it('does not render the node web UI when a cached lookup kept its content type', async () => {
		mocks.lookup.mockResolvedValue(emptyTransfer({ type: 'text/html' }));
		await render('transaction', EMPTY_TRANSFER_ID);

		expect(getDataRequests().length).toBeGreaterThan(0);
		expect(container.querySelector('[data-testid="editor"]')?.textContent).toBe('No Data');
		expect(container.querySelector('iframe')).toBeNull();
		expect(container.innerHTML).not.toContain('Hyperbuddy');
	});
});

describe('section order', () => {
	const owner = 'wCSXTL1g1Entfpv5iyPNHxJlk9N6MfhYve2reKFJWTg';

	function node(id: string, tags: TagType[], recipient?: string): GQLNodeResponseType {
		return {
			cursor: null,
			node: { id, recipient, tags, owner: { address: owner }, data: null, block: { height: 2006276, timestamp: 1 } },
		} as GQLNodeResponseType;
	}

	function getSectionOrder(...titles: string[]) {
		const text = container.textContent ?? '';

		return titles.map((title) => text.indexOf(title));
	}

	beforeEach(() => {
		mocks.showFirstTab = true;
	});

	it('leads a process page with its AO Process summary', async () => {
		mocks.lookup.mockResolvedValue(
			node(TOKEN_PROCESS_ID, [
				{ name: 'device', value: 'process@1.0' },
				{ name: 'name', value: 'AO Test Token' },
				{ name: 'scheduler-device', value: 'arweave-scheduler@1.0' },
				{ name: 'type', value: 'Process' },
			])
		);
		await render('process', TOKEN_PROCESS_ID);

		const [process, overview] = getSectionOrder('AO Process', 'Transaction Overview');

		expect(process).toBeGreaterThanOrEqual(0);
		expect(process).toBeLessThan(overview);
		expect(container.textContent).toContain('Scheduler Type: arweave-scheduler@1.0');
	});

	it('leads an AO transfer message with its token transfer', async () => {
		mocks.lookup.mockResolvedValue(
			node(
				processId,
				[
					{ name: 'Type', value: 'Message' },
					{ name: 'Variant', value: MessageVariantEnum.Legacynet },
					{ name: 'Action', value: 'Transfer' },
					{ name: 'Recipient', value: 'n6QjVXFWUMHUIgNL6E7tEAHGGbKc2jFwW4bU-LYNbDU' },
					{ name: 'Quantity', value: '1000000000000' },
				],
				TOKEN_PROCESS_ID
			)
		);
		await render('message');

		const [transfer, overview, messageInfo] = getSectionOrder('Token Transfer', 'Transaction Overview', 'Message Info');

		expect(transfer).toBeGreaterThanOrEqual(0);
		expect(transfer).toBeLessThan(overview);
		expect(overview).toBeLessThan(messageInfo);
		expect(container.textContent).not.toContain('AO Process');
	});

	it('leads an L1 token transfer with its token transfer', async () => {
		mocks.lookup.mockResolvedValue(
			node(
				EMPTY_TRANSFER_ID,
				[
					{ name: 'action', value: 'transfer' },
					{ name: 'recipient', value: 'n6QjVXFWUMHUIgNL6E7tEAHGGbKc2jFwW4bU-LYNbDU' },
					{ name: 'quantity', value: '1000000000000' },
				],
				TOKEN_PROCESS_ID
			)
		);
		await render('transaction', EMPTY_TRANSFER_ID);

		const [transfer, overview] = getSectionOrder('Token Transfer', 'Transaction Overview');

		expect(transfer).toBeGreaterThanOrEqual(0);
		expect(transfer).toBeLessThan(overview);
	});
});
