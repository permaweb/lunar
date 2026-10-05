// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { MessageResult } from '../../../../src/components/molecules/MessageResult';
import { FLAGS } from '../../../../src/helpers/config';
import { darkTheme, theme } from '../../../../src/helpers/themes';
import { MessageVariantEnum } from '../../../../src/helpers/types';

const mocks = vi.hoisted(() => ({ result: vi.fn(), getGQLData: vi.fn(), requestRemote: vi.fn() }));
vi.mock('api/http', () => ({ requestRemote: mocks.requestRemote }));
vi.mock('providers/PermawebProvider', () => {
	const value = { legacyApi: { ao: { result: mocks.result }, getGQLData: mocks.getGQLData } };
	return { usePermawebProvider: () => value };
});
vi.mock('providers/LanguageProvider', () => ({
	useLanguageProvider: () => ({
		current: 'en',
		object: {
			en: {
				result: 'Result',
				loading: 'Loading',
				errorFetchingResult: 'Error Fetching Result',
				noDataToDisplay: 'No data',
			},
		},
	}),
}));
vi.mock('components/molecules/JSONReader', () => ({
	JSONReader: (props) => (
		<section aria-label={props.header}>
			<h2>{props.header}</h2>
			<button>Copy result</button>
			<pre>{props.data == null ? props.placeholder : JSON.stringify(props.data)}</pre>
		</section>
	),
}));
vi.mock('components/molecules/MessageInput', () => ({
	MessageInput: (props) => <section aria-label="Message input">{props.data}</section>,
}));
vi.mock('components/molecules/Editor', () => ({ Editor: (props) => <pre>{props.initialData}</pre> }));

const processId = 'p'.repeat(43);
const messageId = 'm'.repeat(43);
const defaultHideUnsuccessfulOutput = FLAGS.HIDE_UNSUCCESSFUL_TX_OUTPUT;
let container: HTMLElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
	FLAGS.HIDE_UNSUCCESSFUL_TX_OUTPUT = defaultHideUnsuccessfulOutput;
	vi.resetAllMocks();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.spyOn(console, 'error').mockImplementation(() => undefined);
	mocks.requestRemote.mockResolvedValue(new Response('Message data'));
	mocks.getGQLData.mockResolvedValue({ data: [] });
	container = document.createElement('div');
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await React.act(async () => root.unmount());
	FLAGS.HIDE_UNSUCCESSFUL_TX_OUTPUT = defaultHideUnsuccessfulOutput;
	container.remove();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

async function render(options: { result?: unknown; skipResultFetch?: boolean; messageId?: string } = {}) {
	await React.act(async () => {
		root.render(
			<ThemeProvider theme={theme(darkTheme)}>
				<MessageResult
					processId={processId}
					messageId={options.messageId ?? messageId}
					variant={MessageVariantEnum.Legacynet}
					tags={null}
					result={options.result}
					skipResultFetch={options.skipResultFetch ?? true}
					active
				/>
			</ThemeProvider>
		);
	});
}

it.each([null, { Response: 'unavailable' }, { Output: {}, Messages: [], Error: 'Execution failed' }])(
	'keeps the result panel and controls visible by default for an unsuccessful response: %j',
	async (result) => {
		expect(defaultHideUnsuccessfulOutput).toBe(false);
		await render({ result });
		const panel = container.querySelector('section[aria-label="Result"]');
		expect(panel).not.toBeNull();
		expect(panel.querySelector('button')?.textContent).toBe('Copy result');
		expect(panel.querySelector('pre')?.textContent).toBe(result === null ? 'Loading Result…' : JSON.stringify(result));
	}
);

it('keeps the result panel mounted from loading through a rejected result fetch by default', async () => {
	let fail: (error: unknown) => void;
	mocks.result.mockImplementationOnce(() => new Promise((_resolve, reject) => (fail = reject)));
	await render({ skipResultFetch: false });
	const panel = container.querySelector('section[aria-label="Result"]');
	expect(panel?.textContent).toContain('Loading Result…');
	await React.act(async () => fail(new Error('unavailable')));
	expect(container.querySelector('section[aria-label="Result"]')).toBe(panel);
	expect(panel.querySelector('pre')?.textContent).toBe('{"Response":"unavailable"}');
	expect(mocks.result).toHaveBeenCalledTimes(1);
});

it.each([null, { Response: 'unavailable' }, { Output: {}, Messages: [], Error: 'Execution failed' }])(
	'hides the entire result panel for an unsuccessful response when enabled: %j',
	async (result) => {
		FLAGS.HIDE_UNSUCCESSFUL_TX_OUTPUT = true;
		await render({ result });
		expect(container.querySelector('section[aria-label="Result"]')).toBeNull();
		expect(container.querySelector('button')).toBeNull();
		expect(container.textContent).toContain('Message data');
		expect(mocks.result).not.toHaveBeenCalled();
	}
);

it('shows successful output and removes the panel when the parent result is cleared or fails', async () => {
	FLAGS.HIDE_UNSUCCESSFUL_TX_OUTPUT = true;
	await render({ result: { Output: { data: 'Success' }, Messages: [] } });
	expect(container.querySelector('section[aria-label="Result"]')?.textContent).toContain('Success');
	await render({ result: null });
	expect(container.querySelector('section[aria-label="Result"]')).toBeNull();
	await render({ result: { Response: 'unavailable' } });
	expect(container.querySelector('section[aria-label="Result"]')).toBeNull();
});

it('hides rejected result fetches without turning the error into JSON output', async () => {
	FLAGS.HIDE_UNSUCCESSFUL_TX_OUTPUT = true;
	mocks.result.mockRejectedValueOnce(new Error('unavailable'));
	await render({ skipResultFetch: false });
	expect(mocks.result).toHaveBeenCalledWith({ process: processId, message: messageId });
	expect(container.querySelector('section[aria-label="Result"]')).toBeNull();
	expect(container.textContent).not.toContain('unavailable');
});

it('reveals fetched results only after success and ignores a completion from a previous message', async () => {
	FLAGS.HIDE_UNSUCCESSFUL_TX_OUTPUT = true;
	let finish: (value: unknown) => void;
	mocks.result
		.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)))
		.mockResolvedValueOnce({ Output: { data: 'Current result' }, Messages: [] });
	await render({ skipResultFetch: false });
	expect(container.querySelector('section[aria-label="Result"]')).toBeNull();
	await render({ skipResultFetch: false, messageId: 'n'.repeat(43) });
	expect(container.querySelector('section[aria-label="Result"]')?.textContent).toContain('Current result');
	await React.act(async () => finish({ Output: { data: 'Stale result' }, Messages: [] }));
	expect(container.textContent).not.toContain('Stale result');
	expect(container.querySelector('section[aria-label="Result"]')?.textContent).toContain('Current result');
});
