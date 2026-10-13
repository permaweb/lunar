// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { getTransactionIndexQuery, setGraphQLEndpoint } from '../../../src/api/graphql';
import { requestRemote } from '../../../src/api/http';
import { TransactionGraphQL } from '../../../src/features/Explorer/components/organisms/TransactionGraphQL';
import { ASSETS, DEFAULT_GRAPHQL_ENDPOINT } from '../../../src/helpers/config';
import { darkTheme, lightTheme, theme } from '../../../src/helpers/themes';

vi.mock('api/http', () => ({ requestRemote: vi.fn() }));
vi.mock('react-svg', () => ({
	ReactSVG: (props: { src: string }) => <svg aria-hidden="true" data-icon={props.src} />,
}));
const editors = vi.hoisted(
	() => new Map<string, { initialData: string; onSubmit?: (query?: string) => Promise<void> }>()
);
vi.mock('components/molecules/Editor', () => ({
	Editor: (props: { initialData: string; language: string; onSubmit?: () => void }) => {
		editors.set(props.language, props);
		return <pre>{props.initialData}</pre>;
	},
}));
vi.mock('components/molecules/JSONReader', () => ({
	JSONReader: (props: { data: string }) => <pre>{props.data}</pre>,
}));

const id = 'a'.repeat(43);
const otherId = 'b'.repeat(43);
const endpoint = 'http://localhost:8734/~query@1.0/graphql';
const indexed = { data: { transactions: { edges: [{ node: { id } }] } } };
const missing = { data: { transactions: { edges: [] } } };
let root: ReturnType<typeof createRoot>;
let container: HTMLElement;
let overlay: HTMLElement;

beforeEach(() => {
	vi.resetAllMocks();
	editors.clear();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.stubGlobal('matchMedia', () => ({ matches: true }));
	setGraphQLEndpoint(endpoint);
	vi.mocked(requestRemote).mockImplementation(async () => new Response(JSON.stringify(indexed)));
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
	setGraphQLEndpoint(DEFAULT_GRAPHQL_ENDPOINT);
	vi.unstubAllGlobals();
});

async function render(props = { txId: id, active: true, refreshKey: 0 }, palette = darkTheme) {
	await React.act(async () =>
		root.render(
			<ThemeProvider theme={theme(palette)}>
				<TransactionGraphQL {...props} />
			</ThemeProvider>
		)
	);
}

function chip() {
	return container.querySelector<HTMLButtonElement>('button');
}

it.each([darkTheme, lightTheme])(
	'opens an accessible panel with the ID query, exact endpoint and initial response in $scheme',
	async (palette) => {
		await render(undefined, palette);
		expect(chip().getAttribute('aria-label')).toBe('GQL: Available in GraphQL');
		expect(chip().querySelector('svg').getAttribute('data-icon')).toBe(ASSETS.success);
		chip().focus();
		await React.act(async () => chip().click());
		expect(overlay.querySelector('[role="dialog"]').getAttribute('aria-modal')).toBe('true');
		expect(editors.get('graphql').initialData).toBe(getTransactionIndexQuery(id));
		expect(overlay.querySelector<HTMLInputElement>('input').value).toBe(endpoint.replace(/\/graphql$/, ''));
		expect(overlay.textContent).toContain(JSON.stringify(indexed, null, 2));
		expect(requestRemote).toHaveBeenCalledTimes(1);
		const accessibility = await axe.run(overlay, { rules: { 'color-contrast': { enabled: false } } });
		expect(accessibility.violations).toEqual([]);
		await React.act(async () => overlay.querySelector<HTMLButtonElement>('[aria-label="Close"]').click());
		expect(overlay.querySelector('[role="dialog"]')).toBeNull();
		expect(document.activeElement).toBe(chip());
	}
);

it('shows a red X for an index miss and updates the chip after rerunning the seeded query', async () => {
	vi.mocked(requestRemote).mockResolvedValueOnce(new Response(JSON.stringify(missing)));
	await render();
	expect(chip().getAttribute('aria-label')).toBe('GQL: Not available in GraphQL');
	expect(chip().querySelector('svg').getAttribute('data-icon')).toBe(ASSETS.close);
	await React.act(async () => chip().click());
	await React.act(async () => editors.get('graphql').onSubmit());
	expect(requestRemote).toHaveBeenNthCalledWith(
		2,
		endpoint,
		expect.objectContaining({ body: JSON.stringify({ query: getTransactionIndexQuery(id) }) })
	);
	expect(chip().getAttribute('aria-label')).toBe('GQL: Available in GraphQL');
});

it('keeps endpoint errors distinct from a confirmed index miss and allows opening the query', async () => {
	vi.mocked(requestRemote).mockResolvedValueOnce(new Response(null, { status: 503 }));
	await render();
	expect(chip().getAttribute('aria-label')).toContain('Unable to check');
	expect(chip().querySelector('svg').getAttribute('data-icon')).toBe(ASSETS.pending);
	await React.act(async () => chip().click());
	expect(editors.get('graphql').initialData).toContain(id);
});

it('does not query hidden tabs and rechecks availability on explorer refresh', async () => {
	await render({ txId: id, active: false, refreshKey: 0 });
	expect(requestRemote).not.toHaveBeenCalled();
	await render();
	expect(requestRemote).toHaveBeenCalledTimes(1);
	vi.mocked(requestRemote).mockResolvedValueOnce(new Response(JSON.stringify(missing)));
	await render({ txId: id, active: true, refreshKey: 1 });
	expect(chip().getAttribute('aria-label')).toBe('GQL: Not available in GraphQL');
});

it('aborts superseded checks and prevents stale responses from replacing the current ID', async () => {
	let complete: (response: Response) => void;
	vi.mocked(requestRemote).mockImplementationOnce(() => new Promise((resolve) => (complete = resolve)));
	await render();
	const signal = vi.mocked(requestRemote).mock.calls[0][1].signal;
	await render({ txId: otherId, active: true, refreshKey: 0 });
	expect(signal.aborted).toBe(true);
	// The default mocked response contains the old ID, so it must be rejected for the current ID.
	expect(chip().getAttribute('aria-label')).toContain('Unable to check');
	await React.act(async () => complete(new Response(JSON.stringify(indexed))));
	expect(chip().getAttribute('aria-label')).toContain('Unable to check');
});
