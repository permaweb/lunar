// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { AoReadError } from '../../../src/api/aoNetwork';
import type { ArweaveSchedulePage } from '../../../src/api/permaweb';
import { ProcessMessages } from '../../../src/features/Explorer/components/organisms/ProcessMessages';
import { URLS } from '../../../src/helpers/config';
import { darkTheme, theme } from '../../../src/helpers/themes';
import type { GQLNodeResponseType, TagType } from '../../../src/helpers/types';
import { MessageVariantEnum } from '../../../src/helpers/types';
import { MESSAGE_ID, PROCESS_ID, SENDER } from '../../fixtures/arweaveSchedule';

const mocks = vi.hoisted(() => ({
	read: vi.fn(),
	messages: vi.fn(),
	gql: vi.fn(),
	result: vi.fn(),
	remote: vi.fn(),
	download: vi.fn(),
	provider: { mainnetApi: null, legacyApi: null },
}));
vi.mock('providers/PermawebProvider', () => ({ usePermawebProvider: () => mocks.provider }));
vi.mock('components/molecules/MessageList', async (original) => {
	const module = await original<typeof import('../../../src/components/molecules/MessageList')>();
	return {
		...module,
		MessageList: (props) => {
			mocks.messages(props);
			return <module.MessageList {...props} />;
		},
	};
});
vi.mock('api/http', () => ({ requestRemote: mocks.remote }));
vi.mock('helpers/csv', async (original) => ({
	...(await original<typeof import('../../../src/helpers/csv')>()),
	downloadCsv: mocks.download,
}));
vi.mock('react-redux', () => ({ useDispatch: () => vi.fn() }));
vi.mock('components/molecules/Editor', () => ({ Editor: (props) => <pre>{props.initialData}</pre> }));
vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden={'true'} /> }));
vi.mock('store', () => ({ store: { getState: () => ({}) } }));
vi.mock('store/transactions/reducer', () => ({ selectTransaction: () => null }));

let root: ReturnType<typeof createRoot>;
let container: HTMLElement;
let overlay: HTMLElement;
let navigate: ReturnType<typeof useNavigate>;
const nativeTags = [{ name: 'Scheduler-Device', value: 'arweave-scheduler@1.0' }];

function page(latestSlot = 1, index = 0, processId = PROCESS_ID): ArweaveSchedulePage {
	const to = latestSlot - index * 25;
	const from = Math.max(0, to - 24);
	return {
		latestSlot,
		totalCount: latestSlot + 1,
		totalPages: Math.ceil((latestSlot + 1) / 25),
		page: index,
		messages: Array.from({ length: Math.max(0, to - from + 1) }, (_, offset) => ({
			id: to - offset === 0 ? processId : to - offset === 1 ? MESSAGE_ID : String(to - offset).padStart(43, 'm'),
			slot: to - offset,
			blockHeight: 1995397,
			blockIndex: 0,
			sender: SENDER,
			recipient: to - offset === 0 ? null : 'x'.repeat(43),
			action: to - offset === 0 ? null : 'make-offer',
			tags: [
				{ name: 'action', value: 'make-offer' },
				{ name: 'offer-quantity', value: '6000000000000000000' },
				{ name: 'Data-Protocol', value: 'ao' },
				{ name: 'Type', value: 'Message' },
			],
		})),
	};
}

function Harness(props: { tags: TagType[]; isActive: boolean; processId: string; pendingMetadata?: boolean }) {
	navigate = useNavigate();
	return (
		<ProcessMessages
			processId={props.processId}
			transaction={props.pendingMetadata ? null : ({ node: { tags: props.tags } } as GQLNodeResponseType)}
			isActive={props.isActive}
			onMessageOpen={vi.fn()}
		/>
	);
}

async function render(
	args: { tags?: TagType[]; isActive?: boolean; processId?: string; route?: string; pendingMetadata?: boolean } = {}
) {
	await React.act(async () =>
		root.render(
			<MemoryRouter initialEntries={[args.route ?? URLS.explorerMessages(PROCESS_ID)]}>
				<ThemeProvider theme={theme(darkTheme)}>
					<Harness
						tags={args.tags ?? nativeTags}
						isActive={args.isActive ?? true}
						processId={args.processId ?? PROCESS_ID}
						pendingMetadata={args.pendingMetadata}
					/>
				</ThemeProvider>
			</MemoryRouter>
		)
	);
}

async function click(label: string) {
	const button = [...container.querySelectorAll('button')].find((button) => button.textContent === label);
	expect(button).toBeDefined();
	expect(button.disabled).toBe(false);
	await React.act(async () => button.click());
}

