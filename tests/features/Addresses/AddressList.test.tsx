// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { expect, it, vi } from 'vitest';

import { ExplorerLink } from '../../../src/components/atoms/TxAddress';
import { AddressList } from '../../../src/features/Addresses';
import { darkTheme, theme } from '../../../src/helpers/themes';

vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden="true" /> }));
vi.mock('store', () => ({ store: { getState: () => ({}) } }));
vi.mock('store/transactions/reducer', () => ({ selectTransaction: () => null }));

it('opens addresses from row clicks and Enter while preserving links to other values', async () => {
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	const address = 'a'.repeat(43);
	const transaction = 't'.repeat(43);
	let path = '';
	function Harness() {
		path = useLocation().pathname;
		return (
			<AddressList
				source={{
					addresses: [address],
					loading: false,
					onRefresh: () => {},
					columns: [
						{ label: 'Balance', render: () => '5 AR' },
						{ label: 'Blocks Mined', render: () => '1' },
						{ label: 'Last Transaction', render: () => <ExplorerLink value={transaction} /> },
					],
				}}
			/>
		);
	}
	const container = document.createElement('main');
	document.body.append(container);
	const root = createRoot(container);
	try {
		await React.act(async () =>
			root.render(
				<MemoryRouter>
					<ThemeProvider theme={theme(darkTheme)}>
						<Harness />
					</ThemeProvider>
				</MemoryRouter>
			)
		);
		const row = container.querySelector<HTMLElement>('[role="row"][tabindex="0"]');
		await React.act(async () => row.click());
		expect(path).toBe(`/explorer/${address}`);
		await React.act(async () => row.querySelector<HTMLAnchorElement>(`a[href="#/explorer/${transaction}"]`).click());
		expect(path).toBe(`/explorer/${transaction}`);
		await React.act(async () => {
			row.focus();
			row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
		});
		expect(path).toBe(`/explorer/${address}`);
		expect(row.querySelector(`a[href="#/explorer/${address}"]`)).not.toBeNull();
		expect((await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })).violations).toEqual([]);
	} finally {
		await React.act(async () => root.unmount());
		container.remove();
		vi.unstubAllGlobals();
	}
});
