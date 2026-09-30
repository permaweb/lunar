// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import type { InAppTabsSettings, TabPageType } from '../../src/helpers/tabMode';
import { useExplorerNavigation } from '../../src/hooks/useExplorerNavigation';

vi.mock('providers/SettingsProvider', () => ({ useSettingsProvider: () => ({ settings: { inAppTabs: modes } }) }));
let modes: InAppTabsSettings;
let currentPath: string;
let navigation: ReturnType<typeof useExplorerNavigation>;
let container: HTMLElement;
let root: ReturnType<typeof createRoot>;
function Harness() {
	const location = useLocation();
	currentPath = `${location.pathname}${location.search}`;
	navigation = useExplorerNavigation();
	return null;
}
beforeEach(() => {
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.spyOn(window, 'open').mockReturnValue(null);
	modes = { explorer: false, aos: false, graphql: false };
	container = document.createElement('div');
	root = createRoot(container);
});
afterEach(async () => {
	await React.act(async () => root.unmount());
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});
it.each(['explorer', 'aos', 'graphql'] as TabPageType[])(
	'navigates in the current browser tab from %s and responds to setting changes',
	async (page) => {
		const render = () =>
			React.act(async () =>
				root.render(
					<MemoryRouter initialEntries={[`/${page}/`]}>
						<Harness />
					</MemoryRouter>
				)
			);
		await render();
		expect(navigation.isInAppTabsEnabled).toBe(false);
		modes = { ...modes, [page]: true };
		await render();
		expect(navigation.isInAppTabsEnabled).toBe(true);
		modes = { ...modes, [page]: false };
		await render();
		await React.act(async () => navigation.openExplorer('/explorer/test/messages?cursor=next'));
		expect(currentPath).toBe('/explorer/test/messages?cursor=next');
		expect(window.open).not.toHaveBeenCalled();
	}
);
