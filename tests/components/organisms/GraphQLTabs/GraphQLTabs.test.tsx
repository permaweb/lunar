// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { GraphQLTabs } from '../../../../src/components/organisms/GraphQLTabs';

let renderedTabs: { gateway?: string }[] = [];

vi.mock('components/molecules/ViewTabs', () => ({
	ViewTabs: (props) => {
		renderedTabs = props.tabs;
		return null;
	},
}));
vi.mock('components/organisms/GraphQLPlayground', () => ({ GraphQLPlayground: () => null }));
vi.mock('providers/LanguageProvider', () => ({ useLanguageProvider: () => ({ current: 'en', object: { en: {} } }) }));

const NEW_DEFAULT = 'arweave.net/~query@1.0';
const storedTab = (tabKey: string, gateway: string) => ({ id: tabKey, label: tabKey, tabKey, gateway });

let container: HTMLElement;
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	localStorage.clear();
	renderedTabs = [];
	container = document.createElement('div');
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});
const render = async () => React.act(async () => root.render(<GraphQLTabs />));

it('moves tabs left on the previous default to the new default and keeps other gateways', async () => {
	localStorage.setItem(
		'graphql-tabs',
		JSON.stringify([
			storedTab('previous-default', 'https://ao-search-gateway.goldsky.com'),
			storedTab('chosen', 'https://arweave.net'),
		])
	);

	await render();

	expect(renderedTabs.map((tab) => tab.gateway)).toEqual([undefined, 'https://arweave.net']);
	expect(localStorage.getItem('graphql-default-gateway')).toBe(NEW_DEFAULT);
	expect(JSON.parse(localStorage.getItem('graphql-tabs')).map((tab) => tab.gateway)).toEqual([
		undefined,
		'https://arweave.net',
	]);
});

it('keeps the previous default once the migration has run', async () => {
	localStorage.setItem('graphql-default-gateway', NEW_DEFAULT);
	localStorage.setItem('graphql-tabs', JSON.stringify([storedTab('chosen', 'https://ao-search-gateway.goldsky.com')]));

	await render();

	expect(renderedTabs.map((tab) => tab.gateway)).toEqual(['https://ao-search-gateway.goldsky.com']);
});
