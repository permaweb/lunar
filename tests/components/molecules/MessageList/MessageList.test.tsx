// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { MessageList } from '../../../../src/components/molecules/MessageList';
import type { MessageListEntry } from '../../../../src/components/molecules/MessageList/types';
import { FLAGS, STORAGE } from '../../../../src/helpers/config';
import { darkTheme, theme } from '../../../../src/helpers/themes';
import { MessageVariantEnum } from '../../../../src/helpers/types';
import { LEGACY_PROCESS_ID, LEGACY_SCHEDULE_EDGE } from '../../../fixtures/arweaveSchedule';
import {
	ARWEAVE_ADDRESS,
	ARWEAVE_HOST,
	ETHEREUM_ADDRESS,
	ETHEREUM_DID,
	SOLANA_ADDRESS,
	SOLANA_DID,
} from '../../../fixtures/identities';

const mocks = vi.hoisted(() => ({
	remote: vi.fn(),
	result: vi.fn(),
	gql: vi.fn(),
	transactions: vi.fn(),
	latestSlot: vi.fn(),
	schedule: vi.fn(),
	download: vi.fn(),
}));
const provider = {
	legacyApi: {
		getGQLData: mocks.gql,
		ao: { result: mocks.result },
		mapFromProcessCase: (edges) => edges,
	},
	mainnetApi: { readLatestSlot: mocks.latestSlot, readSchedule: mocks.schedule },
};
vi.mock('api/blocks', () => ({ getTransactions: mocks.transactions }));
vi.mock('providers/PermawebProvider', () => ({ usePermawebProvider: () => provider }));
vi.mock('api/http', () => ({ requestRemote: mocks.remote }));
vi.mock('helpers/csv', async (importOriginal) => ({
	...(await importOriginal<typeof import('../../../../src/helpers/csv')>()),
	downloadCsv: mocks.download,
}));
vi.mock('react-redux', () => ({ useDispatch: () => vi.fn() }));
vi.mock('components/molecules/Editor', () => ({ Editor: (props) => <pre>{props.initialData}</pre> }));
vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden="true" /> }));
vi.mock('store', () => ({ store: { getState: () => ({}) } }));
vi.mock('store/transactions/reducer', () => ({ selectTransaction: () => null }));

const MESSAGE_ID = 'm'.repeat(43);
const PROCESS_ID = 'p'.repeat(43);
const entry: MessageListEntry = {
	cursor: null,
	node: {
		id: MESSAGE_ID,
		owner: { address: 'o'.repeat(43) },
		recipient: PROCESS_ID,
		tags: [
			{ name: 'Data-Protocol', value: 'ao' },
			{ name: 'Type', value: 'Message' },
			{ name: 'Variant', value: MessageVariantEnum.Legacynet },
			{ name: 'Action', value: 'Eval' },
		],
		data: { size: '20', type: 'text/plain' },
		block: { height: 100, timestamp: 1 },
	},
};
const output = {
	Output: { data: 'full-output-value' },
	Messages: [{ Target: 't'.repeat(43), Tags: [{ name: 'Action', value: 'Reply' }], Data: 'reply-data' }],
};
let container: HTMLElement;
let overlay: HTMLElement;
let root: ReturnType<typeof createRoot>;
let currentRoute: string;
const originalMessageCountsFlag = FLAGS.ENABLE_MESSAGE_COUNTS;

beforeEach(() => {
	currentRoute = '';
	vi.resetAllMocks();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.stubGlobal('matchMedia', () => ({ matches: true }));
	Element.prototype.scrollIntoView = vi.fn();
	localStorage.clear();
	mocks.gql.mockResolvedValue({ data: [] });
	mocks.transactions.mockResolvedValue({
		transactions: { edges: [entry], pageInfo: { hasNextPage: false } },
	});
	mocks.latestSlot.mockResolvedValue(2);
	mocks.schedule.mockResolvedValue({ edges: [] });
	mocks.result.mockResolvedValue(output);
	mocks.remote.mockResolvedValue(new Response('print("input-value")'));
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
	FLAGS.ENABLE_MESSAGE_COUNTS = originalMessageCountsFlag;
});

async function render() {
	await React.act(async () =>
		root.render(
			<MemoryRouter>
				<ThemeProvider theme={theme(darkTheme)}>
					<MessageList
						type="process"
						source={{
							edges: [entry],
							loading: false,
							page: 0,
							pageSize: 25,
							totalCount: 1,
							canReadResults: true,
							onPageChange: vi.fn(),
							onRefresh: vi.fn(),
							onRetry: vi.fn(),
						}}
					/>
				</ThemeProvider>
			</MemoryRouter>
		)
	);
}

