// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { MessageList } from '../../../../src/components/molecules/MessageList';
import type { MessageListEntry } from '../../../../src/components/molecules/MessageList/types';
import { darkTheme, theme } from '../../../../src/helpers/themes';
import { MessageVariantEnum } from '../../../../src/helpers/types';

const mocks = vi.hoisted(() => ({ remote: vi.fn(), result: vi.fn(), gql: vi.fn() }));
const provider = {
	legacyApi: {
		getGQLData: mocks.gql,
		ao: { result: mocks.result },
		mapFromProcessCase: (edges) => edges,
	},
};
vi.mock('providers/PermawebProvider', () => ({ usePermawebProvider: () => provider }));
vi.mock('api/http', () => ({ requestRemote: mocks.remote }));
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

beforeEach(() => {
	vi.resetAllMocks();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.stubGlobal('matchMedia', () => ({ matches: true }));
	mocks.gql.mockResolvedValue({ data: [] });
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
