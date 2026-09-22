// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { requestRemote } from '../../../../src/api/http';
import { GraphQLPlayground } from '../../../../src/components/organisms/GraphQLPlayground';
import { GRAPHQL_GATEWAYS_STORAGE_KEY } from '../../../../src/helpers/graphql';
import { darkTheme, lightTheme, theme } from '../../../../src/helpers/themes';

vi.mock('api/http', () => ({ requestRemote: vi.fn() }));
vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden="true" /> }));
vi.mock('components/molecules/Editor', () => ({
	Editor: (props: { initialData: string }) => <pre data-testid="editor">{props.initialData}</pre>,
}));
vi.mock('components/molecules/JSONReader', () => ({ JSONReader: () => null }));

const intRef = { kind: 'SCALAR', name: 'Int' };
const rangeRef = { kind: 'INPUT_OBJECT', name: 'RangeFilter' };
const transactionRef = { kind: 'OBJECT', name: 'Transaction' };
const transactionListRef = {
	kind: 'NON_NULL',
	ofType: { kind: 'LIST', ofType: { kind: 'NON_NULL', ofType: transactionRef } },
};
const schema = {
	queryType: { name: 'Query' },
	types: [
		{
			kind: 'OBJECT',
			name: 'Query',
			fields: [
				{ name: 'transactions', args: [{ name: 'range', type: rangeRef }], type: transactionListRef },
				{ name: 'blocks', args: [{ name: 'range', type: rangeRef }], type: intRef },
				{ name: 'search', type: { kind: 'UNION', name: 'SearchResult' } },
				{ name: 'unknown', type: { kind: 'SCALAR', name: 'Unavailable' } },
			],
		},
		{
			...rangeRef,
			description: 'Restrict results to an inclusive range.',
			inputFields: [
				{ name: 'min', type: intRef, defaultValue: '0', description: 'The minimum included value.' },
				{ name: 'max', type: intRef, description: 'No description provided' },
				{ name: 'nested', type: rangeRef },
				{ name: 'sort', type: { kind: 'ENUM', name: 'SortOrder' }, defaultValue: 'ASC' },
			],
		},
		{
			...intRef,
			description: 'A signed 32-bit integer.',
		},
		{
			kind: 'ENUM',
			name: 'SortOrder',
			description: 'No description provided',
			enumValues: [
				{ name: 'ASC', description: 'Lowest values first.' },
				{ name: 'DESC', isDeprecated: true, deprecationReason: 'Use the reverse argument instead.' },
			],
		},
		{
			...transactionRef,
			description: 'An indexed transaction.',
			fields: [
				{
					name: 'related',
					type: transactionListRef,
					args: [{ name: 'range', type: rangeRef, description: 'Filter related transactions.' }],
				},
			],
		},
		{
			kind: 'UNION',
			name: 'SearchResult',
			possibleTypes: [transactionRef],
		},
	],
};

let container: HTMLElement;
let overlay: HTMLElement;
let root: ReturnType<typeof createRoot>;
let run = 0;
let endpoint: string;

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.stubGlobal('matchMedia', () => ({ matches: true }));
	endpoint = `https://schema-${++run}.example`;
	localStorage.setItem(GRAPHQL_GATEWAYS_STORAGE_KEY, JSON.stringify([endpoint]));
	vi.mocked(requestRemote).mockImplementation(async () => new Response(JSON.stringify({ data: { __schema: schema } })));
	container = document.createElement('main');
	overlay = document.createElement('div');
	overlay.id = 'overlay';
	document.body.append(container, overlay);
	root = createRoot(container);
});

afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	overlay.remove();
	localStorage.removeItem(GRAPHQL_GATEWAYS_STORAGE_KEY);
	vi.unstubAllGlobals();
});

async function openDocs(palette = darkTheme) {
	await React.act(async () =>
		root.render(
			<ThemeProvider theme={theme(palette)}>
				<GraphQLPlayground playgroundId="docs-test" active initialGateway={endpoint} initialQuery="query { blocks }" />
			</ThemeProvider>
		)
	);
	await React.act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Docs"]').click());
}

function buttons(label: string, scope: ParentNode = overlay) {
	return Array.from(scope.querySelectorAll<HTMLButtonElement>('button')).filter(
		(button) => button.textContent === label
	);
}