function button(label: string, parent: ParentNode = container) {
	return [...parent.querySelectorAll('button')].find((element) => element.textContent === label);
}

function row() {
	return container.querySelector<HTMLElement>('.message-list-element');
}

function LocationProbe() {
	const location = useLocation();
	currentRoute = location.pathname + location.search;
	return null;
}

async function renderAccountFilters(path = `/explorer/${PROCESS_ID}`) {
	await React.act(async () =>
		root.render(
			<MemoryRouter initialEntries={[path]}>
				<ThemeProvider theme={theme(darkTheme)}>
					<LocationProbe />
					<MessageList type="wallet" txId={PROCESS_ID} variant={MessageVariantEnum.Mainnet} />
				</ThemeProvider>
			</MemoryRouter>
		)
	);
}

async function enterFilter(label: string, value: string) {
	const input = overlay.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`);
	expect(input).not.toBeNull();
	await React.act(async () => {
		Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
		input.dispatchEvent(new Event('input', { bubbles: true }));
	});
}

it.each([
	{ identifier: ETHEREUM_DID, address: ETHEREUM_ADDRESS, counts: false },
	{ identifier: ETHEREUM_DID, address: ETHEREUM_ADDRESS, counts: true },
	{ identifier: ARWEAVE_HOST, address: ARWEAVE_ADDRESS, counts: false },
	{ identifier: `did:ar:${ARWEAVE_ADDRESS}`, address: ARWEAVE_ADDRESS, counts: false },
	{ identifier: SOLANA_DID, address: SOLANA_ADDRESS, counts: false },
	{ identifier: ETHEREUM_ADDRESS, address: ETHEREUM_ADDRESS, counts: false },
])(
	'applies and restores full account filters for $identifier with counts $counts',
	async ({ identifier, address, counts }) => {
		FLAGS.ENABLE_MESSAGE_COUNTS = counts;
		mocks.gql.mockResolvedValue({ data: [entry], count: 1, nextCursor: null });
		const requests = counts ? mocks.gql : mocks.transactions;
		const short = `${address.slice(0, 5)}...${address.slice(-5)}`;
		await renderAccountFilters();
		await React.act(async () => button('Filter').click());
		await enterFilter('Recipient', identifier);
		await React.act(async () => button('Apply Filters', overlay).click());
		expect(requests).toHaveBeenCalledWith(expect.objectContaining({ owners: [PROCESS_ID], recipients: [identifier] }));
		expect(button(`To (${short})`)).toBeDefined();
		expect(new URL(currentRoute, 'https://lunar.test').searchParams.get('messageRecipient')).toBe(identifier);
		expect(JSON.parse(localStorage.getItem(STORAGE.messageFilter(PROCESS_ID))).recipient).toBe(identifier);
		await React.act(async () =>
			[...container.querySelectorAll('button')].find((element) => element.textContent.startsWith('Incoming')).click()
		);
		await React.act(async () => button('Filter').click());
		await enterFilter('From', identifier);
		await React.act(async () => button('Apply Filters', overlay).click());
		expect(requests).toHaveBeenCalledWith(expect.objectContaining({ owners: [identifier], recipients: [PROCESS_ID] }));
		expect(button(`From (${short})`)).toBeDefined();
		expect(new URL(currentRoute, 'https://lunar.test').searchParams.get('messageFrom')).toBe(identifier);
		expect(
			requests.mock.calls.some(([args]) =>
				args.tags?.some((tag) => tag.name.toLowerCase() === 'from-process' && tag.values.includes(identifier))
			)
		).toBe(false);
		const savedRoute = currentRoute;
		await React.act(async () => root.unmount());
		root = createRoot(container);
		requests.mockClear();
		await renderAccountFilters(savedRoute);
		expect(requests).toHaveBeenCalledWith(expect.objectContaining({ owners: [identifier], recipients: [PROCESS_ID] }));
		expect(button(`From (${short})`)).toBeDefined();
		await React.act(async () => button(`From (${short})`).click());
		expect(new URL(currentRoute, 'https://lunar.test').searchParams.has('messageFrom')).toBe(false);
	}
);

it('preserves a DID From filter restored from local storage when paging', async () => {
	localStorage.setItem(
		STORAGE.messageFilter(PROCESS_ID),
		JSON.stringify({ filter: 'incoming', fromAddress: ETHEREUM_DID, perPage: '1' })
	);
	mocks.transactions.mockResolvedValue({
		transactions: { edges: [{ ...entry, cursor: 'next' }], pageInfo: { hasNextPage: true } },
	});
	await renderAccountFilters();
	await React.act(async () => button('Next').click());
	expect(mocks.transactions).toHaveBeenLastCalledWith(
		expect.objectContaining({ owners: [ETHEREUM_DID], recipients: [PROCESS_ID], after: 'next' })
	);
	expect(new URL(currentRoute, 'https://lunar.test').searchParams.get('messageFrom')).toBe(ETHEREUM_DID);
});

it('does not turn an unsupported DID filter into an owner query', async () => {
	const identifier = 'did:web:example.com';
	await renderAccountFilters(
		`/explorer/${PROCESS_ID}?messageDirection=incoming&messageFrom=${encodeURIComponent(identifier)}`
	);
	expect(mocks.transactions.mock.calls.some(([args]) => args.owners?.includes(identifier))).toBe(false);
	expect(container.textContent).not.toContain(`From (${identifier})`);
});

async function renderDirectional(type: 'process' | 'wallet' = 'process', txId = PROCESS_ID) {
	await React.act(async () =>
		root.render(
			<MemoryRouter>
				<ThemeProvider theme={theme(darkTheme)}>
					<MessageList
						txId={txId}
						type={type}
						variant={MessageVariantEnum.Mainnet}
						currentFilter="outgoing"
						authority={'a'.repeat(43)}
					/>
				</ThemeProvider>
			</MemoryRouter>
		)
	);
}

it.each([false, true])(
	'preserves scheduler SDK casing and raw CSV tag fields (extra boundary tags: %s)',
	async (extraTags) => {
		const tags = extraTags
			? [
					...LEGACY_SCHEDULE_EDGE.node.message.tags,
					{ name: 'SDK', value: '' },
					{ name: 'customTag', value: 'second' },
					{ name: '', value: 'unnamed' },
			  ]
			: LEGACY_SCHEDULE_EDGE.node.message.tags;
		const edge = {
			...LEGACY_SCHEDULE_EDGE,
			node: {
				...LEGACY_SCHEDULE_EDGE.node,
				message: { ...LEGACY_SCHEDULE_EDGE.node.message, tags },
			},
		};
		mocks.remote.mockImplementation(async (url) => {
			if (String(url).endsWith('/latest')) {
				return new Response(JSON.stringify({ assignment: LEGACY_SCHEDULE_EDGE.node.assignment }));
			}
			if (String(url).includes('from-nonce=')) {
				return new Response(JSON.stringify({ edges: [edge] }));
			}
			return new Response(LEGACY_SCHEDULE_EDGE.node.message.data);
		});
		await React.act(async () =>
			root.render(
				<MemoryRouter>
					<ThemeProvider theme={theme(darkTheme)}>
						<MessageList
							txId={LEGACY_PROCESS_ID}
							type="process"
							variant={MessageVariantEnum.Legacynet}
							currentFilter="incoming"
						/>
					</ThemeProvider>
				</MemoryRouter>
			)
		);
		await React.act(async () => row().click());
		const input = container.querySelector('section[aria-label^="Input"]');
		expect(input.textContent).toContain('SDKaoconnect');
		expect(input.textContent).not.toContain('Sdkaoconnect');
		await React.act(async () => button('Download').click());
		expect(mocks.download).toHaveBeenCalledWith(expect.any(String), [
			expect.objectContaining({ id: LEGACY_SCHEDULE_EDGE.node.message.id, tags }),
		]);
	}
);

it.each([ETHEREUM_DID, ARWEAVE_HOST, SOLANA_DID])(
	'preserves %s in outgoing, paginated, and incoming account history queries',
	async (identifier) => {
		mocks.transactions.mockResolvedValueOnce({
			transactions: {
				edges: Array.from({ length: 25 }, (_, index) => ({
					...entry,
					cursor: `cursor-${index}`,
					node: { ...entry.node, id: index.toString().padStart(43, 'm') },
				})),
				pageInfo: { hasNextPage: true },
			},
		});
		await renderDirectional('wallet', identifier);
		expect(mocks.transactions).toHaveBeenLastCalledWith(expect.objectContaining({ owners: [identifier] }));
		Element.prototype.scrollIntoView = vi.fn();
		await React.act(async () => button('Next').click());
		expect(mocks.transactions).toHaveBeenLastCalledWith(
			expect.objectContaining({ owners: [identifier], after: 'cursor-24' })
		);
		await React.act(async () => button('Incoming').click());
		expect(mocks.transactions).toHaveBeenLastCalledWith(expect.objectContaining({ recipients: [identifier] }));
	}
);

it.each(['process', 'wallet'] as const)(
	'skips count queries and labels while preserving cursor pagination for %s messages by default',
	async (type) => {
		expect(FLAGS.ENABLE_MESSAGE_COUNTS).toBe(false);
		mocks.transactions.mockResolvedValueOnce({
			transactions: {
				edges: Array.from({ length: 25 }, (_, index) => ({
					...entry,
					cursor: index === 24 ? 'next-page' : `cursor-${index}`,
					node: { ...entry.node, id: index.toString().padStart(43, 'm') },
				})),
				pageInfo: { hasNextPage: true },
			},
		});
		await renderDirectional(type);
		expect(mocks.gql).not.toHaveBeenCalled();
		expect(mocks.latestSlot).not.toHaveBeenCalled();
		expect(mocks.transactions).toHaveBeenCalledOnce();
		expect(mocks.transactions).toHaveBeenCalledWith(
			expect.objectContaining({ includeCount: false, first: 25, after: null })
		);
		expect(button('Incoming')).toBeDefined();
		expect(button('Outgoing')).toBeDefined();
		expect(row()).not.toBeNull();
		Element.prototype.scrollIntoView = vi.fn();
		await React.act(async () => button('Next').click());
		expect(mocks.transactions).toHaveBeenLastCalledWith(
			expect.objectContaining({ includeCount: false, after: 'next-page' })
		);
		expect(container.textContent).toContain('Page (2)');
		expect(button('Next').disabled).toBe(true);
		await React.act(async () => button('Previous').click());
		expect(mocks.transactions).toHaveBeenLastCalledWith(expect.objectContaining({ after: null }));
		await React.act(async () => button('Incoming').click());
		if (type === 'process') {
			// Reading the latest slot is still needed to fetch the incoming schedule, even with label counts disabled.
			expect(mocks.latestSlot).toHaveBeenCalledOnce();
			expect(mocks.schedule).toHaveBeenCalledOnce();
		} else {
			expect(mocks.transactions).toHaveBeenLastCalledWith(
				expect.objectContaining({ includeCount: false, recipients: [PROCESS_ID] })
			);
		}
		expect(button('Incoming')).toBeDefined();
		expect(button('Outgoing')).toBeDefined();
		expect(mocks.gql).not.toHaveBeenCalled();
	}
);

it('restores count requests and button labels when the flag is enabled', async () => {
	FLAGS.ENABLE_MESSAGE_COUNTS = true;
	mocks.gql.mockResolvedValue({ data: [entry], count: 20, nextCursor: null });
	await renderDirectional();
	expect(mocks.transactions).not.toHaveBeenCalled();
	expect(mocks.gql).toHaveBeenCalledTimes(2);
	expect(mocks.gql.mock.calls.filter(([args]) => !args.paginator)).toHaveLength(1);
	expect(mocks.latestSlot).toHaveBeenCalledOnce();
	expect(button('Incoming (3)')).toBeDefined();
	expect(button('Outgoing (20)')).toBeDefined();
});

it.each([false, true])('keeps filtered incoming/outgoing queries behind the count flag (%s)', async (enabled) => {
	FLAGS.ENABLE_MESSAGE_COUNTS = enabled;
	localStorage.setItem(STORAGE.messageFilter(PROCESS_ID), JSON.stringify({ action: 'Eval' }));
	mocks.gql.mockResolvedValue({ data: [entry], count: 20, nextCursor: null });
	await renderDirectional();
	if (enabled) {
		expect(mocks.gql).toHaveBeenCalledTimes(3);
		expect(mocks.gql.mock.calls.filter(([args]) => !args.paginator)).toHaveLength(2);
		expect(button('Incoming (20)')).toBeDefined();
		expect(button('Outgoing (20)')).toBeDefined();
	} else {
		expect(mocks.gql).not.toHaveBeenCalled();
		expect(mocks.transactions).toHaveBeenCalledOnce();
		expect(mocks.transactions.mock.calls[0][0].tags).toContainEqual({ name: 'action', values: ['Eval'] });
		await React.act(async () => button('Incoming').click());
		expect(mocks.transactions).toHaveBeenLastCalledWith(
			expect.objectContaining({ includeCount: false, recipients: [PROCESS_ID] })
		);
		expect(button('Incoming')).toBeDefined();
	}
	expect(mocks.latestSlot).not.toHaveBeenCalled();
});

it('expands input above existing results and opens full output in a panel', async () => {
	await render();
	expect(button('Input')).toBeUndefined();
	expect(button('Output')).toBeUndefined();
	expect(button('View raw output')).toBeUndefined();
	expect(mocks.remote).not.toHaveBeenCalled();
	expect(mocks.result).not.toHaveBeenCalled();
	await React.act(async () => row().click());
	const input = container.querySelector('section[aria-label^="Input"]');
	expect(input.getAttribute('aria-label')).toBe('Input (Tags + Data)');
	expect(input.firstElementChild.querySelector('p').textContent).toBe('Input');
	expect(input.firstElementChild.querySelector('span').textContent).toBe('(Tags + Data)');
	expect(input.textContent).toContain('ActionEval');
	expect(input.textContent).toContain('print("input-value")');
	const resultRow = container.querySelectorAll('.message-list-element')[1];
	expect(resultRow.textContent).toContain('Result Message');
	expect(resultRow.textContent).toContain('Reply');
	const fullOutput = button('View raw output');
	const outputHeading = [...container.querySelectorAll('p')].find((element) => element.textContent === 'Output');
	expect(outputHeading.parentElement.contains(fullOutput)).toBe(true);
	expect(input.compareDocumentPosition(resultRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	expect(fullOutput.compareDocumentPosition(resultRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	expect(container.textContent).not.toContain('full-output-value');
	expect(mocks.result).toHaveBeenCalledOnce();
	expect(mocks.result).toHaveBeenCalledWith({ process: PROCESS_ID, message: MESSAGE_ID });
	expect((await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })).violations).toEqual([]);
	await React.act(async () => {
		fullOutput.focus();
		fullOutput.click();
	});
	const dialog = overlay.querySelector('[role="dialog"]');
	expect(dialog).not.toBeNull();
	expect(dialog.textContent).toContain('full-output-value');
	expect(dialog.textContent).toContain('reply-data');
	expect(mocks.result).toHaveBeenCalledOnce();
	await React.act(async () => button('Close', dialog).click());
	expect(overlay.querySelector('[role="dialog"]')).toBeNull();
	expect(document.activeElement).toBe(fullOutput);
	await React.act(async () => row().querySelector<HTMLButtonElement>('button[aria-expanded]').click());
	expect(container.querySelector('section[aria-label^="Input"]')).toBeNull();
	await React.act(async () => row().click());
	expect(mocks.remote).toHaveBeenCalledOnce();
	expect(mocks.result).toHaveBeenCalledOnce();
});

it('shows the output header and raw output action only after the result loads without duplicate requests', async () => {
	let finish: (value: typeof output) => void;
	mocks.result.mockImplementation(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			})
	);
	await render();
	await React.act(async () => row().click());
	expect(container.querySelector('section[aria-label^="Input"]').textContent).toContain('input-value');
	expect([...container.querySelectorAll('p')].some((element) => element.textContent === 'Output')).toBe(false);
	expect(button('View raw output')).toBeUndefined();
	expect(mocks.result).toHaveBeenCalledOnce();
	await React.act(async () => finish(output));
	expect([...container.querySelectorAll('p')].some((element) => element.textContent === 'Output')).toBe(true);
	await React.act(async () => button('View raw output').click());
	expect(overlay.textContent).toContain('full-output-value');
	expect(mocks.result).toHaveBeenCalledOnce();
});

it('retries failed input without hiding the results', async () => {
	mocks.remote.mockResolvedValueOnce(new Response('Failed', { status: 503 }));
	await render();
	await React.act(async () => row().click());
	expect(container.querySelector('[role="alert"]').textContent).toContain('Error Fetching Message Data');
	expect(container.textContent).toContain('Reply');
	await React.act(async () => button('Retry').click());
	expect(container.querySelector('[role="alert"]')).toBeNull();
	expect(container.querySelector('section[aria-label^="Input"]').textContent).toContain('input-value');
	expect(mocks.result).toHaveBeenCalledOnce();
});

it('aborts input on collapse and ignores late responses when reopened', async () => {
	let finish: (value: Response) => void;
	mocks.remote.mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			})
	);
	await render();
	await React.act(async () => row().click());
	const signal = mocks.remote.mock.calls[0][1].signal;
	expect(container.querySelector('section [role="status"]').textContent).toContain('Loading');
	await React.act(async () => row().click());
	expect(signal.aborted).toBe(true);
	await React.act(async () => row().click());
	await React.act(async () => finish(new Response('outdated-input')));
	const input = container.querySelector('section[aria-label^="Input"]');
	expect(input.textContent).toContain('input-value');
	expect(input.textContent).not.toContain('outdated-input');
});
