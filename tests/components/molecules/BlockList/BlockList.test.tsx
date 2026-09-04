// @vitest-environment jsdom

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { getBlocks } from '../../../../src/api/blocks';
import { GraphQLApiError, setConfiguredGraphQLSource } from '../../../../src/api/graphql';
import { BlockList } from '../../../../src/components/molecules/BlockList';
import { language } from '../../../../src/helpers/language';
import { darkTheme, theme } from '../../../../src/helpers/themes';

vi.mock('api/blocks', () => ({ getBlocks: vi.fn() }));
vi.mock('react-svg', () => ({ ReactSVG: () => null }));
vi.mock('components/atoms/TxAddress', () => ({ ExplorerLink: () => null, TxAddress: () => null }));

function RouteSearch() {
	return <output>{useLocation().search}</output>;
}

describe('BlockList query failures', () => {
	let container: HTMLDivElement;
	let root: Root;

	beforeAll(() => {
		(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
	});

	beforeEach(() => {
		vi.mocked(getBlocks).mockReset();
		setConfiguredGraphQLSource('ar-lmdb');
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		container = document.createElement('div');
		document.body.appendChild(container);
		root = createRoot(container);
	});

	afterEach(() => {
		React.act(() => root.unmount());
		container.remove();
		vi.restoreAllMocks();
	});

	async function renderList() {
		await React.act(async () => {
			root.render(
				<MemoryRouter>
					<ThemeProvider theme={theme(darkTheme)}>
						<BlockList preview />
					</ThemeProvider>
				</MemoryRouter>
			);
		});
	}

	it('shows the unsupported-query message and stops loading', async () => {
		const message = 'AR LMDB does not support block queries';
		vi.mocked(getBlocks).mockRejectedValueOnce(new GraphQLApiError('invalid-input', message));

		await renderList();

		expect(container.querySelector('[role="alert"]')?.textContent).toBe(message);
		expect(container.querySelector('[role="status"]')).toBeNull();
		expect(container.querySelector('.loader')).toBeNull();
		expect(container.textContent).not.toContain(language.en.blocksNotFound);
	});

	it('retains the existing generic message for other request failures', async () => {
		vi.mocked(getBlocks).mockRejectedValueOnce(new Error('Transport failure'));

		await renderList();

		expect(container.querySelector('[role="alert"]')?.textContent).toBe(language.en.errorFetchingData);
		expect(container.querySelector('.loader')).toBeNull();
	});

	it('resets pagination on a source change, preserves filters, and ignores old responses', async () => {
		setConfiguredGraphQLSource('remote');
		let rejectOldRequest: (error: Error) => void;
		vi.mocked(getBlocks).mockImplementationOnce(() => new Promise((_resolve, reject) => (rejectOldRequest = reject)));
		vi.mocked(getBlocks).mockResolvedValue({
			blocks: { edges: [], pageInfo: { hasNextPage: false } },
		});

		await React.act(async () => {
			root.render(
				<MemoryRouter
					initialEntries={['/blocks?blockMinHeight=10&blockLimit=5&blockAfter=old&blockPage=2&blockSource=remote']}
				>
					<ThemeProvider theme={theme(darkTheme)}>
						<BlockList />
						<RouteSearch />
					</ThemeProvider>
				</MemoryRouter>
			);
		});
		expect(getBlocks).toHaveBeenLastCalledWith({ first: 5, after: 'old', minHeight: 10, maxHeight: null });

		await React.act(async () => setConfiguredGraphQLSource('ar-lmdb'));
		expect(getBlocks).toHaveBeenLastCalledWith({ first: 5, after: null, minHeight: 10, maxHeight: null });
		expect(container.querySelector('output')?.textContent).toBe('?blockMinHeight=10&blockLimit=5');

		await React.act(async () => rejectOldRequest(new GraphQLApiError('unavailable', 'Old source failure')));
		expect(container.querySelector('[role="alert"]')).toBeNull();
		expect(container.textContent).not.toContain('Old source failure');

		await React.act(async () => setConfiguredGraphQLSource('remote'));
		expect(getBlocks).toHaveBeenLastCalledWith({ first: 5, after: null, minHeight: 10, maxHeight: null });
	});
});
