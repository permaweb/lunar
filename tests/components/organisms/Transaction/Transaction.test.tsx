// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { Transaction } from '../../../../src/components/organisms/Transaction';
import { darkTheme, theme } from '../../../../src/helpers/themes';
import type { GQLNodeResponseType, TagType, TransactionType } from '../../../../src/helpers/types';
import { MessageVariantEnum } from '../../../../src/helpers/types';

const mocks = vi.hoisted(() => ({ lookup: vi.fn(), balance: vi.fn(), arBalance: vi.fn() }));
vi.mock('helpers/search', () => ({ searchTxById: mocks.lookup }));
vi.mock('api/balances', () => ({ readAoBalance: mocks.balance, readArBalance: mocks.arBalance }));
vi.mock('react-redux', () => ({ useDispatch: () => vi.fn() }));
vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden={'true'} /> }));
vi.mock('store', () => ({ store: { getState: () => ({}) } }));
vi.mock('providers/PermawebProvider', () => ({ usePermawebProvider: () => ({ legacyApi: {} }) }));
vi.mock('providers/ArweaveProvider', () => ({ useArweaveProvider: () => ({ walletAddress: null }) }));
vi.mock('providers/NotificationProvider', () => ({ useNotifications: () => ({ addNotification: vi.fn() }) }));
vi.mock('features/Mining', () => ({ useWalletMining: () => ({ isMiner: false }) }));
vi.mock('components/atoms/URLTabs', () => ({ URLTabs: () => null }));
vi.mock('components/molecules/ExplorerControls', async (original) => ({
	...(await original<typeof import('../../../../src/components/molecules/ExplorerControls')>()),
	ExplorerControls: (props) => <>{props.info}</>,
}));

const processId = 'hmW7EXCHRzfC6YAE8FKInptdS8-6BOl3fxjZfxmAOpY';
let container: HTMLElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
	vi.clearAllMocks();
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

async function render(type: TransactionType = 'process') {
	await React.act(async () =>
		root.render(
			<MemoryRouter>
				<ThemeProvider theme={theme(darkTheme)}>
					<Transaction txId={processId} type={type} active onMessageOpen={vi.fn()} processMessagesView={() => null} />
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
