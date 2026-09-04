// @vitest-environment jsdom

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { setConfiguredGraphQLSource } from '../../../../src/api/graphql';
import { MessageList } from '../../../../src/components/molecules/MessageList';
import { darkTheme, theme } from '../../../../src/helpers/themes';
import { MessageVariantEnum } from '../../../../src/helpers/types';

const mocks = vi.hoisted(() => ({ getGQLData: vi.fn() }));
vi.mock('react-svg', () => ({ ReactSVG: () => null }));
vi.mock('components/atoms/TxAddress', () => ({ ExplorerLink: () => null, TxAddress: () => null }));
vi.mock('components/molecules/Editor', () => ({ Editor: () => null }));
vi.mock('components/molecules/JSONReader', () => ({ JSONReader: () => null }));
vi.mock('react-redux', () => {
	const dispatch = vi.fn();
	return { useDispatch: () => dispatch };
});
vi.mock('providers/PermawebProvider', () => {
	const provider = { legacyApi: { getGQLData: mocks.getGQLData } };
	return { usePermawebProvider: () => provider };
});
vi.mock('store', () => ({ store: {} }));

function RouteSearch() {
	return <output>{useLocation().search}</output>;
}

describe('MessageList source switching', () => {
	let container: HTMLDivElement;
	let root: Root;

	beforeAll(() => {
		(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
	});

	beforeEach(() => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		setConfiguredGraphQLSource('remote');
		container = document.createElement('div');
		document.body.appendChild(container);
		root = createRoot(container);
	});

	afterEach(() => {
		React.act(() => root.unmount());
		container.remove();
		vi.restoreAllMocks();
	});

	it('resets source cursors, preserves the action filter, and stops old-source page fetching', async () => {
		let resolveOldRequest: (value: unknown) => void;
		mocks.getGQLData.mockImplementationOnce(() => new Promise((resolve) => (resolveOldRequest = resolve)));
		mocks.getGQLData.mockResolvedValue({ data: [], count: 0, nextCursor: null });
		await React.act(async () => {
			root.render(
				<MemoryRouter
					initialEntries={[
						'/?messageAction=Transfer&messageLimit=5&messageAfter=old&messagePage=2&messageSource=remote',
					]}
				>
					<ThemeProvider theme={theme(darkTheme)}>
						<MessageList variant={MessageVariantEnum.Mainnet} />
						<RouteSearch />
					</ThemeProvider>
				</MemoryRouter>
			);
		});
		expect(mocks.getGQLData).toHaveBeenLastCalledWith(expect.objectContaining({ paginator: 5, cursor: 'old' }));

		await React.act(async () => setConfiguredGraphQLSource('ar-lmdb'));
		const newQuery = mocks.getGQLData.mock.lastCall?.[0];
		expect(newQuery.paginator).toBe(5);
		expect(newQuery.cursor).toBeUndefined();
		expect(JSON.stringify(newQuery)).toContain('Transfer');
		expect(container.querySelector('output')?.textContent).toBe('?messageAction=Transfer&messageLimit=5');

		const callsAfterSwitch = mocks.getGQLData.mock.calls.length;
		await React.act(async () =>
			resolveOldRequest({
				data: [{ node: { id: 'old-source-message' } }],
				count: 100,
				nextCursor: 'old-next-cursor',
			})
		);
		expect(mocks.getGQLData).toHaveBeenCalledTimes(callsAfterSwitch);
		expect(container.textContent).not.toContain('old-source-message');
		expect(container.querySelector('[role="alert"]')).toBeNull();

		await React.act(async () => setConfiguredGraphQLSource('remote'));
		expect(mocks.getGQLData.mock.lastCall?.[0].cursor).toBeUndefined();
	});
});
