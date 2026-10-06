// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestRemote } from '../../../../src/api/http';
import { lookupTransaction } from '../../../../src/api/transactions';
import { Transaction } from '../../../../src/components/organisms/Transaction';
import { darkTheme, theme } from '../../../../src/helpers/themes';
import type { GQLNodeResponseType, TagType, TransactionType } from '../../../../src/helpers/types';
import { MessageVariantEnum } from '../../../../src/helpers/types';
import {
	BUNDLE_HEADERS,
	BUNDLE_ID,
	EMPTY_TRANSFER_HEADERS,
	EMPTY_TRANSFER_ID,
	HYPERBUDDY_HTML,
	PORTAL_RELEASE_DATA,
	PORTAL_RELEASE_HEADERS,
	PORTAL_RELEASE_ID,
	TOKEN_PROCESS_ID,
} from '../../../fixtures/transactionData';

const mocks = vi.hoisted(() => ({
	lookup: vi.fn(),
	dispatch: vi.fn(),
	legacyApi: { getGQLData: vi.fn() },
	balance: vi.fn(),
	arBalance: vi.fn(),
	showTabContent: false,
	activeTab: 'Overview',
	tabLabels: [] as string[],
}));
vi.mock('helpers/search', () => ({ searchTxById: mocks.lookup }));
vi.mock('api/balances', () => ({ readAoBalance: mocks.balance, readArBalance: mocks.arBalance }));
vi.mock('react-redux', () => ({ useDispatch: () => mocks.dispatch }));
vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden={'true'} /> }));
vi.mock('store', () => ({ store: { getState: () => ({ transactions: {} }) } }));
vi.mock('providers/PermawebProvider', () => ({ usePermawebProvider: () => ({ legacyApi: mocks.legacyApi }) }));
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
	URLTabs: (props: { tabs: { view?: React.ComponentType; content?: React.ReactNode; label: string }[] }) => {
		mocks.tabLabels = props.tabs.map((tab) => tab.label);
		const tab = props.tabs.find((tab) => tab.label === mocks.activeTab) ?? props.tabs[0];
		const View = tab.view;
		return mocks.showTabContent ? View ? <View /> : tab.content : null;
	},
}));
vi.mock('components/molecules/Editor', () => ({
	Editor: (props: { initialData: string }) => <pre data-testid={'editor'}>{props.initialData}</pre>,
}));
vi.mock('components/molecules/MessageList', () => ({
	MessageList: (props: { header: string }) => <div data-testid="message-list">{props.header}</div>,
}));
vi.mock('components/molecules/MessageResult', () => ({
	MessageResult: () => <div data-testid="message-result" />,
}));
vi.mock('components/molecules/ProcessRead', () => ({ ProcessRead: () => null }));
vi.mock('components/molecules/HTMLViewer', () => ({
	HTMLViewer: (props: { html: string }) => <iframe title={'html-viewer'} srcDoc={props.html} />,
}));
vi.mock('components/molecules/ExplorerControls', async (original) => ({
	...(await original<typeof import('../../../../src/components/molecules/ExplorerControls')>()),
	ExplorerControls: (props) => (
		<>
			{props.actions}
			{props.info}
		</>
	),
}));

const processId = 'hmW7EXCHRzfC6YAE8FKInptdS8-6BOl3fxjZfxmAOpY';
let container: HTMLElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
	vi.clearAllMocks();
	mocks.showTabContent = false;
	mocks.activeTab = 'Overview';
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

async function render(
	type: TransactionType = 'process',
	txId = processId,
	inspector?: React.ComponentProps<typeof Transaction>['inspector']
) {
	await React.act(async () =>
		root.render(
			<MemoryRouter>
				<ThemeProvider theme={theme(darkTheme)}>
					<Transaction
						txId={txId}
						type={type}
						active
						onMessageOpen={vi.fn()}
						processMessagesView={() => null}
						inspector={inspector}
					/>
				</ThemeProvider>
			</MemoryRouter>
		)
	);
}

function transaction(tags: TagType[]): GQLNodeResponseType {
	return { cursor: null, node: { id: processId, tags, owner: { address: 'a'.repeat(43) }, data: null, block: null } };
}