async function expand(button: HTMLButtonElement) {
	await React.act(async () => button.click());
	expect(button.getAttribute('aria-expanded')).toBe('true');
	const details = document.getElementById(button.getAttribute('aria-controls'));
	expect(details).not.toBeNull();
	return details;
}

it('expands nested input types on demand and clears descendants when collapsed', async () => {
	await openDocs();
	const [range, otherRange] = buttons('RangeFilter');
	expect(overlay.textContent).not.toContain('Restrict results to an inclusive range.');
	const details = await expand(range);
	expect(details.textContent).toContain('Restrict results to an inclusive range.');
	expect(details.textContent).toContain('min: Int = 0');
	expect(details.textContent).toContain('The minimum included value.');
	expect(otherRange.getAttribute('aria-expanded')).toBe('false');

	const nested = buttons('RangeFilter', details)[0];
	const nestedDetails = await expand(nested);
	expect(buttons('RangeFilter', nestedDetails)[0].getAttribute('aria-expanded')).toBe('false');
	expect(details.querySelectorAll('[aria-expanded="true"]')).toHaveLength(1);

	await React.act(async () => range.click());
	expect(overlay.contains(details)).toBe(false);
	const reopened = await expand(range);
	expect(buttons('RangeFilter', reopened)[0].getAttribute('aria-expanded')).toBe('false');
	expect(requestRemote).toHaveBeenCalledTimes(1);
	expect(container.querySelector('[data-testid="editor"]').textContent).toBe('query { blocks }');
});

it.each([darkTheme, lightTheme])(
	'shows scalar and enum descriptions with accessible controls in $scheme mode',
	async (palette) => {
		await openDocs(palette);
		const details = await expand(buttons('RangeFilter')[0]);
		const scalar = await expand(buttons('Int', details)[0]);
		expect(scalar.textContent).toContain('A signed 32-bit integer.');
		const enumeration = await expand(buttons('SortOrder', details)[0]);
		expect(enumeration.textContent).toContain('One of the following values.');
		expect(details.textContent).not.toContain('No description provided');
		expect(enumeration.textContent).toContain('Lowest values first.');
		expect(enumeration.textContent).toContain('Use the reverse argument instead.');
		expect((await axe.run(overlay, { rules: { 'color-contrast': { enabled: false } } })).violations).toEqual([]);
	}
);

it('unwraps list and required types and supports nested output field arguments', async () => {
	await openDocs();
	const details = await expand(buttons('[Transaction!]!')[0]);
	expect(details.textContent).toContain('An indexed transaction.');
	const argument = await expand(buttons('RangeFilter', details)[0]);
	expect(argument.textContent).toContain('The minimum included value.');
	const nested = await expand(buttons('[Transaction!]!', details)[0]);
	expect(nested.textContent).toContain('An indexed transaction.');
	expect(buttons('[Transaction!]!', nested)[0].getAttribute('aria-expanded')).toBe('false');
	expect(buttons('Unavailable')).toHaveLength(0);
});

it('expands union members and types in the type catalog', async () => {
	await openDocs();
	const union = await expand(buttons('SearchResult')[0]);
	expect(union.textContent).toContain('A result that can be any of the listed object types.');
	const member = await expand(buttons('Transaction', union)[0]);
	expect(member.textContent).toContain('An indexed transaction.');
	const catalogType = buttons('RangeFilter').at(-1);
	const catalogDetails = await expand(catalogType);
	expect(catalogDetails.textContent).toContain('Restrict results to an inclusive range.');
	expect(JSON.parse(vi.mocked(requestRemote).mock.calls[0][1].body as string).query).toContain('possibleTypes');
});

it('resets expansions when docs reopen and preserves the Use action', async () => {
	await openDocs();
	await expand(buttons('RangeFilter')[0]);
	await React.act(async () => overlay.querySelector<HTMLButtonElement>('[aria-label="Close"]').click());
	await React.act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Docs"]').click());
	expect(buttons('RangeFilter')[0].getAttribute('aria-expanded')).toBe('false');
	await React.act(async () => buttons('Use')[0].click());
	expect(overlay.querySelector('[role="dialog"]')).toBeNull();
	expect(container.querySelector('[data-testid="editor"]').textContent).toContain('query TransactionsQuery');
});
