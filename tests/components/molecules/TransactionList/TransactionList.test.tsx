// @vitest-environment jsdom

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { getTransactions } from '../../../../src/api/blocks';
import { GraphQLApiError, setConfiguredGraphQLSource } from '../../../../src/api/graphql';
import { TransactionList } from '../../../../src/components/molecules/TransactionList';
import { URLS } from '../../../../src/helpers/config';
import { darkTheme, theme } from '../../../../src/helpers/themes';

vi.mock('api/blocks', () => ({ getTransactions: vi.fn() }));
vi.mock('react-svg', () => ({ ReactSVG: () => null }));
vi.mock('components/atoms/TxAddress', () => ({ ExplorerLink: () => null, TxAddress: () => null }));
vi.mock('react-redux', () => {
	const dispatch = vi.fn();
	return { useDispatch: () => dispatch };
});
vi.mock('providers/PermawebProvider', () => ({ usePermawebProvider: () => ({ legacyApi: null }) }));
vi.mock('store', () => ({ store: {} }));

function RouteSearch() {
	return <output>{useLocation().search}</output>;
}

describe('TransactionList source switching', () => {
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

	it('starts the new source at page one and retains the type filter without applying an old result', async () => {
		let rejectOldRequest: (error: Error) => void;
		vi.mocked(getTransactions).mockImplementationOnce(
			() => new Promise((_resolve, reject) => (rejectOldRequest = reject))
		);
		vi.mocked(getTransactions).mockResolvedValue({
			transactions: { edges: [], pageInfo: { hasNextPage: false } },
		});
		await React.act(async () => {
			root.render(
				<MemoryRouter
					initialEntries={[`${URLS.transactions}?txType=message&txLimit=5&txAfter=old&txPage=2&txSource=remote`]}
				>
					<ThemeProvider theme={theme(darkTheme)}>
						<TransactionList mode="recent" />
						<RouteSearch />
					</ThemeProvider>
				</MemoryRouter>
			);
		});
		expect(getTransactions).toHaveBeenLastCalledWith({
			first: 5,
			after: 'old',
			typeFilter: 'message',
			includeCount: false,
		});

		await React.act(async () => setConfiguredGraphQLSource('ar-lmdb'));
		expect(getTransactions).toHaveBeenLastCalledWith({
			first: 5,
			after: null,
			typeFilter: 'message',
			includeCount: true,
		});
		expect(container.querySelector('output')?.textContent).toBe('?txType=message&txLimit=5');

		await React.act(async () => rejectOldRequest(new GraphQLApiError('unavailable', 'Old source failure')));
		expect(container.querySelector('[role="alert"]')).toBeNull();
		expect(container.textContent).not.toContain('Old source failure');

		await React.act(async () => setConfiguredGraphQLSource('remote'));
		expect(getTransactions).toHaveBeenLastCalledWith({
			first: 5,
			after: null,
			typeFilter: 'message',
			includeCount: true,
		});
	});
});