it('populates the bundle table by resolving each linked ID from its tags', async () => {
	mocks.showTabContent = true;
	const linkedIds = ['uX2tJrIgBgDTGvSU30Q16-TVZU1J3NXpflyDtu0kA5c', 'R39lRKpiIOzyggzGPttRhGMmVx_5AMbkupORp-XGnR0'];
	const bundle = transaction([
		{ name: 'Bundle-Format', value: 'binary' },
		{ name: 'Bundle-Version', value: '2.0.0' },
		{ name: '2+link', value: linkedIds[1] },
		{ name: '1+link', value: linkedIds[0] },
	]);
	mocks.lookup.mockImplementation(async ({ txId }) =>
		txId === processId
			? bundle
			: {
					...transaction([{ name: 'Type', value: 'Message' }]),
					node: { ...transaction([{ name: 'Type', value: 'Message' }]).node, id: txId },
			  }
	);
	const fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);

	await render('bundle');

	const rows = [...container.querySelectorAll('.transaction-list-element')];
	expect(rows).toHaveLength(2);
	for (const [index, id] of linkedIds.entries()) {
		expect(rows[index].getAttribute('aria-label')).toContain(id);
		expect(rows[index].textContent).toContain('Message');
		expect(mocks.lookup).toHaveBeenCalledWith(expect.objectContaining({ txId: id }));
	}
	expect(fetchMock).not.toHaveBeenCalled();
});

it('opens the bundle overview and contents from a generic explorer link with signature-only bundle metadata', async () => {
	mocks.showTabContent = true;
	vi.mocked(requestRemote).mockResolvedValue(new Response(HYPERBUDDY_HTML, { headers: BUNDLE_HEADERS }));
	mocks.lookup.mockImplementation((args: { txId: string }) =>
		args.txId === BUNDLE_ID
			? lookupTransaction(args.txId)
			: { ...transaction([]), node: { ...transaction([]).node, id: args.txId } }
	);
	const fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);

	await render('transaction', BUNDLE_ID);

	expect(container.textContent).toContain('Bundle Overview');
	expect(container.textContent).toContain('bundle-formatbinary');
	expect(container.textContent).toContain('bundle-version2.0.0');
	expect(container.querySelector('aside[aria-label="Transaction"]')).toBeNull();
	const rows = [...container.querySelectorAll('.transaction-list-element')];
	expect(rows).toHaveLength(1);
	expect(rows[0].getAttribute('aria-label')).toContain(BUNDLE_HEADERS['1+link']);
	expect(fetchMock).not.toHaveBeenCalled();
});

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
		mocks.showTabContent = true;
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

	it('renders the portal release JSON from a gateway signature covering its original data field', async () => {
		vi.mocked(requestRemote).mockImplementation(async (url) =>
			url === `https://arweave.net/${PORTAL_RELEASE_ID}`
				? new Response(PORTAL_RELEASE_DATA, { headers: PORTAL_RELEASE_HEADERS })
				: new Response(null, { status: 404 })
		);
		mocks.lookup.mockImplementation(({ txId }: { txId: string }) => lookupTransaction(txId));

		await render('transaction', PORTAL_RELEASE_ID);

		expect(container.textContent).toContain('schemaVersion');
		expect(container.textContent).toContain('2.1.0');
		expect(container.textContent).toContain('portal-release');
		expect(container.textContent).toContain('patches');
		expect(container.textContent).not.toContain('No Data');
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
		const headings = [...container.querySelectorAll('p, [role="tab"]')];

		return titles.map((title) => headings.findIndex((heading) => heading.textContent === title));
	}

	beforeEach(() => {
		mocks.showTabContent = true;
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

		const [process, overview] = getSectionOrder('AO Process', 'Transaction');

		expect(process).toBeGreaterThanOrEqual(0);
		expect(process).toBeLessThan(overview);
		expect(container.textContent).toContain('Scheduler Type: arweave-scheduler@1.0');
	});

	it('puts process tags and transaction details in one locally tabbed region', async () => {
		mocks.lookup.mockResolvedValue(
			node(TOKEN_PROCESS_ID, [
				{ name: 'Type', value: 'Process' },
				{ name: 'Name', value: 'AO Test Token' },
			])
		);
		await render('process', TOKEN_PROCESS_ID);
		const panel = container.querySelector('aside[aria-label="Transaction"]');
		expect(panel).not.toBeNull();
		const tabs = [...panel.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
		expect(tabs.map((tab) => tab.textContent)).toEqual(['Tags', 'Transaction']);
		expect(tabs[0].getAttribute('aria-selected')).toBe('true');
		expect(panel.querySelector('[role="tabpanel"]:not([hidden])').textContent).toContain('AO Test Token');
		expect(panel.querySelector('[role="tabpanel"]:not([hidden])').textContent).toContain('Owner');
		const requests = vi.mocked(requestRemote).mock.calls.length;
		await React.act(async () => tabs[1].click());
		expect(panel.querySelector('[role="tabpanel"]:not([hidden])').textContent).toContain('Confirmations');
		expect(vi.mocked(requestRemote).mock.calls).toHaveLength(requests);
		expect(container.querySelector('aside section')).not.toBeNull();
		expect(container.querySelectorAll('section[aria-label="Tags"]')).toHaveLength(1);
	});

	it('shows the process details sidebar only in Overview', async () => {
		mocks.lookup.mockResolvedValue(node(TOKEN_PROCESS_ID, [{ name: 'Type', value: 'Process' }]));
		await render('process', TOKEN_PROCESS_ID);
		expect(container.querySelector('aside[aria-label="Transaction"]')).not.toBeNull();

		mocks.activeTab = 'Messages';
		await render('process', TOKEN_PROCESS_ID);
		expect(container.querySelector('aside[aria-label="Transaction"]')).toBeNull();

		mocks.activeTab = 'Overview';
		await render('process', TOKEN_PROCESS_ID);
		expect(container.querySelector('aside[aria-label="Transaction"]')).not.toBeNull();
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

		const [transfer, messageInfo] = getSectionOrder('Token Transfer', 'Message Info');

		expect(transfer).toBeGreaterThanOrEqual(0);
		expect(transfer).toBeLessThan(messageInfo);
		expect(container.textContent).not.toContain('AO Process');
		const panel = container.querySelector('aside[aria-label="Transaction"]');
		expect(panel).not.toBeNull();
		expect([...panel.querySelectorAll('[role="tab"]')].map((tab) => tab.textContent)).toEqual(['Transaction']);
		expect(panel.textContent).toContain('Confirmations');
		const layout = panel.parentElement;
		const main = layout.firstElementChild;
		expect(main.textContent).toContain('Token Transfer');
		expect(main.textContent).toContain('Message Info');
		expect(main.querySelector('[data-testid="message-result"]')).not.toBeNull();
		expect([...main.querySelectorAll('p')].some((element) => element.textContent === 'Transaction')).toBe(false);
		const resultingMessages = container.querySelector('[data-testid="message-list"]');
		expect(layout.contains(resultingMessages)).toBe(false);
		expect(layout.nextElementSibling).toBe(resultingMessages.parentElement);
		expect(resultingMessages.textContent).toBe('Resulting Messages');
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

		const [transfer, overview] = getSectionOrder('Token Transfer', 'Transaction');

		expect(transfer).toBeGreaterThanOrEqual(0);
		expect(transfer).toBeLessThan(overview);
	});
});

