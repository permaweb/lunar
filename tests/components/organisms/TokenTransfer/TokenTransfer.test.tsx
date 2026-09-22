// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { TokenTransfer, TokenTransferStatus } from '../../../../src/components/organisms/TokenTransfer';
import { PROCESSES } from '../../../../src/helpers/config';
import { language } from '../../../../src/helpers/language';
import { darkTheme, theme } from '../../../../src/helpers/themes';

// useDispatch and the provider's legacyApi are stable in the app, so the mocks return single instances.
const mocks = vi.hoisted(() => ({
	lookup: vi.fn(),
	dispatch: vi.fn(),
	permaweb: { legacyApi: { getGQLData: vi.fn(), readProcess: vi.fn() } },
}));
vi.mock('helpers/search', () => ({ searchTxById: mocks.lookup }));
vi.mock('react-redux', () => ({ useDispatch: () => mocks.dispatch }));
vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden={'true'} /> }));
vi.mock('store', () => ({ store: { getState: () => ({}) } }));
vi.mock('store/transactions/reducer', () => ({ selectTransaction: () => null }));
vi.mock('providers/LanguageProvider', () => ({ useLanguageProvider: () => ({ current: 'en', object: language }) }));
vi.mock('providers/PermawebProvider', () => ({ usePermawebProvider: () => mocks.permaweb }));

const TOKEN = 'suz9pH8HYQbmzhhU-UaudmHf2_9l4qiyStyrYWxNcMc';
const SENDER = 'wCSXTL1g1Entfpv5iyPNHxJlk9N6MfhYve2reKFJWTg';
const RECIPIENT = 'n6QjVXFWUMHUIgNL6E7tEAHGGbKc2jFwW4bU-LYNbDU';
const en = language.en;

let container: HTMLElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	mocks.lookup.mockResolvedValue({
		node: {
			id: TOKEN,
			tags: [
				{ name: 'denomination', value: '12' },
				{ name: 'ticker', value: 'tAO' },
			],
		},
	});
	container = document.createElement('main');
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

async function render(props: {
	token?: string;
	quantity?: string | null;
	status?: TokenTransferStatus;
	onResultsOpen?: () => void;
}) {
	await React.act(async () =>
		root.render(
			<MemoryRouter>
				<ThemeProvider theme={theme(darkTheme)}>
					<TokenTransfer
						token={props.token ?? TOKEN}
						from={SENDER}
						recipient={RECIPIENT}
						quantity={props.quantity === undefined ? '1000000000000' : props.quantity}
						status={props.status}
						onResultsOpen={props.onResultsOpen}
					/>
				</ThemeProvider>
			</MemoryRouter>
		)
	);
}

function resultsButton() {
	return [...container.querySelectorAll('button')].find((button) => button.textContent === en.goToResults);
}

it('formats an L1 transfer from lowercase token tags without a status row', async () => {
	await render({});

	expect(mocks.lookup).toHaveBeenCalledWith(expect.objectContaining({ txId: TOKEN }));
	expect(container.textContent).toContain(en.tokenTransfer);
	expect(container.textContent).toContain(`${en.amount}: 1tAO`);
	expect(container.textContent).not.toContain(`${en.status}:`);
	expect(resultsButton()).toBeUndefined();
});

it('uses known token metadata without looking up the token', async () => {
	await render({ token: PROCESSES.ao, quantity: '2500000000000' });

	expect(mocks.lookup).not.toHaveBeenCalled();
	expect(container.textContent).toContain(`${en.amount}: 2.5`);
});

it('shows the raw quantity when the token has no denomination', async () => {
	mocks.lookup.mockResolvedValue({ node: { id: TOKEN, tags: [] } });
	await render({});

	expect(container.textContent).toContain(`${en.amount}: 1000000000000`);
});

it.each<[TokenTransferStatus, string, boolean]>([
	[{ state: 'loading' }, `${en.loading}...`, true],
	[{ state: 'computing' }, en.computeInProgress, false],
	[{ state: 'success' }, en.success, false],
	[{ state: 'failure', message: null }, en.error, false],
	[{ state: 'failure', message: 'Failed To Fetch' }, 'Failed To Fetch', false],
])('renders the %j status', async (status, label, disabled) => {
	const onResultsOpen = vi.fn();
	await render({ status: status, onResultsOpen: onResultsOpen });

	expect(container.textContent).toContain(`${en.status}: ${label}`);
	expect(resultsButton()?.disabled).toBe(disabled);

	await React.act(async () => resultsButton()?.click());
	expect(onResultsOpen).toHaveBeenCalledTimes(disabled ? 0 : 1);
});

it('has no detectable accessibility violations', async () => {
	await render({ status: { state: 'success' }, onResultsOpen: vi.fn() });

	const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });

	expect(result.violations).toEqual([]);
});
