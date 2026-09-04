// @vitest-environment jsdom

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PermawebProvider, usePermawebProvider } from '../../../src/providers/PermawebProvider';

const mocks = vi.hoisted(() => ({
	source: 'ar-lmdb' as 'ar-lmdb' | 'remote',
	wallet: null as object | null,
	localProfile: vi.fn(),
	remoteProfile: vi.fn(),
	createApis: vi.fn(),
	nodes: [{ url: 'https://node.example', active: true }],
}));

vi.mock('api/permaweb', () => ({ createPermawebApis: mocks.createApis }));
vi.mock('providers/ArweaveProvider', () => ({
	useArweaveProvider: () => ({ wallet: mocks.wallet, walletAddress: mocks.wallet ? 'wallet' : null }),
}));
vi.mock('providers/SettingsProvider', () => ({
	useSettingsProvider: () => ({
		settings: { graphqlSource: mocks.source, nodes: mocks.nodes, legacyComputeNode: 'https://cu.example' },
	}),
}));

function Probe() {
	const provider = usePermawebProvider();
	return <p>{provider.profile?.id ?? 'no profile'}</p>;
}

describe('PermawebProvider GraphQL settings changes', () => {
	let container: HTMLDivElement;
	let root: Root;

	beforeEach(() => {
		(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
		localStorage.clear();
		mocks.source = 'ar-lmdb';
		mocks.wallet = null;
		mocks.localProfile.mockReset();
		mocks.remoteProfile.mockReset();
		mocks.createApis.mockReset();
		mocks.createApis.mockImplementation(({ graphqlSource }) => {
			const api = {
				getProfileByWalletAddress: graphqlSource === 'ar-lmdb' ? mocks.localProfile : mocks.remoteProfile,
			};
			return { legacyApi: api, mainnetApi: api };
		});
		container = document.createElement('div');
		document.body.appendChild(container);
		root = createRoot(container);
	});

	afterEach(() => {
		React.act(() => root.unmount());
		container.remove();
	});

	async function renderProvider() {
		await React.act(async () =>
			root.render(
				<PermawebProvider>
					<Probe />
				</PermawebProvider>
			)
		);
	}

	it('recreates both APIs with the selected source without requiring a reload', async () => {
		await renderProvider();
		expect(mocks.createApis).toHaveBeenLastCalledWith(expect.objectContaining({ graphqlSource: 'ar-lmdb' }));
		mocks.source = 'remote';
		await renderProvider();
		expect(mocks.createApis).toHaveBeenLastCalledWith(expect.objectContaining({ graphqlSource: 'remote' }));
		expect(mocks.createApis).toHaveBeenCalledTimes(2);
	});

	it('ignores late profile responses from the previous source', async () => {
		mocks.wallet = {};
		const localResolvers: Array<(profile: { id: string }) => void> = [];
		mocks.localProfile.mockImplementation(() => new Promise((resolve) => localResolvers.push(resolve)));
		mocks.remoteProfile.mockResolvedValue({ id: 'remote-profile' });
		await renderProvider();
		expect(localResolvers).toHaveLength(2);
		mocks.source = 'remote';
		await renderProvider();
		expect(container.textContent).toBe('remote-profile');
		await React.act(async () => localResolvers.forEach((resolve) => resolve({ id: 'old-local-profile' })));
		expect(container.textContent).toBe('remote-profile');
		expect(localStorage.getItem('profile-wallet')).toContain('remote-profile');
	});
});
