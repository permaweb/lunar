// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { Tabs } from '../../../../src/components/atoms/Tabs';
import { darkTheme, theme } from '../../../../src/helpers/themes';

let container: HTMLElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	container = document.createElement('main');
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

async function render(tabs: React.ComponentProps<typeof Tabs>['tabs']) {
	await React.act(async () =>
		root.render(
			<ThemeProvider theme={theme(darkTheme)}>
				<Tabs label="Transaction details" tabs={tabs} />
			</ThemeProvider>
		)
	);
}

function buttons() {
	return [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
}

it('keeps panels mounted so switching details preserves state and does not repeat reads', async () => {
	const read = vi.fn();
	const cleanup = vi.fn();
	function Overview() {
		React.useEffect(() => {
			read();
			return cleanup;
		}, []);
		return <p>Transaction status</p>;
	}
	await render([
		{
			id: 'tags',
			label: 'Tags',
			content: (
				<label>
					Tag filter
					<input defaultValue="Action" />
				</label>
			),
		},
		{ id: 'overview', label: 'Overview', content: <Overview /> },
	]);
	const input = container.querySelector('input');
	input.value = 'Recipient';
	await React.act(async () => buttons()[1].click());
	expect(container.querySelector('[role="tabpanel"][hidden]')?.contains(input)).toBe(true);
	await React.act(async () => buttons()[0].click());
	expect(container.querySelector('input').value).toBe('Recipient');
	expect(read).toHaveBeenCalledTimes(1);
	expect(cleanup).not.toHaveBeenCalled();
	const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
	expect(result.violations).toEqual([]);
});

it('moves selection and focus with arrows, Home and End while skipping disabled tabs', async () => {
	await render([
		{ id: 'tags', label: 'Tags', content: 'Tags' },
		{ id: 'disabled', label: 'Unavailable', content: 'Unavailable', disabled: true },
		{ id: 'overview', label: 'Overview', content: 'Overview' },
	]);
	buttons()[0].focus();
	async function press(key: string) {
		await React.act(async () =>
			document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
		);
	}
	await press('ArrowRight');
	expect(document.activeElement).toBe(buttons()[2]);
	expect(buttons()[2].getAttribute('aria-selected')).toBe('true');
	await press('ArrowRight');
	expect(document.activeElement).toBe(buttons()[0]);
	await press('ArrowLeft');
	expect(document.activeElement).toBe(buttons()[2]);
	await press('Home');
	expect(document.activeElement).toBe(buttons()[0]);
	await press('End');
	expect(document.activeElement).toBe(buttons()[2]);
	expect(buttons().filter((button) => button.tabIndex === 0)).toHaveLength(1);
});

it('selects an available tab when the current tab is disabled or removed', async () => {
	const tags = { id: 'tags', label: 'Tags', content: 'Tags' };
	const overview = { id: 'overview', label: 'Overview', content: 'Overview' };
	await render([tags, overview]);
	await React.act(async () => buttons()[1].click());
	await render([tags, { ...overview, disabled: true }]);
	expect(buttons()[0].getAttribute('aria-selected')).toBe('true');
	await render([overview]);
	expect(buttons()[0].getAttribute('aria-selected')).toBe('true');
});
