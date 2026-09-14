// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { arweaveNodeApi, ArweaveNodeError } from '../../../src/api/arweaveNode';
import { getBlock } from '../../../src/api/blocks';
import { getArweaveNodeRoute } from '../../../src/helpers/arweaveNode';
import { searchTxById } from '../../../src/helpers/search';
import { darkTheme, theme } from '../../../src/helpers/themes';
import { Navigation } from '../../../src/navigation/Navigation';
import { NODE_INFO, NODE_URL } from '../../fixtures/arweaveNode';

const mocks = vi.hoisted(() => ({ dispatch: vi.fn(), api: { getGQLData: vi.fn(), readProcess: vi.fn() } }));
vi.mock('react-redux', () => ({ useDispatch: () => mocks.dispatch }));
vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden={'true'} /> }));
vi.mock('wallet/WalletConnect', () => ({ WalletConnect: () => null }));
vi.mock('store', () => ({ store: {} }));
vi.mock('helpers/prices', () => ({ getArPrice: async () => null, getAoPrice: async () => null }));
vi.mock('helpers/search', () => ({ searchTxById: vi.fn() }));
vi.mock('providers/PermawebProvider', () => ({ usePermawebProvider: () => ({ legacyApi: mocks.api }) }));
vi.mock('api/blocks', () => ({ getBlock: vi.fn() }));
vi.mock('api/arweaveNode', async () => ({
	...(await vi.importActual('../../../src/api/arweaveNode/types')),
	arweaveNodeApi: { getInfo: vi.fn() },
}));
let container: HTMLElement;
let overlay: HTMLElement;
let root: ReturnType<typeof createRoot>;
let path: string;
function Harness() {
	path = useLocation().pathname;
	return <Navigation open={false} toggle={() => {}} />;
}
beforeEach(async () => {
	vi.clearAllMocks();
	vi.useFakeTimers();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.mocked(arweaveNodeApi.getInfo).mockResolvedValue(NODE_INFO);
	container = document.createElement('main');
	overlay = document.createElement('div');
	overlay.id = 'overlay';
	document.body.append(container, overlay);
	root = createRoot(container);
	await React.act(async () =>
		root.render(
			<MemoryRouter>
				<ThemeProvider theme={theme(darkTheme)}>
					<Harness />
				</ThemeProvider>
			</MemoryRouter>
		)
	);
	await React.act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="Search"]').click());
});
afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	overlay.remove();
	vi.useRealTimers();
	vi.unstubAllGlobals();
});
async function enter(value: string) {
	const input = overlay.querySelector('input');
	await React.act(async () => {
		Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
		input.dispatchEvent(new Event('input', { bubbles: true }));
	});
	await React.act(async () => vi.advanceTimersByTimeAsync(250));
}

it.each([NODE_URL, 'https://arweave.net', 'https://node.example/', '8.8.8.8:1984'])(
	'opens an encoded node explorer route for %s after checking info',
	async (input) => {
		await enter(` ${input} `);
		const link = overlay.querySelector('a');
		expect(link?.getAttribute('href')).toBe(getArweaveNodeRoute(input));
		expect(arweaveNodeApi.getInfo).toHaveBeenCalledOnce();
		expect(getBlock).not.toHaveBeenCalled();
		expect(searchTxById).not.toHaveBeenCalled();
		await React.act(async () => link.click());
		expect(path).toBe(getArweaveNodeRoute(input));
		expect(overlay.querySelector('[role="dialog"]')).toBeNull();
	}
);
it('cancels outdated URL reads and ignores their late responses', async () => {
	let finish: (info: typeof NODE_INFO) => void;
	let firstSignal: AbortSignal;
	vi.mocked(arweaveNodeApi.getInfo).mockImplementationOnce((_node, signal) => {
		firstSignal = signal;
		return new Promise((resolve) => {
			finish = resolve;
		});
	});
	await enter(NODE_URL);
	expect(overlay.querySelector('input').disabled).toBe(false);
	await enter('https://another.node');
	expect(firstSignal.aborted).toBe(true);
	await React.act(async () => finish(NODE_INFO));
	expect(overlay.querySelector('a').getAttribute('href')).toBe(getArweaveNodeRoute('https://another.node'));
});
it('rejects unsafe URLs and shows a failed node lookup without creating a result', async () => {
	await enter('javascript:alert(1)');
	expect(arweaveNodeApi.getInfo).not.toHaveBeenCalled();
	vi.mocked(arweaveNodeApi.getInfo).mockRejectedValueOnce(new ArweaveNodeError('timeout'));
	await enter(NODE_URL);
	expect(overlay.textContent).toContain('This node did not respond in time');
	expect(overlay.querySelector('a')).toBeNull();
});
it('continues to support block heights and transaction IDs', async () => {
	vi.mocked(getBlock).mockResolvedValue({ height: 100 } as Awaited<ReturnType<typeof getBlock>>);
	await enter('100');
	expect(overlay.querySelector('a').getAttribute('href')).toBe('/explorer/100');
	const id = 'a'.repeat(43);
	vi.mocked(searchTxById).mockResolvedValue({ node: { id, tags: [] } } as Awaited<ReturnType<typeof searchTxById>>);
	await enter(id);
	expect(overlay.querySelector('a').getAttribute('href')).toBe(`/explorer/${id}`);
	expect(arweaveNodeApi.getInfo).not.toHaveBeenCalled();
});
