// @vitest-environment jsdom

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { executeGraphQL } from '../../../../src/api/graphql/client';
import { GraphQLPlayground } from '../../../../src/components/organisms/GraphQLPlayground';
import { AR_LMDB_GQL_GATEWAY, DEFAULT_GQL_PLAYGROUND_GATEWAYS, FLAGS } from '../../../../src/helpers/config';
import { lightTheme, theme } from '../../../../src/helpers/themes';

vi.mock('../../../../src/api/graphql/client', () => ({ executeGraphQL: vi.fn() }));
vi.mock('react-svg', () => ({ ReactSVG: () => null }));
vi.mock('components/atoms/Button', () => ({
	Button: (props: { onPress: () => void; tooltip?: string; label?: string; disabled?: boolean }) => (
		<button onClick={props.onPress} disabled={props.disabled}>
			{props.tooltip || props.label}
		</button>
	),
}));
vi.mock('components/atoms/FormField', () => ({
	FormField: (props: { value: string; onChange: React.ChangeEventHandler<HTMLInputElement> }) => (
		<input aria-label="Gateway" value={props.value} onChange={props.onChange} />
	),
}));
vi.mock('components/atoms/Select', () => ({
	Select: (props: {
		activeOption: { id: string };
		options: { id: string; label: string }[];
		setActiveOption: (option: { id: string; label: string }) => void;
		isOptionRemovable: (option: { id: string; label: string }) => boolean;
	}) => (
		<select
			aria-label="GraphQL source"
			value={props.activeOption.id}
			onChange={(event) => props.setActiveOption(props.options.find((option) => option.id === event.target.value))}
		>
			{props.options.map((option) => (
				<option key={option.id} value={option.id} data-removable={props.isOptionRemovable(option)}>
					{option.label}
				</option>
			))}
		</select>
	),
}));
vi.mock('components/atoms/Modal', () => ({
	Modal: (props: { children: React.ReactNode }) => <div>{props.children}</div>,
}));
vi.mock('components/molecules/Editor', () => ({
	Editor: (props: { onSubmit?: () => Promise<void>; loading?: boolean }) => (
		<button data-testid="execute" onClick={() => props.onSubmit?.()} disabled={props.loading}>
			Execute query
		</button>
	),
}));
vi.mock('components/molecules/JSONReader', () => ({
	JSONReader: (props: { data?: string }) => <pre data-testid="result">{props.data}</pre>,
}));

describe('GraphQL Playground sources', () => {
	let container: HTMLDivElement;
	let root: Root;

	beforeAll(() => {
		(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
	});

	beforeEach(() => {
		FLAGS.USE_AR_LMDB_GQL = true;
		localStorage.clear();
		vi.mocked(executeGraphQL).mockReset();
		vi.mocked(executeGraphQL).mockResolvedValue({ data: { transactions: { edges: [] } } });
		container = document.createElement('div');
		document.body.appendChild(container);
		root = createRoot(container);
	});

	afterEach(() => {
		React.act(() => root.unmount());
		container.remove();
		FLAGS.USE_AR_LMDB_GQL = true;
	});

	async function renderPlayground(initialGateway?: string, onGatewayChange = vi.fn()) {
		await React.act(async () => {
			root.render(
				<ThemeProvider theme={theme(lightTheme)}>
					<GraphQLPlayground
						playgroundId="test"
						active
						initialGateway={initialGateway}
						onGatewayChange={onGatewayChange}
					/>
				</ThemeProvider>
			);
		});
		return onGatewayChange;
	}

	async function selectSource(gateway: string) {
		await React.act(async () => {
			const select = container.querySelector('select');
			select.value = gateway;
			select.dispatchEvent(new Event('change', { bubbles: true }));
		});
	}

	it('defaults to AR LMDB, saves a local token, and always exposes its non-removable option', async () => {
		const onGatewayChange = await renderPlayground();
		expect(container.querySelector('select').value).toBe(AR_LMDB_GQL_GATEWAY);
		expect(container.querySelector('input').value).toBe(AR_LMDB_GQL_GATEWAY);
		expect(container.querySelector(`option[value="${AR_LMDB_GQL_GATEWAY}"]`).getAttribute('data-removable')).toBe(
			'false'
		);
		expect(onGatewayChange).toHaveBeenLastCalledWith(AR_LMDB_GQL_GATEWAY);
		await React.act(async () => container.querySelector<HTMLButtonElement>('[data-testid="execute"]').click());
		expect(executeGraphQL).toHaveBeenCalledWith(expect.objectContaining({ source: 'ar-lmdb' }));
	});

	it('honors a remote dropdown selection even when the application flag is enabled', async () => {
		await renderPlayground();
		await selectSource(DEFAULT_GQL_PLAYGROUND_GATEWAYS[0]);
		await React.act(async () => container.querySelector<HTMLButtonElement>('[data-testid="execute"]').click());
		expect(executeGraphQL).toHaveBeenCalledWith(expect.objectContaining({ source: 'remote' }));
	});

	it('uses the original remote default when disabled but still allows selecting AR LMDB', async () => {
		FLAGS.USE_AR_LMDB_GQL = false;
		await renderPlayground();
		expect(container.querySelector('select').value).toBe(DEFAULT_GQL_PLAYGROUND_GATEWAYS[0]);
		await selectSource(AR_LMDB_GQL_GATEWAY);
		await React.act(async () => container.querySelector<HTMLButtonElement>('[data-testid="execute"]').click());
		expect(executeGraphQL).toHaveBeenCalledWith(expect.objectContaining({ source: 'ar-lmdb' }));
	});

	it('migrates retired saved choices and preserves a saved remote tab', async () => {
		localStorage.setItem(
			'lunar-gql-gateways',
			JSON.stringify(['https://cache.forward.computer/graphql', 'custom.example'])
		);
		await renderPlayground('https://custom.example/graphql');
		expect(container.querySelector('select').value).toBe('custom.example');
		expect(JSON.parse(localStorage.getItem('lunar-gql-gateways'))).toEqual([AR_LMDB_GQL_GATEWAY, 'custom.example']);
	});

	it('cancels an old source request and prevents it from populating a newly selected source', async () => {
		let resolveQuery: (result: { data: { previousSource: boolean } }) => void;
		vi.mocked(executeGraphQL).mockReturnValueOnce(
			new Promise((resolve) => {
				resolveQuery = resolve;
			})
		);
		await renderPlayground();
		await React.act(async () => container.querySelector<HTMLButtonElement>('[data-testid="execute"]').click());
		const signal = vi.mocked(executeGraphQL).mock.calls[0][0].signal;
		await selectSource(DEFAULT_GQL_PLAYGROUND_GATEWAYS[0]);
		expect(signal.aborted).toBe(true);
		await React.act(async () => resolveQuery({ data: { previousSource: true } }));
		expect(container.querySelector('[data-testid="result"]').textContent).toBe('');
		expect(container.querySelector<HTMLButtonElement>('[data-testid="execute"]').disabled).toBe(false);
	});
});
