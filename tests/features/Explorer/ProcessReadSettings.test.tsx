// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { readProcessReadPreferences } from '../../../src/api/aoNetwork';
import { ProcessReadSettingsControl } from '../../../src/features/Explorer/components/organisms/ProcessReadSettingsControl';
import { DEFAULT_AO_NETWORK } from '../../../src/helpers/aoNetwork';
import { DEFAULT_GRAPHQL_ENDPOINT } from '../../../src/helpers/config';
import { darkTheme, theme } from '../../../src/helpers/themes';
import { useAoReadNetwork } from '../../../src/hooks/useAoReadNetwork';
import { PermawebProvider, usePermawebProvider } from '../../../src/providers/PermawebProvider';
import {
	ProcessReadSettingsProvider,
	useProcessReadSettingsProvider,
} from '../../../src/providers/ProcessReadSettingsProvider';

const mocks = vi.hoisted(() => ({ network: null, createPeerApi: vi.fn(), legacyApi: { readProcess: vi.fn() } }));
vi.mock('providers/SettingsProvider', () => ({
	useSettingsProvider: () => ({
		settings: { aoNetwork: mocks.network, graphqlEndpoint: DEFAULT_GRAPHQL_ENDPOINT, nodes: [], legacyComputeNode: '' },
	}),
}));
vi.mock('providers/ArweaveProvider', () => ({ useArweaveProvider: () => ({ wallet: null }) }));
vi.mock('api/permaweb', () => ({
	createPeerApi: mocks.createPeerApi,
	createPermawebApis: () => ({ legacyApi: mocks.legacyApi, aosApi: null }),
}));
vi.mock('react-svg', () => ({ ReactSVG: () => null }));

