// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { GraphQLTabs } from '../../../../src/components/organisms/GraphQLTabs';
import { SettingsProvider, useSettingsProvider } from '../../../../src/providers/SettingsProvider';

vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden="true" /> }));
vi.mock('providers/NotificationProvider', () => ({
	NotificationViewport: () => null,
	useNotifications: () => ({ addNotification: vi.fn(), removeNotification: vi.fn() }),
}));
vi.mock('api/aoNetwork', () => {
	const status = { source: 'peers' };
	return { getAoReadTransport: () => ({ getStatus: () => status, subscribe: () => () => {} }) };
});
vi.mock('components/organisms/GraphQLPlayground', () => ({
	GraphQLPlayground: (props) => (
		<section data-playground={props.playgroundId}>
			<span>{props.initialQuery}</span>
			<button onClick={() => props.onQueryChange('query Updated { transactions { edges { cursor } } }', 'Updated')}>
				Edit query
			</button>
		</section>
	),
}));
let container: HTMLElement;
let root: ReturnType<typeof createRoot>;
let settings: ReturnType<typeof useSettingsProvider>['settings'];
function Harness() {
	settings = useSettingsProvider().settings;
	return <GraphQLTabs />;
}
beforeEach(() => {
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
	Element.prototype.scrollTo = vi.fn();
	localStorage.clear();
	container = document.createElement('main');
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});
async function render() {
	await React.act(async () =>
		root.render(
			<MemoryRouter initialEntries={['/graphql/']}>
				<SettingsProvider>
					<Harness />
				</SettingsProvider>
			</MemoryRouter>
		)
	);
}
async function toggleMode(label: string) {
	await React.act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Tab actions"]').click());
	const actions = [...container.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
	await React.act(async () => actions.find((item) => item.textContent === label).click());
}
it('shows only the selected playground by default and preserves queries through mode switches', async () => {
	localStorage.setItem(
		'graphql-tabs',
		JSON.stringify([
			{ id: 'first', label: 'First query', tabKey: 'first-key', query: 'query First { blocks { edges { cursor } } }' },
			{
				id: 'second',
				label: 'Second query',
				tabKey: 'second-key',
				query: 'query Second { transactions { edges { cursor } } }',
			},
		])
	);
	localStorage.setItem('graphql-active-tab', '1');
	localStorage.setItem('graphql-visited-tabs', '[0,1]');
	await render();
	expect(container.querySelector('[data-tab-index]')).toBeNull();
	expect(
		[...container.querySelectorAll('[data-playground]')].map((pane) => pane.getAttribute('data-playground'))
	).toEqual(['second']);
	expect(container.textContent).not.toContain('second');
	await React.act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Tab actions"]').click());
	expect(
		[...container.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')].map((item) => [
			item.textContent,
			item.disabled,
		])
	).toEqual([
		['Enable in-app tabs', false],
		['New', true],
		['Clear', true],
	]);
	await React.act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Tab actions"]').click());
	await React.act(async () => container.querySelector<HTMLButtonElement>('[data-playground] button').click());
	await toggleMode('Enable in-app tabs');
	expect(settings.inAppTabs).toEqual({ explorer: false, aos: false, graphql: true });
	expect(container.querySelectorAll('[data-tab-index]')).toHaveLength(2);
	expect(container.textContent).toContain('query Updated');
	await toggleMode('Disable in-app tabs');
	expect(container.querySelectorAll('[data-playground]')).toHaveLength(1);
	expect(container.textContent).toContain('query Updated');
	expect(JSON.parse(localStorage.getItem('graphql-tabs'))[0].query).toContain('query First');
});
it.each(['{broken', '[]', '[{"id": 12}]'])(
	'opens a single playground when saved tabs are invalid: %s',
	async (stored) => {
		localStorage.setItem('graphql-tabs', stored);
		localStorage.setItem('graphql-active-tab', '99');
		await render();
		expect(container.querySelectorAll('[data-playground]')).toHaveLength(1);
	}
);
