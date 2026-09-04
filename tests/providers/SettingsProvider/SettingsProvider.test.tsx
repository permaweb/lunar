// @vitest-environment jsdom

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import axe from 'axe-core';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { getConfiguredGraphQLSource, setConfiguredGraphQLSource } from '../../../src/api/graphql/source';
import { DOM } from '../../../src/helpers/config';
import { NotificationProvider } from '../../../src/providers/NotificationProvider';
import { SettingsProvider, useSettingsProvider } from '../../../src/providers/SettingsProvider';

vi.mock('react-svg', () => ({ ReactSVG: () => null }));

describe('SettingsProvider GraphQL source', () => {
	let container: HTMLDivElement;
	let overlay: HTMLDivElement;
	let root: Root;
	let context: ReturnType<typeof useSettingsProvider>;

	function SettingsConsumer() {
		context = useSettingsProvider();
		return (
			<>
				<output aria-label="Configured source">{context.settings.graphqlSource}</output>
				<button onClick={() => context.setShowNodeSettings(true)}>Open Settings</button>
			</>
		);
	}

	beforeAll(() => {
		(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
	});

	beforeEach(() => {
		localStorage.clear();
		setConfiguredGraphQLSource('ar-lmdb');
		localStorage.removeItem('lunar-graphql-source');
		vi.stubGlobal(
			'matchMedia',
			vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
		);
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
		vi.unstubAllGlobals();
	});

	async function renderSettings() {
		await React.act(async () => {
			root.render(
				<NotificationProvider>
					<SettingsProvider>
						<SettingsConsumer />
					</SettingsProvider>
				</NotificationProvider>
			);
		});
		await React.act(async () => container.querySelector('button').click());
	}

	function getSourceButton(label: string) {
		return Array.from(overlay.querySelectorAll<HTMLButtonElement>('button')).find(
			(button) => button.textContent === label
		);
	}

	it('shows AR LMDB as the default with named, keyboard-focusable source controls', async () => {
		await renderSettings();
		expect(overlay.textContent).toContain('GraphQL Source');
		expect(getSourceButton('AR LMDB').getAttribute('aria-pressed')).toBe('true');
		expect(getSourceButton('Remote').getAttribute('aria-pressed')).toBe('false');
		expect(getSourceButton('Remote').tabIndex).toBe(0);
		expect(container.querySelector('output').textContent).toBe('ar-lmdb');
		const group = overlay.querySelector<HTMLElement>('[role="group"]');
		expect(group.getAttribute('aria-labelledby')).toBe('settings-graphql-source-label');
		expect((await axe.run(group, { rules: { 'color-contrast': { enabled: false } } })).violations).toEqual([]);
	});

	it('restores the source separately and preserves existing settings without persisting a conflicting copy', async () => {
		localStorage.setItem('lunar-graphql-source', 'remote');
		localStorage.setItem(
			'settings',
			JSON.stringify({ graphqlSource: 'ar-lmdb', theme: 'dark-primary', syncWithSystem: false, showNodeStatus: false })
		);
		await renderSettings();
		expect(getSourceButton('Remote').getAttribute('aria-pressed')).toBe('true');
		expect(context.settings.theme).toBe('dark-primary');
		expect(context.settings.showNodeStatus).toBe(false);
		await React.act(async () => new Promise((resolve) => window.setTimeout(resolve, 1)));
		const persisted = JSON.parse(localStorage.getItem('settings'));
		expect(persisted.graphqlSource).toBeUndefined();
		expect(persisted.theme).toBe('dark-primary');
		expect(persisted.showNodeStatus).toBe(false);
	});

	it('updates routing and UI immediately from both the source controls and updateSettings', async () => {
		await renderSettings();
		await React.act(async () => getSourceButton('Remote').click());
		expect(getConfiguredGraphQLSource()).toBe('remote');
		expect(localStorage.getItem('lunar-graphql-source')).toBe('remote');
		expect(container.querySelector('output').textContent).toBe('remote');
		expect(getSourceButton('Remote').getAttribute('aria-pressed')).toBe('true');
		await React.act(async () => context.updateSettings('showNodeStatus', false));
		expect(getConfiguredGraphQLSource()).toBe('remote');
		await React.act(async () => context.updateSettings('graphqlSource', 'ar-lmdb'));
		expect(getConfiguredGraphQLSource()).toBe('ar-lmdb');
		expect(container.querySelector('output').textContent).toBe('ar-lmdb');
	});

	it('reflects cross-tab source changes without resetting other settings', async () => {
		await renderSettings();
		await React.act(async () => context.updateSettings('showNodeStatus', false));
		await React.act(async () => {
			localStorage.setItem('lunar-graphql-source', 'remote');
			window.dispatchEvent(new StorageEvent('storage', { key: 'lunar-graphql-source', newValue: 'remote' }));
		});
		expect(getSourceButton('Remote').getAttribute('aria-pressed')).toBe('true');
		expect(context.settings.showNodeStatus).toBe(false);
	});

	it('keeps the settings panel usable with malformed persisted settings', async () => {
		localStorage.setItem('settings', '{');
		localStorage.setItem('lunar-graphql-source', 'invalid');
		await renderSettings();
		expect(getSourceButton('AR LMDB').getAttribute('aria-pressed')).toBe('true');
		await React.act(async () => getSourceButton('Remote').click());
		expect(getConfiguredGraphQLSource()).toBe('remote');
	});

	it('keeps source changes active for the session when storage is blocked', async () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new DOMException('Storage disabled', 'SecurityError');
		});
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('Storage disabled', 'SecurityError');
		});
		await renderSettings();
		await React.act(async () => getSourceButton('Remote').click());
		expect(getConfiguredGraphQLSource()).toBe('remote');
		expect(context.settings.graphqlSource).toBe('remote');
	});
});
