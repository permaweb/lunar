// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { AoReadError } from '../../../../src/api/aoNetwork';
import { ProcessRead } from '../../../../src/components/molecules/ProcessRead';
import { darkTheme, theme } from '../../../../src/helpers/themes';
import { MessageVariantEnum } from '../../../../src/helpers/types';
import { getAoVariantFromTags } from '../../../../src/helpers/utils';

const mocks = vi.hoisted(() => ({ readState: vi.fn(), readProcess: vi.fn(), requestRemote: vi.fn() }));
vi.mock('api/http', () => ({ requestRemote: mocks.requestRemote }));
vi.mock('providers/PermawebProvider', () => {
	const value = { mainnetApi: { readStateWithSource: mocks.readState }, legacyApi: { readProcess: mocks.readProcess } };
	return { usePermawebProvider: () => value };
});
const nodes = [{ url: 'https://compute.example', active: true }];
vi.mock('providers/SettingsProvider', () => ({
	useSettingsProvider: () => ({ settings: { nodes, legacyComputeNode: 'https://legacy.example' } }),
}));
vi.mock('providers/LanguageProvider', () => ({
	useLanguageProvider: () => ({
		current: 'en',
		object: {
			en: {
				run: 'Run',
				running: 'Running',
				loadingLinkedState: 'Loading linked values…',
				loadMoreData: 'Load more data',
				moreStateAvailable: 'More state is available to load.',
				aoReadPartial: 'Showing partial state',
				aoReadTimeout: 'Read timed out',
			},
		},
	}),
}));
vi.mock('components/atoms/Loader', () => ({ Loader: () => null }));
vi.mock('components/molecules/JSONReader', () => ({
	JSONReader: (props) => (
		<>
			<pre>{JSON.stringify(props.data)}</pre>
			{props.footer}
		</>
	),
}));
vi.mock('store', () => ({ store: { getState: () => ({}) } }));
vi.mock('store/transactions/reducer', () => ({ selectTransaction: () => null, addTransaction: vi.fn() }));

const processId = '_206v3RtEU-mvPIIu0gtPnBZ9SoS7MlxQn2Yk-kPzcU';
let container: HTMLElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
	vi.resetAllMocks();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	mocks.readState.mockResolvedValue({
		data: { name: '0x1', 'at-slot': 2 },
		provider: 'https://charlie.example',
		source: 'fallback',
	});
	mocks.readProcess.mockResolvedValue({ Name: 'Legacy process' });
	mocks.requestRemote.mockResolvedValue({ url: 'https://legacy.example/results' });
	container = document.createElement('div');
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

async function render(variant: MessageVariantEnum | undefined, id = processId) {
	await React.act(async () => {
		root.render(
			<ThemeProvider theme={theme(darkTheme)}>
				<ProcessRead processId={id} variant={variant} autoRun />
			</ThemeProvider>
		);
	});
}

it.each([[{ name: 'device', value: 'process@1.0' }], [{ name: 'Variant', value: MessageVariantEnum.Mainnet }]])(
	'reads current HyperBEAM state for mainnet tags %j',
	async (tag) => {
		await render(getAoVariantFromTags([tag]));
		expect(mocks.readState).toHaveBeenCalledWith({
			processId,
			hydrate: true,
			signal: expect.any(AbortSignal),
			onProgress: expect.any(Function),
		});
		expect(mocks.readProcess).not.toHaveBeenCalled();
		expect(container.textContent).toContain('0x1');
		expect(container.textContent).toContain('charlie.example');
		expect(container.textContent).not.toContain('compute.example');
		expect(container.textContent).not.toContain('No Info Handler Found');
	}
);

it('keeps legacy processes on the Info read path', async () => {
	await render(MessageVariantEnum.Legacynet);
	expect(mocks.readProcess).toHaveBeenCalledWith({ processId, action: 'Info' });
	expect(mocks.readState).not.toHaveBeenCalled();
	expect(container.textContent).toContain('Legacy process');
});

