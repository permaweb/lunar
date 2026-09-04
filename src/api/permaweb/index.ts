import Arweave from 'arweave';
import { connect, createSigner } from '@permaweb/aoconnect';
import PermawebLibs from '@permaweb/libs';

import { DEFAULT_AO_NODE, DEFAULT_GATEWAYS, DEFAULT_LEGACY_CU_URL, FLAGS } from 'helpers/config';
import { DefaultGQLResponseType, GQLNodeResponseType, ProfileType } from 'helpers/types';

import { getArLmdbTransactions, getRemoteGraphQLEndpoint } from '../graphql';

interface AoClient {
	dryrun(args: Record<string, unknown>): Promise<any>;
	message(args: Record<string, unknown>): Promise<string>;
	result(args: Record<string, unknown>): Promise<any>;
	results(args: Record<string, unknown>): Promise<any>;
}

export interface PermawebApi {
	ao: AoClient;
	createProcess(args: Record<string, unknown>): Promise<string>;
	createProfile(data: Record<string, unknown>, onStatus?: (status: unknown) => void): Promise<string>;
	getGQLData(args: Record<string, unknown>): Promise<DefaultGQLResponseType>;
	getProfileByWalletAddress(address: string): Promise<ProfileType | null>;
	mapFromProcessCase(messages: any[]): GQLNodeResponseType[] & { edges?: GQLNodeResponseType[] };
	readProcess(args: Record<string, unknown>): Promise<any>;
	readState(args: Record<string, unknown>): Promise<any>;
	sendMessage(args: Record<string, unknown>): Promise<string>;
	updateProfile(
		data: Record<string, unknown>,
		profileId: string,
		onStatus?: (status: unknown) => void
	): Promise<string>;
}

export interface PermawebApis {
	legacyApi: PermawebApi;
	mainnetApi: PermawebApi;
}

export function createPermawebApis(args: {
	wallet: unknown;
	legacyComputeNode?: string;
	node?: { url: string; authority?: string };
}): PermawebApis {
	const signer = args.wallet ? createSigner(args.wallet as any) : null;
	const legacyComputeNode = args.legacyComputeNode?.trim() || DEFAULT_LEGACY_CU_URL;
	const nodeUrl = args.node?.url || DEFAULT_AO_NODE.url;
	const nodeAuthority = args.node?.authority || DEFAULT_AO_NODE.authority;
	const legacyAo = connect({ MODE: 'legacy', CU_URL: legacyComputeNode });
	const mainnetConfiguration: {
		MODE: 'mainnet';
		URL: string;
		SCHEDULER: string;
		signer?: ReturnType<typeof createSigner>;
	} = {
		MODE: 'mainnet',
		URL: nodeUrl,
		SCHEDULER: DEFAULT_AO_NODE.scheduler,
	};

	if (signer) mainnetConfiguration.signer = signer;

	const shared = {
		arweave: Arweave.init({}),
		signer,
		node: { url: nodeUrl, authority: nodeAuthority, scheduler: DEFAULT_AO_NODE.scheduler },
		gateway: DEFAULT_GATEWAYS.arweave,
	};
	const legacyDependencies = { ao: legacyAo, ...shared };
	const mainnetDependencies = { ao: connect(mainnetConfiguration), ...shared };
	const legacyLibrary = PermawebLibs.init(legacyDependencies);
	const mainnetLibrary = PermawebLibs.init(mainnetDependencies);

	return {
		legacyApi: createApi(legacyLibrary, legacyDependencies.ao, signer),
		mainnetApi: createApi(mainnetLibrary, mainnetDependencies.ao, signer),
	};
}

function createApi(library: any, ao: any, signer: ReturnType<typeof createSigner> | null): PermawebApi {
	return {
		ao: {
			dryrun: (args) => ao.dryrun(args),
			message: (args) => ao.message(signer ? { ...args, signer } : args),
			result: (args) => ao.result(args),
			results: (args) => ao.results(args),
		},
		createProcess: (args) => library.createProcess(args),
		createProfile: (data, onStatus) => library.createProfile(data, onStatus),
		getGQLData: (args) => {
			if (FLAGS.USE_AR_LMDB_GQL) return getArLmdbTransactions(args);
			// Also reject retired endpoints supplied by old saved state or custom callers.
			if (typeof args.gateway === 'string') getRemoteGraphQLEndpoint(args.gateway);
			return library.getGQLData(args);
		},
		getProfileByWalletAddress: async (address) => {
			if (!FLAGS.USE_AR_LMDB_GQL) return library.getProfileByWalletAddress(address);
			// The SDK's profile lookup closes over its own remote GQL client.
			const profiles = await getArLmdbTransactions({
				tags: [
					{ name: 'Data-Protocol', values: ['ao'] },
					{ name: 'Zone-Type', values: ['User'] },
				],
				owners: [address],
				paginator: 1,
			});
			return profiles.data[0] ? library.getProfileById(profiles.data[0].node.id) : null;
		},
		mapFromProcessCase: (messages) => library.mapFromProcessCase(messages),
		readProcess: (args) => library.readProcess(args),
		readState: (args) => library.readState(args),
		sendMessage: (args) => library.sendMessage(args),
		updateProfile: (data, profileId, onStatus) => library.updateProfile(data, profileId, onStatus),
	};
}