beforeEach(() => {
	vi.resetAllMocks();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	Element.prototype.scrollIntoView = vi.fn();
	localStorage.clear();
	mocks.gql.mockResolvedValue({ data: [], count: 0, nextCursor: null, previousCursor: null });
	mocks.remote.mockResolvedValue(new Response(JSON.stringify({ slot: -1, edges: [] })));
	mocks.provider.legacyApi = { getGQLData: mocks.gql, ao: { result: mocks.result } };
	mocks.provider.mainnetApi = {
		readArweaveSchedulePage: mocks.read,
		readLatestSlot: vi.fn(async () => -1),
		ao: { result: mocks.result },
	};
	mocks.read.mockImplementation(async (args) => page(args.latestSlot ?? 1, args.page, args.processId));
	container = document.createElement('main');
	document.body.append(container);
	overlay = document.createElement('div');
	overlay.id = 'overlay';
	document.body.append(overlay);
	root = createRoot(container);
});

afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	overlay.remove();
	vi.unstubAllGlobals();
});

it('detects the scheduler without a Variant tag and renders native transaction, sender, recipient, and block links', async () => {
	await render();
	expect(mocks.gql).not.toHaveBeenCalled();
	expect(mocks.remote).not.toHaveBeenCalled();
	expect(mocks.messages).toHaveBeenLastCalledWith(
		expect.objectContaining({ source: expect.objectContaining({ canReadResults: false }) })
	);
	expect(container.textContent).toContain('Messages (2)');
	expect(container.textContent).toContain('Process creation');
	expect(container.textContent).toContain('make-offer');
	const rows = [...container.querySelectorAll('.message-list-element')];
	expect(rows).toHaveLength(2);
	expect(rows[0].textContent).toContain('Message (ao.N.1)');
	expect(rows[1].textContent).not.toContain('Transaction');
	expect(rows[0].querySelector('a').getAttribute('href')).toContain(MESSAGE_ID);
	expect(rows[1].querySelector('a').getAttribute('href')).toContain(PROCESS_ID);
	for (const id of [MESSAGE_ID, PROCESS_ID, SENDER, 'x'.repeat(43), '1995397']) {
		expect(container.querySelector(`a[href="#/explorer/${id}"]`)).not.toBeNull();
	}
	expect((await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })).violations).toEqual([]);
});

it.each([MessageVariantEnum.Mainnet, MessageVariantEnum.Legacynet])(
	'preserves the existing %s message view',
	async (variant) => {
		await render({ tags: [{ name: 'Variant', value: variant }] });
		expect(mocks.read).not.toHaveBeenCalled();
		expect(mocks.messages.mock.calls[0][0]).toMatchObject({ txId: PROCESS_ID, type: 'process', variant });
		expect(mocks.messages.mock.calls[0][0].source).toBeUndefined();
		expect(mocks.gql).toHaveBeenCalled();
	}
);

it('reads only when the process Messages tab is active', async () => {
	await render({ route: URLS.explorerInfo(PROCESS_ID) });
	expect(mocks.read).not.toHaveBeenCalled();
	await React.act(async () => navigate(URLS.explorerMessages(PROCESS_ID)));
	expect(mocks.read).toHaveBeenCalledOnce();
	await render({ isActive: false });
	expect(mocks.read).toHaveBeenCalledOnce();
	await render({ isActive: true });
	expect(mocks.read).toHaveBeenCalledOnce();
});

it('waits for restored process metadata without starting a legacy reader', async () => {
	await render({ pendingMetadata: true });
	expect(mocks.read).not.toHaveBeenCalled();
	expect(mocks.messages).not.toHaveBeenCalled();
	await render();
	expect(mocks.read).toHaveBeenCalledOnce();
	expect(mocks.gql).not.toHaveBeenCalled();
});

it('pins subsequent pages to the current snapshot and gets a new snapshot on refresh', async () => {
	mocks.read.mockImplementation(async (args) => page(args.latestSlot ?? 50, args.page));
	await render();
	await click('Next');
	expect(mocks.read).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, latestSlot: 50 }));
	await click('Next');
	expect(container.querySelectorAll('.message-list-element')).toHaveLength(1);
	expect(container.textContent).toContain('Process creation');
	await click('Previous');
	expect(mocks.read).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, latestSlot: 50 }));
	await click('Refresh');
	expect(mocks.read).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0, latestSlot: undefined }));
});