it.each([
	[
		{ name: 'device', value: 'process@1.0' },
		{ name: 'scheduler-device', value: 'arweave-scheduler@1.0' },
	],
	[{ name: 'Variant', value: MessageVariantEnum.Mainnet }],
])('waits for restored process metadata before choosing the read API for %j', async (...tags) => {
	await render(undefined);
	expect(mocks.readProcess).not.toHaveBeenCalled();
	expect(mocks.readState).not.toHaveBeenCalled();

	await render(getAoVariantFromTags(tags));
	expect(mocks.readProcess).not.toHaveBeenCalled();
	expect(mocks.readState).toHaveBeenCalledTimes(1);
	expect(mocks.readState).toHaveBeenCalledWith({
		processId,
		hydrate: true,
		signal: expect.any(AbortSignal),
		onProgress: expect.any(Function),
	});
});

it('does not fall back to a legacy dry-run when a mainnet state read fails', async () => {
	mocks.readState.mockRejectedValueOnce(new Error('Peers unavailable'));
	await render(MessageVariantEnum.Mainnet);
	expect(mocks.readProcess).not.toHaveBeenCalled();
	expect(container.textContent).toContain('Peers unavailable');
});

it('starts a legacy read only after metadata identifies the legacy network', async () => {
	await render(undefined);
	expect(mocks.readProcess).not.toHaveBeenCalled();

	await render(MessageVariantEnum.Legacynet);
	expect(mocks.readProcess).toHaveBeenCalledExactlyOnceWith({ processId, action: 'Info' });
	expect(mocks.readState).not.toHaveBeenCalled();
});

it('shows headers and each linked value while the complete read is still pending', async () => {
	let finish: (value: unknown) => void;
	mocks.readState.mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			})
	);
	await render(MessageVariantEnum.Mainnet);
	const onProgress = mocks.readState.mock.calls[0][0].onProgress;
	const header = { name: 'Legacy wUSDC', 'balances+link': 'b'.repeat(43) };
	await React.act(async () =>
		onProgress({ data: header, provider: 'https://peer.example', completedLinks: 0, totalLinks: 2 })
	);
	expect(container.querySelector('pre')?.textContent).toContain('Legacy wUSDC');
	expect(container.querySelector('[role="status"]')?.textContent).toContain('(0/2)');
	expect(container.textContent).toContain('peer.example');
	const data = { name: 'Legacy wUSDC', balances: { holder: '900719925474099312345' } };
	await React.act(async () => onProgress({ data, provider: 'https://peer.example', completedLinks: 1, totalLinks: 2 }));
	expect(container.querySelector('pre')?.textContent).toContain('900719925474099312345');
	expect(container.querySelector('pre')?.textContent).not.toContain('balances+link');
	expect(container.querySelector('[role="status"]')?.textContent).toContain('(1/2)');
	await React.act(async () => finish({ data: { ...data, orders: [] }, provider: 'https://peer.example' }));
	expect(container.querySelector('pre')?.textContent).toContain('"orders":[]');
	expect(container.querySelector('[role="status"]')).toBeNull();
});

it('retains partial state with an incomplete notice when a remaining value times out', async () => {
	let fail: (error: unknown) => void;
	mocks.readState.mockImplementationOnce(
		() =>
			new Promise((_resolve, reject) => {
				fail = reject;
			})
	);
	await render(MessageVariantEnum.Mainnet);
	await React.act(async () =>
		mocks.readState.mock.calls[0][0].onProgress({
			data: { name: 'Legacy wUSDC', 'balances+link': 'b'.repeat(43) },
			provider: 'https://peer.example',
			completedLinks: 0,
			totalLinks: 1,
		})
	);
	await React.act(async () => fail(new AoReadError('timeout')));
	expect(container.querySelector('pre')?.textContent).toContain('Legacy wUSDC');
	expect(container.querySelector('pre')?.textContent).toContain('balances+link');
	expect(container.querySelector('[role="status"]')?.textContent).toBe('Showing partial state');
	expect(container.textContent).toContain('Read timed out');
	expect(mocks.readProcess).not.toHaveBeenCalled();
});