it('keeps the inspector visible for an AO ID without indexed transaction data', async () => {
	mocks.lookup.mockResolvedValue(null);
	mocks.showTabContent = true;
	await render('transaction', processId, {
		id: processId,
		label: 'AO Core Info',
		url: `/explorer/${processId}/ao-core`,
		content: <p>AO details</p>,
		fallback: <p data-testid="unindexed">No indexed transaction</p>,
		actions: <span data-testid="inspector-action">Message info</span>,
	});
	expect(mocks.tabLabels).toEqual(['Overview', 'AO Core Info']);
	const notice = container.querySelector('[data-testid="unindexed"]');
	expect(notice).not.toBeNull();
	expect((notice.parentElement as HTMLElement).style.display).toBe('block');
	const action = container.querySelector('[data-testid="inspector-action"]');
	expect(action).not.toBeNull();
	expect(getComputedStyle(action.parentElement).borderLeftWidth).toBe('1px');
});

it('inserts AO Core Info after Overview while preserving process tabs', async () => {
	mocks.lookup.mockResolvedValue(transaction([{ name: 'device', value: 'process@1.0' }]));
	await render('process', processId, {
		id: processId,
		label: 'AO Core Info',
		url: `/explorer/${processId}/ao-core`,
		content: <p>AO details</p>,
		fallback: null,
	});
	expect(mocks.tabLabels.slice(0, 3)).toEqual(['Overview', 'AO Core Info', 'Messages']);
	expect(mocks.tabLabels).toEqual(expect.arrayContaining(['Read', 'Write', 'Data', 'Source']));
});
