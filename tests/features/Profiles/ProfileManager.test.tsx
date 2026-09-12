// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { ProfileError } from '../../../src/api/profiles';
import { ProfileManager } from '../../../src/features/Profiles/components/organisms/ProfileManager';
import { darkTheme, theme } from '../../../src/helpers/themes';
import type { ProfileType } from '../../../src/helpers/types';

const save = vi.fn();
vi.mock('providers/ProfileProvider', () => ({
	useProfileProvider: () => ({ saveProfile: save, state: { status: 'ready' }, profile: null }),
}));
vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden="true" /> }));
vi.mock('store', () => ({ store: { getState: () => ({}) } }));
vi.mock('store/transactions/reducer', () => ({ selectTransaction: () => null }));
let root: ReturnType<typeof createRoot>;
let container: HTMLElement;
beforeEach(() => {
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	save.mockReset();
	container = document.createElement('main');
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});
async function render(profile: ProfileType | null = null) {
	await React.act(async () =>
		root.render(
			<MemoryRouter>
				<ThemeProvider theme={theme(darkTheme)}>
					<ProfileManager profile={profile} onClose={() => {}} />
				</ThemeProvider>
			</MemoryRouter>
		)
	);
}
async function changeHandle(value: string) {
	const input = [...container.querySelectorAll('input')].filter((input) => input.type !== 'file')[1];
	await React.act(async () => {
		Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
		input.dispatchEvent(new Event('input', { bubbles: true }));
	});
}
const saveButton = () => [...container.querySelectorAll('button')].find((button) => button.textContent === 'Save');

it('refreshes an untouched cached form while preserving an in-progress edit', async () => {
	const profile = {
		id: 'p'.repeat(43),
		walletAddress: 'a'.repeat(43),
		username: 'Cached',
		displayName: '',
		description: '',
		thumbnail: '',
		banner: '',
		assets: [],
	};
	await render(profile);
	await render({ ...profile, username: 'Fresh' });
	const handle = [...container.querySelectorAll('input')].filter((input) => input.type !== 'file')[1];
	expect(handle.value).toBe('Fresh');
	expect(saveButton().disabled).toBe(true);
	await changeHandle('My edit');
	await render({ ...profile, username: 'Latest' });
	expect(handle.value).toBe('My edit');
	expect(saveButton().disabled).toBe(false);
});

it('saves the edited fields, prevents duplicate signatures, and shows a submitted transaction link', async () => {
	let finish: (value: unknown) => void;
	save.mockImplementation((_draft, options) => {
		options.onPhase('awaiting-wallet');
		return new Promise((resolve) => {
			finish = resolve;
		});
	});
	await render();
	expect(saveButton().disabled).toBe(true);
	await changeHandle('Captain');
	await React.act(async () => {
		saveButton().click();
		saveButton().click();
	});
	expect(save).toHaveBeenCalledOnce();
	expect(container.textContent).toContain('Waiting for your wallet');
	await React.act(async () =>
		finish({
			id: 'p'.repeat(43),
			walletAddress: 'a'.repeat(43),
			username: 'Captain',
			displayName: '',
			description: '',
			thumbnail: '',
			banner: '',
			assets: [],
		})
	);
	expect(container.textContent).toContain('Profile transaction submitted. Waiting for indexing.');
	expect(container.querySelector(`a[href="#/explorer/${'p'.repeat(43)}"]`)).not.toBeNull();
	expect(saveButton().disabled).toBe(true);
	expect((await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })).violations).toEqual([]);
});

it('preserves input after rejection and prevents a duplicate write after an unknown outcome', async () => {
	save
		.mockRejectedValueOnce(new ProfileError('rejected', undefined, { thumbnail: `ar://${'v'.repeat(43)}` }))
		.mockRejectedValueOnce(new ProfileError('unknown-outcome', 'p'.repeat(43)));
	await render();
	await changeHandle('Captain');
	await React.act(async () => saveButton().click());
	expect(container.textContent).toContain('signature request was declined');
	expect(saveButton().disabled).toBe(false);
	await React.act(async () => saveButton().click());
	expect(container.textContent).toContain('Check this transaction before submitting again');
	expect(saveButton().disabled).toBe(true);
	expect(save).toHaveBeenCalledTimes(2);
	expect(save.mock.calls[1][0].thumbnail).toBe(`ar://${'v'.repeat(43)}`);
});