it('ignores progress and completion from a previous process after navigation', async () => {
	let finish: (value: unknown) => void;
	mocks.readState.mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			})
	);
	await render(MessageVariantEnum.Mainnet);
	const previousRead = mocks.readState.mock.calls[0][0];
	await render(MessageVariantEnum.Mainnet, 'n'.repeat(43));
	expect(previousRead.signal.aborted).toBe(true);
	await React.act(async () => {
		previousRead.onProgress({
			data: { name: 'Stale process' },
			provider: 'https://stale.example',
			completedLinks: 1,
			totalLinks: 2,
		});
		finish({ data: { name: 'Stale process' }, provider: 'https://stale.example' });
	});
	expect(container.textContent).toContain('0x1');
	expect(container.textContent).not.toContain('Stale process');
	expect(container.textContent).not.toContain('stale.example');
});

const loadMoreButton = () =>
	Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Load more data');

it('loads further state only on click, retaining the current data and disabling duplicate clicks', async () => {
	let finish: (value: unknown) => void;
	const loadMore = vi.fn(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			})
	);
	mocks.readState.mockResolvedValueOnce({
		data: { name: 'Deep process', 'next+link': 'b'.repeat(43) },
		provider: 'https://peer.example',
		loadMore,
	});
	await render(MessageVariantEnum.Mainnet);
	expect(loadMore).not.toHaveBeenCalled();
	expect(loadMoreButton()?.disabled).toBe(false);
	expect(container.textContent).toContain('More state is available to load.');
	expect((await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })).violations).toEqual([]);
	await React.act(async () => {
		loadMoreButton().click();
		loadMoreButton().click();
	});
	expect(loadMore).toHaveBeenCalledTimes(1);
	expect(loadMoreButton()?.disabled).toBe(true);
	expect(container.querySelector('pre')?.textContent).toContain('Deep process');
	await React.act(async () =>
		loadMore.mock.calls[0][0].onProgress({
			data: { name: 'Deep process', next: { done: true } },
			provider: 'https://peer.example',
			completedLinks: 65,
			totalLinks: 65,
		})
	);
	expect(container.querySelector('pre')?.textContent).toContain('"done":true');
	await React.act(async () =>
		finish({ data: { name: 'Deep process', next: { done: true } }, provider: 'https://peer.example' })
	);
	expect(loadMoreButton()).toBeUndefined();
	expect(mocks.readState).toHaveBeenCalledTimes(1);
	expect(mocks.readProcess).not.toHaveBeenCalled();
});

it('retains loaded data and offers the same continuation after a failed manual read', async () => {
	const loadMore = vi
		.fn()
		.mockRejectedValueOnce(new AoReadError('timeout'))
		.mockResolvedValueOnce({ data: { name: 'Recovered process' }, provider: 'https://peer.example' });
	mocks.readState.mockResolvedValueOnce({ data: { name: 'Deep process' }, provider: 'https://peer.example', loadMore });
	await render(MessageVariantEnum.Mainnet);
	await React.act(async () => loadMoreButton().click());
	expect(container.querySelector('pre')?.textContent).toContain('Deep process');
	expect(container.textContent).toContain('Read timed out');
	expect(loadMoreButton()?.disabled).toBe(false);
	await React.act(async () => loadMoreButton().click());
	expect(container.querySelector('pre')?.textContent).toContain('Recovered process');
	expect(loadMoreButton()).toBeUndefined();
	expect(mocks.readState).toHaveBeenCalledTimes(1);
});

it('cancels a continuation on navigation and ignores late progress and completion', async () => {
	let finish: (value: unknown) => void;
	const loadMore = vi.fn(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			})
	);
	mocks.readState.mockResolvedValueOnce({ data: { name: 'Deep process' }, provider: 'https://peer.example', loadMore });
	await render(MessageVariantEnum.Mainnet);
	await React.act(async () => loadMoreButton().click());
	const request = loadMore.mock.calls[0][0];
	await render(MessageVariantEnum.Mainnet, 'n'.repeat(43));
	expect(request.signal.aborted).toBe(true);
	await React.act(async () => {
		request.onProgress({
			data: { name: 'Stale state' },
			provider: 'https://old.example',
			completedLinks: 65,
			totalLinks: 65,
		});
		finish({ data: { name: 'Stale state' }, provider: 'https://old.example', loadMore });
	});
	expect(container.textContent).toContain('0x1');
	expect(container.textContent).not.toContain('Stale state');
	expect(loadMoreButton()).toBeUndefined();
});
