import { afterEach, describe, expect, it, vi } from 'vitest';

import { setConfiguredGraphQLSource } from '../../../src/api/graphql/source';
import { createPermawebApis } from '../../../src/api/permaweb';

const mocks = vi.hoisted(() => ({
	local: vi.fn(),
	remote: vi.fn(),
	profileByWallet: vi.fn(),
	profileById: vi.fn(),
	validateEndpoint: vi.fn(),
}));
vi.mock('arweave', () => ({ default: { init: () => ({}) } }));
vi.mock('@permaweb/aoconnect', () => ({ connect: () => ({}), createSigner: vi.fn() }));
vi.mock('@permaweb/libs', () => ({
	default: {
		init: () => ({
			getGQLData: mocks.remote,
			getProfileByWalletAddress: mocks.profileByWallet,
			getProfileById: mocks.profileById,
		}),
	},
}));
vi.mock('../../../src/api/graphql', async (importOriginal) => ({
	...(await importOriginal<typeof import('../../../src/api/graphql')>()),
	getArLmdbTransactions: mocks.local,
	getRemoteGraphQLEndpoint: mocks.validateEndpoint,
}));

afterEach(() => {
	vi.clearAllMocks();
	setConfiguredGraphQLSource('ar-lmdb');
});

describe('permaweb GraphQL source boundary', () => {
	it('uses local queries for both AO APIs, even with a legacy gateway argument', async () => {
		mocks.local.mockResolvedValue({ data: [], count: 0, nextCursor: null, previousCursor: null });
		const apis = createPermawebApis({ wallet: null });
		const args = { tags: [{ name: 'Type', values: ['Message'] }], gateway: 'ao-search-gateway.goldsky.com' };
		await apis.legacyApi.getGQLData(args);
		await apis.mainnetApi.getGQLData(args);
		expect(mocks.local).toHaveBeenCalledTimes(2);
		expect(mocks.local).toHaveBeenLastCalledWith(args);
		expect(mocks.remote).not.toHaveBeenCalled();
	});

	it('retains the SDK call and original arguments when Remote is selected', async () => {
		setConfiguredGraphQLSource('remote');
		const apis = createPermawebApis({ wallet: null });
		const args = { id: ['tx'], gateway: 'gateway.example', paginator: 25 };
		await apis.legacyApi.getGQLData(args);
		expect(mocks.remote).toHaveBeenCalledWith(args);
		expect(mocks.local).not.toHaveBeenCalled();
	});

	it('keeps explicitly configured API instances pinned when the preference changes', async () => {
		const localApis = createPermawebApis({ wallet: null, graphqlSource: 'ar-lmdb' });
		setConfiguredGraphQLSource('remote');
		const remoteApis = createPermawebApis({ wallet: null, graphqlSource: 'remote' });
		await localApis.mainnetApi.getGQLData({ paginator: 1 });
		await remoteApis.mainnetApi.getGQLData({ paginator: 1 });
		expect(mocks.local).toHaveBeenCalledOnce();
		expect(mocks.remote).toHaveBeenCalledOnce();
	});

	it('replaces the profile SDK hidden GraphQL lookup in local mode', async () => {
		mocks.local.mockResolvedValue({ data: [{ node: { id: 'profile' } }] });
		mocks.profileById.mockResolvedValue({ id: 'profile' });
		const apis = createPermawebApis({ wallet: null });
		await expect(apis.legacyApi.getProfileByWalletAddress('wallet')).resolves.toEqual({ id: 'profile' });
		expect(mocks.local).toHaveBeenCalledWith(expect.objectContaining({ owners: ['wallet'], paginator: 1 }));
		expect(mocks.profileByWallet).not.toHaveBeenCalled();
	});
});
