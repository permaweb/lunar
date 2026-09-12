// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { nodesApi } from '../../../src/api/nodes';
import { NodesTable } from '../../../src/features/Nodes';
import { darkTheme, theme } from '../../../src/helpers/themes';

vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden={'true'} /> }));
vi.mock('react-chartjs-2', () => ({ Chart: (props) => <div role={'img'} aria-label={props['aria-label']} /> }));
vi.mock('api/nodes', async () => ({
	...(await vi.importActual('../../../src/api/nodes/types')),
	nodesApi: {
		getPeers: vi.fn(),
		getCachedInfo: vi.fn().mockReturnValue([]),
		getCountries: vi.fn(),
		getInfo: vi.fn(),
		supportsInfo: vi.fn().mockResolvedValue(false),
	},
	nodeAnalyticsUrl: 'https://stats.forward.computer',
	nodeCountryData: { release: '2026-09', attributionUrl: 'https://db-ip.com' },
}));
afterEach(() => {
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});

describe('Nodes table and map', () => {
	it('retries the country download and counts endpoints once per country, including different ports', async () => {
		vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
		const peers = [
			{ address: '8.8.8.8:1984', ip: '8.8.8.8', port: 1984 },
			{ address: '8.8.8.8:1985', ip: '8.8.8.8', port: 1985 },
			{ address: '9.9.9.9:1984', ip: '9.9.9.9', port: 1984 },
			{ address: '1.1.1.1:1984', ip: '1.1.1.1', port: 1984 },
		];
		vi.mocked(nodesApi.getPeers).mockResolvedValue(peers);
		vi.mocked(nodesApi.getCountries)
			.mockRejectedValueOnce(new Error('unavailable'))
			.mockResolvedValue({
				source: 'analytics',
				countries: [
					{ ip: '8.8.8.8', countryCode: 'US' },
					{ ip: '9.9.9.9', countryCode: 'DE' },
				],
			});
		const container = document.createElement('main');
		document.body.append(container);
		const root = createRoot(container);
		const clickButton = async (label: string) => {
			const button = [...container.querySelectorAll('button')].find((element) => element.textContent === label);
			expect(button).toBeDefined();
			await React.act(async () => button.click());
		};
		try {
			await React.act(async () =>
				root.render(
					<ThemeProvider theme={theme(darkTheme)}>
						<MemoryRouter>
							<NodesTable />
						</MemoryRouter>
					</ThemeProvider>
				)
			);
			await clickButton('Show Map');
			await React.act(async () => {
				await import('../../../src/features/Nodes/components/organisms/NodesMap');
			});
			expect(container.querySelector('[role="alert"]')?.textContent).toContain('Unable to load country locations');
			await clickButton('Retry Locations');
			expect(container.querySelector('[role="alert"]')).toBeNull();
			expect(container.textContent).toContain('2 of 3 IP addresses located');
			expect(container.textContent).toContain('1 locations unavailable');
			const rows = [...container.querySelectorAll('li')];
			expect(rows.map((row) => row.textContent)).toEqual(['United States2', 'Germany1']);
			expect(rows[0].querySelector('[title="United States"]')).not.toBeNull();
			expect(nodesApi.getCountries).toHaveBeenCalledTimes(2);
			const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
			expect(result.violations).toEqual([]);
		} finally {
			await React.act(async () => root.unmount());
			container.remove();
		}
	});
	it('paginates peers, names controls accessibly, and cancels map work without probing any rows', async () => {
		vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		const peers = Array.from({ length: 60 }, (_, index) => ({
			address: `8.8.8.${index + 1}:1984`,
			ip: `8.8.8.${index + 1}`,
			port: 1984,
		}));
		vi.mocked(nodesApi.getPeers).mockResolvedValue(peers);
		const signals: AbortSignal[] = [];
		vi.mocked(nodesApi.getCountries).mockImplementation(
			(_peer, signal) =>
				new Promise((_resolve, reject) => {
					signals.push(signal);
					signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true });
				})
		);
		const container = document.createElement('main');
		document.body.append(container);
		const root = createRoot(container);
		const clickButton = async (label: string) => {
			const button = [...container.querySelectorAll('button')].find((element) => element.textContent === label);
			expect(button).toBeDefined();
			await React.act(async () => button.click());
		};
		try {
			await React.act(async () =>
				root.render(
					<ThemeProvider theme={theme(darkTheme)}>
						<MemoryRouter>
							<NodesTable />
						</MemoryRouter>
					</ThemeProvider>
				)
			);
			expect(container.querySelectorAll('tbody tr')).toHaveLength(50);
			expect(container.textContent.match(/Not checked/g)).toHaveLength(50);
			expect(container.textContent).not.toContain('Checking');
			expect(container.textContent).toContain('Page (1 of 2)');
			expect(container.textContent.match(/Page \(1 of 2\)/g)).toHaveLength(1);
			expect(container.querySelector('input')).toBeNull();
			expect(nodesApi.getInfo).not.toHaveBeenCalled();
			expect(container.textContent).not.toContain('Public peers reported by');
			const link = container.querySelector('tbody a');
			expect(link?.getAttribute('href')).toBe('#/explorer/http%3A%2F%2F8.8.8.1%3A1984');
			expect(link?.getAttribute('target')).toBeNull();
			expect(link?.tabIndex).toBe(0);
			expect(fetchMock).not.toHaveBeenCalled();
			expect(nodesApi.getCountries).not.toHaveBeenCalled();
			const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
			expect(result.violations).toEqual([]);
			await clickButton('Next');
			expect(container.querySelectorAll('tbody tr')).toHaveLength(10);
			expect(container.textContent).toContain('8.8.8.51:1984');
			await clickButton('Show Map');
			await React.act(async () => {
				await import('../../../src/features/Nodes/components/organisms/NodesMap');
			});
			expect(nodesApi.getCountries).toHaveBeenCalledTimes(1);
			expect(fetchMock).not.toHaveBeenCalled();
			await clickButton('Show Table');
			expect(signals.every((signal) => signal.aborted)).toBe(true);
			expect(nodesApi.getCountries).toHaveBeenCalledTimes(1);
			expect(container.querySelectorAll('tbody tr')).toHaveLength(10);
		} finally {
			await React.act(async () => root.unmount());
			container.remove();
		}
	});
});
