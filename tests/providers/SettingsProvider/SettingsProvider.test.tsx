// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestRemote } from '../../../src/api/http';
import { DEFAULT_AO_NETWORK } from '../../../src/helpers/aoNetwork';
import { DEFAULT_GRAPHQL_ENDPOINT } from '../../../src/helpers/config';
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
vi.mock('api/http', () => ({ requestRemote: vi.fn() }));

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

function getButton(label: string) {
	return Array.from(container.querySelectorAll('button')).find((button) => button.textContent === label);
}

async function typeInto(input: HTMLInputElement, value: string) {
	await React.act(async () => {
		Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
		input.dispatchEvent(new Event('input', { bubbles: true }));
	});
}

it('restores a saved GraphQL endpoint and replaces an invalid one with the default', async () => {
	localStorage.setItem('settings', JSON.stringify({ graphqlEndpoint: 'https://gateway.example/graphql' }));
	await render();
	expect(current.settings.graphqlEndpoint).toBe('https://gateway.example/graphql');

	await React.act(async () => root.unmount());
	localStorage.setItem('settings', JSON.stringify({ graphqlEndpoint: 'not a url' }));
	root = createRoot(container);
	await render();
	expect(current.settings.graphqlEndpoint).toBe(DEFAULT_GRAPHQL_ENDPOINT);
});

it('saves, rejects, and resets the GraphQL endpoint from the network settings', async () => {
	await render();
	await React.act(async () => current.setShowNodeSettings(true));
	expect(container.textContent).toContain('GraphQL Endpoint');
	const input = container.querySelector<HTMLInputElement>('input[aria-label="Endpoint URL"]');
	expect(input.value).toBe(DEFAULT_GRAPHQL_ENDPOINT);
	expect(getButton('Save endpoint').disabled).toBe(true);
	expect(getButton('Reset endpoint').disabled).toBe(true);

	await typeInto(input, 'gateway.example/graphql');
	expect(container.textContent).toContain('Enter a full HTTP or HTTPS GraphQL URL.');
	expect(getButton('Save endpoint').disabled).toBe(true);

	await typeInto(input, 'https://gateway.example');
	await React.act(async () => getButton('Save endpoint').click());
	expect(current.settings.graphqlEndpoint).toBe('https://gateway.example/graphql');
	expect(input.value).toBe('https://gateway.example/graphql');

	await React.act(async () => getButton('Reset endpoint').click());
	expect(current.settings.graphqlEndpoint).toBe(DEFAULT_GRAPHQL_ENDPOINT);
	expect(input.value).toBe(DEFAULT_GRAPHQL_ENDPOINT);
});

it('keeps the network settings open after selecting an AOS node', async () => {
	localStorage.setItem(
		'settings',
		JSON.stringify({
			nodes: [
				{ url: 'https://first-aos.example', authority: 'first', active: true },
				{ url: 'https://second-aos.example', authority: 'second', active: false },
			],
		})
	);
	await render();
	await React.act(async () => current.setShowNodeSettings(true));
	const secondNode = Array.from(container.querySelectorAll('p')).find(
		(element) => element.textContent === 'https://second-aos.example'
	);

	await React.act(async () => secondNode.click());

	expect(current.settings.nodes.find((node) => node.active).url).toBe('https://second-aos.example');
	expect(current.showNodeSettings).toBe(true);
});

describe('adding an AOS node', () => {
	beforeEach(() => {
		vi.mocked(requestRemote).mockReset();
		vi.mocked(requestRemote).mockResolvedValue(new Response('new-authority'));
	});

	async function openWithNodeUrl(url: string) {
		await render();
		await React.act(async () => current.setShowNodeSettings(true));
		const input = container.querySelector<HTMLInputElement>('input[placeholder="http://localhost:8734"]');
		await typeInto(input, url);

		return input;
	}

	it('adds the node when the form is submitted, as pressing Enter does', async () => {
		const input = await openWithNodeUrl('https://new-aos.example');

		await React.act(async () => {
			input.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		});

		expect(requestRemote).toHaveBeenCalledOnce();
		expect(requestRemote).toHaveBeenCalledWith('https://new-aos.example/~meta@1.0/info/address');
		expect(current.settings.nodes.find((node) => node.active).url).toBe('https://new-aos.example');
	});

	it('adds the node once when the Add Node button is clicked', async () => {
		await openWithNodeUrl('https://new-aos.example');

		await React.act(async () => getButton('Add Node').click());

		expect(requestRemote).toHaveBeenCalledOnce();
		expect(current.settings.nodes.find((node) => node.active).url).toBe('https://new-aos.example');
	});
});
