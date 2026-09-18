import Arweave from 'arweave';
import { connect, createSigner } from '@permaweb/aoconnect';
import PermawebLibs from '@permaweb/libs';

import { getGraphQLEndpoint } from 'api/graphql';

import { DEFAULT_AO_NODE, DEFAULT_LEGACY_CU_URL } from 'helpers/config';
import { DefaultGQLResponseType, GQLNodeResponseType } from 'helpers/types';

interface AoClient {
	dryrun(args: Record<string, unknown>): Promise<any>;
	message(args: Record<string, unknown>): Promise<string>;
	result(args: Record<string, unknown>): Promise<any>;
	results(args: Record<string, unknown>): Promise<any>;
}

export interface PermawebApi {
	ao: AoClient;
	createProcess(args: Record<string, unknown>): Promise<string>;
	getGQLData(args: Record<string, unknown>): Promise<DefaultGQLResponseType>;
	mapFromProcessCase(messages: any[]): GQLNodeResponseType[] & { edges?: GQLNodeResponseType[] };
	readProcess(args: Record<string, unknown>): Promise<any>;
	readState(args: Record<string, unknown>): Promise<any>;
	sendMessage(args: Record<string, unknown>): Promise<string>;
}

export interface PermawebApis {
	legacyApi: PermawebApi;
	aosApi: PermawebApi;
}

export function createPermawebApis(args: {
	wallet: unknown;
	legacyComputeNode?: string;
	node?: { url: string; authority?: string };
	graphqlEndpoint?: string;
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
		gateway: args.graphqlEndpoint ?? getGraphQLEndpoint(),
	};
	const legacyDependencies = { ao: legacyAo, ...shared };
	const mainnetDependencies = { ao: connect(mainnetConfiguration), ...shared };
	const legacyLibrary = PermawebLibs.init(legacyDependencies);
	const mainnetLibrary = PermawebLibs.init(mainnetDependencies);

	return {
		legacyApi: createApi(legacyLibrary, legacyDependencies.ao, signer),
		aosApi: createApi(mainnetLibrary, mainnetDependencies.ao, signer),
	};
}

export type { ArweaveScheduleMessage, ArweaveSchedulePage, ArweaveSchedulePageArgs } from './arweaveSchedule';
export { ARWEAVE_SCHEDULE_PAGE_SIZE } from './arweaveSchedule';
export type { PeerApi } from './peerApi';
export { createPeerApi } from './peerApi';
export type { ProcessStateLoadOptions, ProcessStateProgress, ProcessStateResult } from './processState';

function createApi(library: any, ao: any, signer: ReturnType<typeof createSigner> | null): PermawebApi {
	return {
		ao: {
			dryrun: (args) => ao.dryrun(args),
			message: (args) => ao.message(signer ? { ...args, signer } : args),
			result: (args) => ao.result(args),
			results: (args) => ao.results(args),
		},
		createProcess: (args) => library.createProcess(args),
		getGQLData: (args) => library.getGQLData(args),
		mapFromProcessCase: (messages) => library.mapFromProcessCase(messages),
		readProcess: (args) => library.readProcess(args),
		readState: (args) => library.readState(args),
		sendMessage: (args) => library.sendMessage(args),
	};
}
