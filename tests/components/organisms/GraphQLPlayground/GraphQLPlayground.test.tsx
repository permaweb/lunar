// @vitest-environment jsdom

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { executeGraphQL } from '../../../../src/api/graphql/client';
import { setConfiguredGraphQLSource } from '../../../../src/api/graphql/source';
import { GraphQLPlayground } from '../../../../src/components/organisms/GraphQLPlayground';
import { AR_LMDB_GQL_GATEWAY, DEFAULT_GQL_PLAYGROUND_GATEWAYS, DOM } from '../../../../src/helpers/config';
import { lightTheme, theme } from '../../../../src/helpers/themes';

vi.mock('../../../../src/api/graphql/client', () => ({ executeGraphQL: vi.fn() }));
vi.mock('react-svg', () => ({ ReactSVG: () => null }));
vi.mock('components/atoms/Button', () => ({
	Button: (props: { onPress: () => void; tooltip?: string; label?: React.ReactNode; disabled?: boolean }) => (
		<button onClick={props.onPress} disabled={props.disabled} title={props.tooltip}>
			{props.label ?? props.tooltip}
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
	let overlay: HTMLDivElement;
	let root: Root;
	let elapsedNow: number;

	beforeAll(() => {
		(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
	});

	beforeEach(() => {
		setConfiguredGraphQLSource('ar-lmdb');
		localStorage.clear();
		vi.mocked(executeGraphQL).mockReset();
		vi.mocked(executeGraphQL).mockResolvedValue({ data: { transactions: { edges: [] } } });
		elapsedNow = 1_000;
		vi.spyOn(performance, 'now').mockImplementation(() => elapsedNow);
		container = document.createElement('div');
		document.body.appendChild(container);
		overlay = document.createElement('div');
		overlay.id = DOM.overlay;
		document.body.appendChild(overlay);
		root = createRoot(container);
	});

	afterEach(() => {
		React.act(() => root.unmount());
		container.remove();
		overlay.remove();
		vi.restoreAllMocks();
		setConfiguredGraphQLSource('ar-lmdb');
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

	function getHistoryButton(scope: ParentNode = container) {
		return scope.querySelector<HTMLButtonElement>('button[title="Query time history"]');
	}

	function getHistoryRows() {
		return Array.from(overlay.querySelectorAll('li'));
	}

	function getPanelButton(label: string) {
		return Array.from(overlay.querySelectorAll('button')).find((button) => button.textContent === label);
	}

	async function executeQuery(scope: ParentNode = container) {
		await React.act(async () => scope.querySelector<HTMLButtonElement>('[data-testid="execute"]').click());
	}

	function resolveNextQueryAfter(duration: number) {
		vi.mocked(executeGraphQL).mockImplementationOnce(async () => {
			elapsedNow += duration;
			return { data: { transactions: { edges: [] } } };
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

	it('honors a remote dropdown selection even when application settings select AR LMDB', async () => {
		await renderPlayground();
		await selectSource(DEFAULT_GQL_PLAYGROUND_GATEWAYS[0]);
		await React.act(async () => container.querySelector<HTMLButtonElement>('[data-testid="execute"]').click());
		expect(executeGraphQL).toHaveBeenCalledWith(expect.objectContaining({ source: 'remote' }));
	});

	it('uses the remote default when selected in settings but still allows selecting AR LMDB', async () => {
		setConfiguredGraphQLSource('remote');
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

	it('opens an empty query time panel from the control before the gateway dropdown and closes it with Escape', async () => {
		await renderPlayground();
		const historyButton = getHistoryButton();
		expect(historyButton.textContent).toBe('Query times');
		expect(
			historyButton.compareDocumentPosition(container.querySelector('select')) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
		await React.act(async () => {
			historyButton.focus();
			historyButton.click();
		});
		expect(overlay.textContent).toContain('Query time history');
		expect(overlay.textContent).toContain('Run a query to see its execution time here.');
		const dialog = overlay.querySelector('[role="dialog"]');
		expect(dialog.getAttribute('aria-modal')).toBe('true');
		expect(document.getElementById(dialog.getAttribute('aria-labelledby')).textContent).toBe('Query time history');
		expect(document.activeElement).toBe(getPanelButton('Close'));
		expect(getHistoryRows()).toHaveLength(0);
		expect(executeGraphQL).not.toHaveBeenCalled();
		await React.act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
		expect(overlay.textContent).toBe('');
		expect(document.activeElement).toBe(historyButton);
	});

	it('shows seconds and milliseconds for the latest query and all successful runs newest first', async () => {
		await renderPlayground();
		resolveNextQueryAfter(1_234);
		await executeQuery();
		expect(getHistoryButton().textContent).toBe('1s 234ms');
		await selectSource(DEFAULT_GQL_PLAYGROUND_GATEWAYS[0]);
		resolveNextQueryAfter(87);
		await executeQuery();
		expect(getHistoryButton().textContent).toBe('0s 87ms');
		await React.act(async () => getHistoryButton().click());
		const rows = getHistoryRows();
		expect(rows).toHaveLength(2);
		expect(rows[0].textContent).toContain('0s 87ms');
		expect(rows[0].textContent).toContain(DEFAULT_GQL_PLAYGROUND_GATEWAYS[0]);
		expect(rows[0].textContent).toContain('Run #2');
		expect(rows[1].textContent).toContain('1s 234ms');
		expect(rows[1].textContent).toContain('AR LMDB');
		expect(rows[1].textContent).toContain('Run #1');
		for (const row of rows) {
			expect(row.textContent).toContain('Success');
			expect(row.textContent).toContain('Transactions');
			expect(row.querySelector('time')?.dateTime).toBeTruthy();
		}
	});

	it('keeps older queries available on subsequent history pages without replacing the latest duration', async () => {
		await renderPlayground();
		for (let run = 1; run <= 21; run++) {
			resolveNextQueryAfter(run);
			await executeQuery();
		}
		expect(getHistoryButton().textContent).toBe('0s 21ms');
		await React.act(async () => getHistoryButton().click());
		expect(getHistoryRows()).toHaveLength(20);
		expect(getHistoryRows()[0].textContent).toContain('Run #21');
		expect(getHistoryRows()[19].textContent).toContain('Run #2');
		expect(getPanelButton('Previous').disabled).toBe(true);
		expect(getPanelButton('Next').disabled).toBe(false);
		await React.act(async () => {
			getPanelButton('Next').focus();
			document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
		});
		expect(document.activeElement).toBe(getPanelButton('Close'));
		await React.act(async () => {
			document.dispatchEvent(
				new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })
			);
		});
		expect(document.activeElement).toBe(getPanelButton('Next'));
		await React.act(async () => getPanelButton('Next').click());
		expect(getHistoryRows()).toHaveLength(1);
		expect(getHistoryRows()[0].textContent).toContain('Run #1');
		expect(getHistoryRows()[0].textContent).toContain('0s 1ms');
		expect(getPanelButton('Next').disabled).toBe(true);
		expect(getPanelButton('Previous').disabled).toBe(false);
		expect(getHistoryButton().textContent).toBe('0s 21ms');
		await React.act(async () => getPanelButton('Previous').click());
		expect(getHistoryRows()).toHaveLength(20);
		expect(getHistoryRows()[0].textContent).toContain('Run #21');
	});

	it('has accessible dialog and history semantics for a completed query', async () => {
		await renderPlayground();
		resolveNextQueryAfter(1_234);
		await executeQuery();
		await React.act(async () => getHistoryButton().click());
		// Contrast requires a real browser; jsdom does not implement canvas measurement.
		const result = await axe.run(overlay, { rules: { 'color-contrast': { enabled: false } } });
		expect(result.violations).toEqual([]);
	});

	it('records both GraphQL error responses and rejected requests as failed timings', async () => {
		await renderPlayground();
		vi.mocked(executeGraphQL).mockImplementationOnce(async () => {
			elapsedNow += 25;
			return { errors: [{ message: 'Unsupported query' }] };
		});
		await executeQuery();
		expect(getHistoryButton().textContent).toBe('0s 25ms');
		vi.mocked(executeGraphQL).mockImplementationOnce(async () => {
			elapsedNow += 2_009;
			throw new Error('Gateway unavailable');
		});
		await executeQuery();
		expect(getHistoryButton().textContent).toBe('2s 9ms');
		await React.act(async () => getHistoryButton().click());
		const rows = getHistoryRows();
		expect(rows).toHaveLength(2);
		expect(rows[0].textContent).toContain('2s 9ms');
		expect(rows[1].textContent).toContain('0s 25ms');
		for (const row of rows) expect(row.textContent).toContain('Failed');
	});

	it('keeps the complete timing history scoped to its mounted playground across tab switches', async () => {
		async function renderTabs(activeTab: string) {
			await React.act(async () => {
				root.render(
					<ThemeProvider theme={theme(lightTheme)}>
						<div data-testid="first-tab">
							<GraphQLPlayground playgroundId="first" active={activeTab === 'first'} />
						</div>
						<div data-testid="second-tab">
							<GraphQLPlayground playgroundId="second" active={activeTab === 'second'} />
						</div>
					</ThemeProvider>
				);
			});
		}
		await renderTabs('first');
		const firstTab = container.querySelector('[data-testid="first-tab"]');
		const secondTab = container.querySelector('[data-testid="second-tab"]');
		resolveNextQueryAfter(321);
		await executeQuery(firstTab);
		await renderTabs('second');
		expect(getHistoryButton(secondTab).textContent).toBe('Query times');
		await React.act(async () => getHistoryButton(secondTab).click());
		expect(getHistoryRows()).toHaveLength(0);
		await React.act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
		resolveNextQueryAfter(2_456);
		await executeQuery(secondTab);
		expect(getHistoryButton(secondTab).textContent).toBe('2s 456ms');
		await renderTabs('first');
		expect(getHistoryButton(firstTab).textContent).toBe('0s 321ms');
		await React.act(async () => getHistoryButton(firstTab).click());
		expect(getHistoryRows()).toHaveLength(1);
		expect(getHistoryRows()[0].textContent).toContain('0s 321ms');
		expect(overlay.textContent).not.toContain('2s 456ms');
	});

	it('records a source cancellation once and does not let its late completion replace a newer timing', async () => {
		let resolveQuery: (result: { data: { previousSource: boolean } }) => void;
		vi.mocked(executeGraphQL).mockReturnValueOnce(
			new Promise((resolve) => {
				resolveQuery = resolve;
			})
		);
		await renderPlayground();
		await executeQuery();
		elapsedNow += 456;
		await selectSource(DEFAULT_GQL_PLAYGROUND_GATEWAYS[0]);
		expect(vi.mocked(executeGraphQL).mock.calls[0][0].signal.aborted).toBe(true);
		expect(getHistoryButton().textContent).toBe('0s 456ms');
		resolveNextQueryAfter(12);
		await executeQuery();
		expect(getHistoryButton().textContent).toBe('0s 12ms');
		elapsedNow += 5_000;
		await React.act(async () => resolveQuery({ data: { previousSource: true } }));
		expect(getHistoryButton().textContent).toBe('0s 12ms');
		expect(container.querySelector('[data-testid="result"]').textContent).not.toContain('previousSource');
		await React.act(async () => getHistoryButton().click());
		const rows = getHistoryRows();
		expect(rows).toHaveLength(2);
		expect(rows[0].textContent).toContain('Success');
		expect(rows[0].textContent).toContain('0s 12ms');
		expect(rows[1].textContent).toContain('Cancelled');
		expect(rows[1].textContent).toContain('0s 456ms');
		expect(rows[1].textContent).toContain('AR LMDB');
	});
});