it('uses the existing Input panel with native tags and slot details, without fetching AO results or transaction data', async () => {
	await render();
	const outputButtons = [...container.querySelectorAll('button')].filter((button) => button.textContent === 'Output');
	expect(outputButtons).toHaveLength(2);
	expect(outputButtons.every((button) => button.disabled)).toBe(true);
	await click('Input');
	const dialog = document.querySelector('[role="dialog"]');
	expect(dialog).not.toBeNull();
	expect(dialog.textContent).toContain('Slot1');
	expect(dialog.textContent).toContain('Block Index0');
	expect(dialog.textContent).toContain('offer-quantity');
	expect(dialog.textContent).toContain('6000000000000000000');
	expect(dialog.textContent).toContain('No Data');
	expect(mocks.remote).not.toHaveBeenCalled();
	expect(mocks.gql).not.toHaveBeenCalled();
	expect(mocks.result).not.toHaveBeenCalled();
	const closeButton = [...dialog.querySelectorAll('button')].find((button) => button.textContent === 'Close');
	await React.act(async () => closeButton.click());
	expect(document.querySelector('[role="dialog"]')).toBeNull();
});

it('uses the shared CSV export with the current page and lossless tags', async () => {
	await render();
	await click('Download');
	expect(mocks.download).toHaveBeenCalledOnce();
	const [filename, rows] = mocks.download.mock.calls[0];
	expect(filename).toContain('page-1');
	expect(rows).toHaveLength(2);
	expect(rows[0]).toMatchObject({ id: MESSAGE_ID, owner: SENDER, block_height: 1995397 });
	expect(rows[0].tags).toContainEqual({ name: 'offer-quantity', value: '6000000000000000000' });
});

it('keeps pagination usable when a later page fails', async () => {
	mocks.read.mockImplementation(async (args) => page(args.latestSlot ?? 50, args.page));
	await render();
	mocks.read.mockRejectedValueOnce(new AoReadError('timeout'));
	await click('Next');
	expect(container.querySelector('[role="alert"]')).not.toBeNull();
	expect(container.textContent).toContain('Page (2 of 3)');
	await click('Previous');
	expect(mocks.read).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0, latestSlot: 50 }));
	expect(container.querySelectorAll('.message-list-element')).toHaveLength(25);
});

it('shows a retryable failure and retains known messages when refresh fails', async () => {
	mocks.read.mockRejectedValueOnce(new AoReadError('unavailable'));
	await render();
	expect(container.querySelector('[role="alert"]')?.textContent).toContain('Unable to load scheduled messages');
	expect(container.textContent).not.toContain('No confirmed messages');
	await click('Retry');
	expect(container.textContent).toContain('make-offer');
	mocks.read.mockRejectedValueOnce(new AoReadError('timeout'));
	await click('Refresh');
	expect(container.querySelector('[role="alert"]')?.textContent).toContain('Showing the previous messages');
	expect(container.textContent).toContain('make-offer');
});

it('shows an empty confirmed schedule distinctly from failure', async () => {
	mocks.read.mockResolvedValue(page(-1));
	await render();
	expect(container.textContent).toContain('Messages (0)');
	expect(container.textContent).toContain('No confirmed messages have been scheduled yet');
	expect(container.querySelector('[role="alert"]')).toBeNull();
});

it('aborts a previous network read and ignores its late completion after settings change', async () => {
	let finish: (value: ArweaveSchedulePage) => void;
	mocks.read.mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			})
	);
	await render();
	expect(container.querySelector('[role="status"]')?.textContent).toContain('Loading scheduled messages');
	const signal = mocks.read.mock.calls[0][0].signal;
	const replacement = vi.fn(async () => page(-1));
	mocks.provider.mainnetApi = { readArweaveSchedulePage: replacement };
	await render();
	expect(signal.aborted).toBe(true);
	expect(replacement).toHaveBeenCalledWith(expect.objectContaining({ page: 0, latestSlot: undefined }));
	await React.act(async () => finish(page(50)));
	expect(container.textContent).toContain('Messages (0)');
	expect(container.textContent).not.toContain('make-offer');
});

it('clears the prior process snapshot when the process changes', async () => {
	await render();
	const newId = 'n'.repeat(43);
	await render({ processId: newId });
	await React.act(async () => navigate(URLS.explorerMessages(newId)));
	expect(mocks.read).toHaveBeenLastCalledWith(
		expect.objectContaining({ processId: newId, page: 0, latestSlot: undefined })
	);
	expect(container.querySelector(`a[href="#/explorer/${PROCESS_ID}"]`)).toBeNull();
});
