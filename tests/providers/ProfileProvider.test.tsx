// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { profileApi, ProfileError } from '../../src/api/profiles';
import { ProfileProvider, useProfileProvider } from '../../src/providers/ProfileProvider';

vi.mock('api/profiles', async () => ({
	...(await vi.importActual('../../src/api/profiles')),
	profileApi: { read: vi.fn(), save: vi.fn() },
}));
let address: string | null;
const wallet = {};
vi.mock('providers/ArweaveProvider', () => ({ useArweaveProvider: () => ({ walletAddress: address, wallet }) }));
let state: ReturnType<typeof useProfileProvider>;
let root: ReturnType<typeof createRoot>;
let container: HTMLElement;
function Harness() {
	state = useProfileProvider();
	return <p>{state.profile?.username ?? 'No profile'}</p>;
}
const profile = (owner: string, id = 'p'.repeat(43), username = 'Captain') => ({
	id,
	walletAddress: owner,
	username,
	displayName: '',
	description: '',
	thumbnail: '',
	banner: '',
	assets: [],
});
async function render() {
	await React.act(async () =>
		root.render(
			<ProfileProvider>
				<Harness />
			</ProfileProvider>
		)
	);
}
beforeEach(() => {
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.resetAllMocks();
	address = 'a'.repeat(43);
	container = document.createElement('main');
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

it('ignores an old wallet response and clears the editor on account switch and disconnect', async () => {
	let finishOld: (value: ReturnType<typeof profile>) => void;
	let oldSignal: AbortSignal;
	vi.mocked(profileApi.read)
		.mockImplementationOnce((_owner, signal) => {
			oldSignal = signal;
			return new Promise((resolve) => {
				finishOld = resolve;
			});
		})
		.mockResolvedValueOnce(profile('b'.repeat(43), undefined, 'Second'));
	await render();
	await React.act(async () => state.setShowProfileManager(true));
	address = 'b'.repeat(43);
	await render();
	expect(oldSignal.aborted).toBe(true);
	expect(state.showProfileManager).toBe(false);
	expect(container.textContent).toBe('Second');
	await React.act(async () => finishOld(profile('a'.repeat(43))));
	expect(container.textContent).toBe('Second');
	address = null;
	await render();
	expect(state.profile).toBeNull();
});

it('keeps submitted data until indexing catches up, including when browser storage is unavailable', async () => {
	vi.useFakeTimers();
	address = 'c'.repeat(43);
	vi.mocked(profileApi.read).mockResolvedValue(null);
	vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
		throw new Error('quota');
	});
	const submitted = profile(address);
	vi.mocked(profileApi.save).mockResolvedValue(submitted);
	await render();
	await React.act(async () =>
		state.saveProfile(
			{ username: 'Captain', displayName: '', description: '', thumbnail: null, banner: null },
			{ signal: new AbortController().signal }
		)
	);
	expect(state.profile).toEqual(submitted);
	expect(state.state.status).toBe('submitted');
	await React.act(async () => vi.advanceTimersByTimeAsync(1000));
	expect(state.profile).toEqual(submitted);
	vi.mocked(profileApi.read).mockResolvedValue(submitted);
	await React.act(async () => vi.advanceTimersByTimeAsync(2000));
	expect(state.state.status).toBe('ready');
	vi.restoreAllMocks();
});

it('retains known profile data when a refresh fails and ignores corrupt old AO caches', async () => {
	address = 'd'.repeat(43);
	localStorage.setItem(`profile-${address}`, '{bad old process cache');
	vi.mocked(profileApi.read)
		.mockResolvedValueOnce(profile(address))
		.mockRejectedValueOnce(new ProfileError('unavailable'));
	await render();
	await React.act(async () => state.refreshProfile());
	expect(state.state.status).toBe('stale');
	expect(state.profile?.username).toBe('Captain');
});
