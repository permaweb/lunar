// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { SummaryPanel, type SummaryPanelRow } from '../../../../src/components/molecules/SummaryPanel';
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

async function render(props: { subject?: { label: string; value: React.ReactNode }; rows: SummaryPanelRow[] }) {
	await React.act(async () =>
		root.render(
			<ThemeProvider theme={theme(darkTheme)}>
				<SummaryPanel title={'Panel'} subject={props.subject} rows={props.rows} />
			</ThemeProvider>
		)
	);
}

// The panel renders its header first and then a body holding one line per row.
function getLines() {
	return [...(container.firstElementChild?.children[1]?.children ?? [])];
}

// jsdom does not cascade the panel's nested selectors, so read the rules styled-components generated for the element.
function getOwnCss(element: Element) {
	const css = [...document.querySelectorAll('style')].map((style) => style.textContent).join('');

	return [...element.classList].map((name) => css.match(new RegExp(`\\.${name}\\{([^}]*)\\}`))?.[1] ?? '').join('');
}

it('renders the title, subject, and labelled items row by row', async () => {
	await render({
		subject: { label: 'Token', value: <p>{'AO'}</p> },
		rows: [
			{
				id: 'first',
				items: [
					{ id: 'from', label: 'From', value: <p>{'alice'}</p> },
					{ id: 'to', label: 'To', value: <p>{'bob'}</p> },
				],
			},
			{ id: 'second', items: [{ id: 'action', value: <p>{'Open'}</p> }] },
		],
	});

	expect(container.textContent).toBe('PanelToken: AOFrom: aliceTo: bobOpen');
	expect(getLines().map((line) => line.children.length)).toEqual([2, 1]);
});

it('omits the subject and body when there is nothing to show', async () => {
	await render({ rows: [] });

	expect(container.textContent).toBe('Panel');
	expect(container.firstElementChild?.children).toHaveLength(1);
});

it('drops the divider only after items that opt out of it', async () => {
	await render({
		rows: [
			{
				id: 'row',
				items: [
					{ id: 'grouped', label: 'Status', value: <p>{'Done'}</p>, hasDivider: false },
					{ id: 'divided', label: 'Owner', value: <p>{'alice'}</p> },
					{ id: 'last', value: <p>{'End'}</p> },
				],
			},
		],
	});

	const [grouped, divided] = getLines()[0].children;

	expect(getOwnCss(grouped)).toContain('border-right:none !important');
	expect(getOwnCss(divided)).not.toContain('border-right:none');
});

it('has no detectable accessibility violations', async () => {
	await render({
		subject: { label: 'Name', value: <p>{'Process'}</p> },
		rows: [{ id: 'row', items: [{ id: 'variant', label: 'Variant', value: <p>{'ao.N.1'}</p> }] }],
	});

	const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });

	expect(result.violations).toEqual([]);
});