const first = 'a'.repeat(43);
const second = 'b'.repeat(43);
const scopes = new Map<string, ReturnType<typeof useProcessReadSettingsProvider>>();
const apis = new Map<string, ReturnType<typeof usePermawebProvider>>();
const networks = new Map<string, ReturnType<typeof useAoReadNetwork>>();
let container: HTMLElement;
let overlay: HTMLElement;
let root: ReturnType<typeof createRoot>;
function Harness(props: { id: string; control?: boolean }) {
	scopes.set(props.id, useProcessReadSettingsProvider());
	apis.set(props.id, usePermawebProvider());
	networks.set(props.id, useAoReadNetwork());
	return props.control ? <ProcessReadSettingsControl /> : null;
}
beforeEach(() => {
	vi.clearAllMocks();
	localStorage.clear();
	scopes.clear();
	apis.clear();
	networks.clear();
	mocks.network = { ...DEFAULT_AO_NETWORK, peers: ['https://global.example'] };
	mocks.createPeerApi.mockImplementation((network) => ({
		readStateWithSource: async () => ({ data: {}, provider: network.peers[0] }),
	}));
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
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
	vi.unstubAllGlobals();
});
async function render(id = first, enabled = true, control = false) {
	await React.act(async () =>
		root.render(
			<ThemeProvider theme={theme(darkTheme)}>
				<PermawebProvider>
					<ProcessReadSettingsProvider processId={id} enabled={enabled}>
						<Harness id={id} control={control} />
					</ProcessReadSettingsProvider>
					<ProcessReadSettingsProvider processId={second} enabled>
						<Harness id={second} />
					</ProcessReadSettingsProvider>
				</PermawebProvider>
			</ThemeProvider>
		)
	);
}
function checkbox(label: string) {
	return overlay.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`);
}
function button(label: string) {
	return Array.from(overlay.querySelectorAll<HTMLButtonElement>('button')).find((node) => node.textContent === label);
}
async function typeInto(input: HTMLInputElement, value: string) {
	await React.act(async () => {
		Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
		input.dispatchEvent(new Event('input', { bubbles: true }));
	});
}

it('scopes current state, schedules, and linked reads without changing the other process or global APIs', async () => {
	await render();
	const global = apis.get(first).mainnetApi;
	expect(scopes.get(first).useGlobal).toBe(true);
	expect(apis.get(second).mainnetApi).toBe(global);
	await React.act(async () => scopes.get(first).onUseGlobalChange(false));
	const custom = { peers: ['http://173.255.230.49:10000'], preferPermawebOS: false, fallbackToPeers: false };
	await React.act(async () => scopes.get(first).onNetworkChange(custom));
	expect(scopes.get(first).network).toEqual(custom);
	expect(networks.get(first)).toEqual(custom);
	expect(apis.get(first).mainnetApi).not.toBe(global);
	expect(apis.get(first).legacyApi).toBe(mocks.legacyApi);
	expect(apis.get(second).mainnetApi).toBe(global);
	expect(mocks.network.peers).toEqual(['https://global.example']);
	expect(readProcessReadPreferences(first)).toEqual({ useGlobal: false, network: custom });
	await React.act(async () => scopes.get(first).onUseGlobalChange(true));
	expect(apis.get(first).mainnetApi).toBe(global);
	mocks.network = { ...mocks.network, peers: ['https://new-global.example'] };
	await render();
	expect(networks.get(first)).toBe(mocks.network);
	await React.act(async () => scopes.get(first).onUseGlobalChange(false));
	expect(networks.get(first)).toEqual(custom);
});

it('restores saved settings across unmounts and handles changing the process ID without leaking settings', async () => {
	await render();
	await React.act(async () => scopes.get(first).onUseGlobalChange(false));
	const custom = { ...DEFAULT_AO_NETWORK, peers: ['https://custom.example'] };
	await React.act(async () => scopes.get(first).onNetworkChange(custom));
	await React.act(async () => root.unmount());
	root = createRoot(container);
	await render();
	expect(scopes.get(first).useGlobal).toBe(false);
	expect(networks.get(first)).toEqual(custom);
	const third = 'c'.repeat(43);
	await render(third);
	expect(scopes.get(third).useGlobal).toBe(true);
	expect(networks.get(third)).toBe(mocks.network);
	await render(first, false);
	expect(networks.get(first)).toBe(mocks.network);
});

it('disables inherited settings, enables process edits, validates peers, and saves HTTP origins from the panel', async () => {
	await render(first, true, true);
	await React.act(async () =>
		container.querySelector<HTMLButtonElement>('button[aria-label="Process Read Settings"]').click()
	);
	expect(checkbox('Use Global Read Settings').checked).toBe(true);
	expect(checkbox('Prefer PermawebOS').disabled).toBe(true);
	expect(checkbox('Fall back to peers on failure').disabled).toBe(true);
	const input = overlay.querySelector<HTMLInputElement>('input[aria-label="AO peers"]');
	expect(input.disabled).toBe(true);
	expect(button('Reset peers').disabled).toBe(true);
	await React.act(async () => checkbox('Use Global Read Settings').click());
	expect(checkbox('Prefer PermawebOS').disabled).toBe(false);
	expect(input.disabled).toBe(false);
	await React.act(async () => checkbox('Prefer PermawebOS').click());
	expect(checkbox('Fall back to peers on failure').disabled).toBe(true);
	await typeInto(input, 'ftp://invalid.example');
	expect(button('Save peers').disabled).toBe(true);
	await typeInto(input, 'http://173.255.230.49:10000/');
	await React.act(async () => button('Save peers').click());
	expect(readProcessReadPreferences(first).network.peers).toEqual(['http://173.255.230.49:10000']);
	expect(mocks.network.peers).toEqual(['https://global.example']);
	await React.act(async () => checkbox('Use Global Read Settings').click());
	expect(input.value).toBe('https://global.example');
	expect(input.disabled).toBe(true);
	const result = await axe.run(overlay, { rules: { 'color-contrast': { enabled: false } } });
	expect(result.violations).toEqual([]);
});

it('reports persistence failures and keeps the chosen settings active in memory', async () => {
	await render(first, true, true);
	await React.act(async () =>
		container.querySelector<HTMLButtonElement>('button[aria-label="Process Read Settings"]').click()
	);
	const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
		throw new Error('quota');
	});
	await React.act(async () => checkbox('Use Global Read Settings').click());
	expect(scopes.get(first).useGlobal).toBe(false);
	expect(overlay.querySelector('[role="alert"]').textContent).toContain('could not be saved');
	spy.mockRestore();
});
