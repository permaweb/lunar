// @vitest-environment jsdom

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { getBlocks } from '../../../../src/api/blocks';
import { GraphQLApiError } from '../../../../src/api/graphql';
import { BlockList } from '../../../../src/components/molecules/BlockList';
import { language } from '../../../../src/helpers/language';
import { darkTheme, theme } from '../../../../src/helpers/themes';

vi.mock('api/blocks', () => ({ getBlocks: vi.fn() }));
vi.mock('components/atoms/TxAddress', () => ({ ExplorerLink: () => null, TxAddress: () => null }));

describe('BlockList query failures', () => {
	let container: HTMLDivElement;
	let root: Root;

	beforeAll(() => {
		(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
	});

	beforeEach(() => {
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
});
