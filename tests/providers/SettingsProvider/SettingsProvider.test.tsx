// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { DEFAULT_AO_NETWORK } from '../../../src/helpers/aoNetwork';
import { SettingsProvider, useSettingsProvider } from '../../../src/providers/SettingsProvider';

vi.mock('providers/NotificationProvider', () => ({
	NotificationViewport: () => null,
	useNotifications: () => ({ addNotification: vi.fn(), removeNotification: vi.fn() }),
}));
vi.mock('components/atoms/Modal', () => ({
	Modal: (props) => <section aria-label={props.header}>{props.children}</section>,
}));
vi.mock('api/aoNetwork', () => {
	const status = {
		source: 'peers',
		extensionAvailable: false,
		processPeers: [],
		schedulePeers: [],
		linkedStatePeers: [],
	};
	return { getAoReadTransport: () => ({ getStatus: () => status, subscribe: () => () => {} }) };
});
vi.mock('react-svg', () => ({ ReactSVG: () => null }));

let current: ReturnType<typeof useSettingsProvider>;
function Harness() {
	current = useSettingsProvider();
	return <pre>{JSON.stringify(current.settings.aoNetwork)}</pre>;
}
let container: HTMLElement;
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
	localStorage.clear();
	container = document.createElement('div');
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});
const render = async () =>
	React.act(async () =>
		root.render(
			<SettingsProvider>
				<Harness />
			</SettingsProvider>
		)
	);

it('adds peer defaults to existing settings while preserving the AOS node', async () => {
	localStorage.setItem(
		'settings',
		JSON.stringify({ nodes: [{ url: 'https://old-aos.example', authority: 'test', active: true }] })
	);
	await render();
	expect(current.settings.nodes[0].url).toBe('https://old-aos.example');
	expect(current.settings.aoNetwork).toEqual(DEFAULT_AO_NETWORK);
	await React.act(async () => current.setShowNodeSettings(true));
	expect(container.textContent).toContain('AOS Node');
	expect(container.textContent).toContain('alpha.neo.zephyrdev.xyz');
	expect(container.querySelector('input[aria-label="AO peers"]')).not.toBeNull();
});

it('persists new peer and fallback preferences and restores them independently of AOS', async () => {
	await render();
	const network = { peers: ['https://custom.example'], preferPermawebOS: false, fallbackToPeers: false };
	await React.act(async () => current.updateSettings('aoNetwork', network));
	await new Promise((resolve) => setTimeout(resolve, 5));
	expect(JSON.parse(localStorage.getItem('settings')).aoNetwork).toEqual(network);
	await React.act(async () => root.unmount());
	root = createRoot(container);
	await render();
	expect(current.settings.aoNetwork).toEqual(network);
});

it('recovers from malformed saved settings', async () => {
	localStorage.setItem('settings', '{broken');
	await render();
	expect(current.settings.aoNetwork).toEqual(DEFAULT_AO_NETWORK);
});
