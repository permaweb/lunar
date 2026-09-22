import { readAoBalance } from 'api/balances';
import { requestRemote } from 'api/http';
import { lookupTransaction } from 'api/transactions';

import { addTransaction, selectTransaction, touchTransaction } from 'store/transactions/reducer';

import { DEFAULT_LEGACY_SCHEDULER_URL, DEFAULT_SCHEDULER_URL, FLAGS } from './config';
import { getARBalanceEndpoint } from './endpoints';
import { GQLNodeResponseType, MessageVariantEnum, SearchTxArgs, TagType } from './types';
import { getTagValue, isNumeric, isTrustedLegacyAuthority, normalizeGqlResponse } from './utils';

const MAX_DEPTH = 10;
const MAINNET_SCHEDULE_LOOKUP_PAGE_SIZE = 1000;

function getNumberTag(tags: TagType[] | undefined, name: string) {
	const value = getTagValue(tags, name);
	if (!value) return null;

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function getNumberValue(value: any) {
	if (value === undefined || value === null || value === '') return null;

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSchedulerTimestamp(value: number | null) {
	if (value === null) return null;

	return value > 10000000000 ? value / 1000 : value;
}

function hasBlockMetadata(response: GQLNodeResponseType) {
	return response?.node?.block?.height != null || response?.node?.block?.timestamp != null;
}

function hasScheduleMetadata(response: GQLNodeResponseType) {
	return hasBlockMetadata(response) && response?.node?.slot != null;
}

function isLegacyMessage(response: GQLNodeResponseType) {
	const tags = response?.node?.tags;

	return getTagValue(tags, 'Variant') === MessageVariantEnum.Legacynet && getTagValue(tags, 'Type') === 'Message';
}

function isMainnetMessage(response: GQLNodeResponseType) {
	const tags = response?.node?.tags;

	return getTagValue(tags, 'Variant') === MessageVariantEnum.Mainnet && getTagValue(tags, 'Type') === 'Message';
}

function hasForwardedLegacyOriginTags(response: GQLNodeResponseType) {
	const tags = response?.node?.tags;

	return Boolean(
		getTagValue(tags, 'From-Authority') ||
			getTagValue(tags, 'From-Base') ||
			getTagValue(tags, 'From-Scheduler') ||
			getTagValue(tags, 'From-Uncommitted')
	);
}

function shouldHydrateMainnetMessageSchedule(response: GQLNodeResponseType) {
	return isMainnetMessage(response) && !hasForwardedLegacyOriginTags(response);
}

function needsForwardedMainnetCacheRefresh(response: GQLNodeResponseType) {
	return (
		isMainnetMessage(response) &&
		!!getTagValue(response?.node?.tags, 'From-Process') &&
		response?.node?.slot != null &&
		!hasForwardedLegacyOriginTags(response)
	);
}

function isWalletResponse(response: GQLNodeResponseType) {
	return getTagValue(response?.node?.tags, 'Type') === 'Wallet';
}

function needsPushedMessageSchedule(response: GQLNodeResponseType) {
	return (
		isLegacyMessage(response) && !!getTagValue(response?.node?.tags, 'Pushed-For') && !hasScheduleMetadata(response)
	);
}

function shouldUseCachedTransaction(response: GQLNodeResponseType) {
	if (isWalletResponse(response)) return true;
	if (!hasBlockMetadata(response)) return false;
	if (needsForwardedMainnetCacheRefresh(response)) return false;

	return !needsPushedMessageSchedule(response);
}

async function hydrateLegacyMessageSchedule(response: GQLNodeResponseType) {
	if (hasScheduleMetadata(response) || !isLegacyMessage(response)) {
		return response;
	}

	const tags = response?.node?.tags;
	const recipient = response.node.recipient ?? getTagValue(tags, 'Target');
	if (!recipient) return response;

	try {
		const schedulerResponse = await requestRemote(
			`${DEFAULT_LEGACY_SCHEDULER_URL}/${response.node.id}?process-id=${recipient}`
		);
		const parsedSchedulerResponse = await schedulerResponse.json();
		const assignmentTags = parsedSchedulerResponse?.assignment?.tags;

		if (!assignmentTags?.length) return response;

		const height = getNumberTag(assignmentTags, 'Block-Height');
		const timestamp = getNumberTag(assignmentTags, 'Timestamp');
		const slot = getNumberTag(assignmentTags, 'Nonce');

		return {
			...response,
			node: {
				...response.node,
				block: {
					...response.node.block,
					...(height !== null ? { height } : {}),
					...(timestamp !== null ? { timestamp: timestamp / 1000 } : {}),
				},
				...(slot !== null ? { slot } : {}),
			},
		};
	} catch (e: any) {
		console.error(e);
		return response;
	}
}

function getMainnetScheduleEdgeMessageId(edge: any) {
	return edge?.node?.message?.Id ?? edge?.node?.message?.id;
}

function getMainnetScheduleEdgeTags(edge: any, field: 'message' | 'assignment') {
	const tags = edge?.node?.[field]?.Tags ?? edge?.node?.[field]?.tags;

	return Array.isArray(tags) ? tags : [];
}

function getMainnetScheduleEdgeTimestamp(edge: any) {
	const messageTags = getMainnetScheduleEdgeTags(edge, 'message');
	const assignmentTags = getMainnetScheduleEdgeTags(edge, 'assignment');

	return (
		getNumberTag(messageTags, 'message-timestamp') ??
		getNumberTag(assignmentTags, 'Timestamp') ??
		getNumberTag(assignmentTags, 'Block-Timestamp')
	);
}

async function fetchMainnetScheduleRange(target: string, from: number, to: number) {
	const rangeFrom = Math.max(0, Math.min(from, to));
	const rangeTo = Math.max(rangeFrom, Math.min(to, rangeFrom + MAINNET_SCHEDULE_LOOKUP_PAGE_SIZE - 1));
	const response = await requestRemote(
		`${DEFAULT_SCHEDULER_URL}/~scheduler@1.0/schedule?target=${target}&accept=application/aos-2&from=${rangeFrom}&to=${rangeTo}`
	);

	if (!response.ok) throw new Error(`Mainnet schedule request failed with ${response.status}`);

	const parsed = await response.json();

	return Array.isArray(parsed?.edges) ? parsed.edges : [];
}

async function getMainnetLatestSlot(target: string) {
	const response = await requestRemote(`${DEFAULT_SCHEDULER_URL}/${target}~process@1.0/slot/current`);
	if (!response.ok) throw new Error(`Mainnet latest slot request failed with ${response.status}`);

	const latestSlot = Number((await response.text()).trim());

	return Number.isFinite(latestSlot) ? latestSlot : null;
}

async function findMainnetScheduleEdge(response: GQLNodeResponseType) {
	const messageId = response?.node?.id;
	const tags = response?.node?.tags;
	const target = response?.node?.recipient ?? getTagValue(tags, 'Target');

	if (!messageId || !target) return null;

	const latestSlot = await getMainnetLatestSlot(target);
	if (latestSlot === null || latestSlot < 0) return null;

	const checkedRanges = new Set<string>();
	const searchRange = async (from: number, to: number) => {
		const rangeFrom = Math.max(0, Math.min(from, to));
		const rangeTo = Math.max(rangeFrom, Math.min(to, rangeFrom + MAINNET_SCHEDULE_LOOKUP_PAGE_SIZE - 1));
		const key = `${rangeFrom}:${rangeTo}`;
		if (checkedRanges.has(key)) return null;
		checkedRanges.add(key);

		const edges = await fetchMainnetScheduleRange(target, rangeFrom, rangeTo);

		return edges.find((edge: any) => getMainnetScheduleEdgeMessageId(edge) === messageId) ?? null;
	};

	const latestFrom = Math.max(0, latestSlot - MAINNET_SCHEDULE_LOOKUP_PAGE_SIZE + 1);
	const latestMatch = await searchRange(latestFrom, latestSlot);
	if (latestMatch) return latestMatch;

	const targetTimestamp = getNumberTag(tags, 'message-timestamp') ?? getNumberTag(tags, 'Timestamp');
	if (targetTimestamp === null) return null;

	let low = 0;
	let high = latestSlot;
	let candidateSlot = latestSlot;

	while (low <= high) {
		const mid = Math.floor((low + high) / 2);
		const edges = await fetchMainnetScheduleRange(target, mid, mid);
		const edgeTimestamp = getMainnetScheduleEdgeTimestamp(edges[0]);

		if (edgeTimestamp === null) break;

		if (edgeTimestamp < targetTimestamp) {
			low = mid + 1;
		} else {
			candidateSlot = mid;
			high = mid - 1;
		}
	}

	const centeredFrom = Math.max(0, Math.min(candidateSlot - 500, latestSlot - MAINNET_SCHEDULE_LOOKUP_PAGE_SIZE + 1));
	const centeredTo = Math.min(latestSlot, centeredFrom + MAINNET_SCHEDULE_LOOKUP_PAGE_SIZE - 1);

	return await searchRange(centeredFrom, centeredTo);
}

async function hydrateMainnetMessageSchedule(response: GQLNodeResponseType) {
	if (hasScheduleMetadata(response) || !shouldHydrateMainnetMessageSchedule(response)) {
		return response;
	}

	try {
		const scheduleEdge = await findMainnetScheduleEdge(response);
		if (!scheduleEdge) return response;

		const assignmentTags = getMainnetScheduleEdgeTags(scheduleEdge, 'assignment');
		if (!assignmentTags.length) return response;

		const height = getNumberTag(assignmentTags, 'Block-Height');
		const blockTimestamp = getNumberTag(assignmentTags, 'Block-Timestamp');
		const timestamp = getNumberTag(assignmentTags, 'Timestamp');
		const slot = getNumberTag(assignmentTags, 'Slot') ?? getNumberValue(scheduleEdge.cursor);
		const scheduledHeight = height !== null && height > 0 ? height : null;
		const normalizedTimestamp = normalizeSchedulerTimestamp(
			blockTimestamp !== null && blockTimestamp > 0 ? blockTimestamp : timestamp
		);

		return {
			...response,
			node: {
				...response.node,
				block: {
					...response.node.block,
					...(scheduledHeight !== null ? { height: scheduledHeight } : {}),
					...(normalizedTimestamp !== null ? { timestamp: normalizedTimestamp } : {}),
				},
				...(slot !== null ? { slot } : {}),
			},
		};
	} catch (e: any) {
		console.error(e);
		return response;
	}
}

function cacheTransaction(response: GQLNodeResponseType, args: SearchTxArgs, opts?: { skipBlockHeightCheck: boolean }) {
	if (FLAGS.USE_TX_CACHE && args.store && args.dispatch) {
		const hasDisplayName = Boolean(getTagValue(response?.node?.tags, 'Name'));

		// Direct lookups can return signed transaction metadata without settlement headers.
		// Keep named responses for address labels; shouldUseCachedTransaction still prevents
		// incomplete entries from being reused as a complete transaction response.
		if (opts?.skipBlockHeightCheck || hasBlockMetadata(response) || hasDisplayName) {
			args.dispatch(addTransaction(args.txId, response));
		}
	}
}

async function resolveResponseData(
	responseData: GQLNodeResponseType,
	args: SearchTxArgs,
	depth: number
): Promise<GQLNodeResponseType> {
	responseData = await hydrateMainnetMessageSchedule(responseData);

	if (isMainnetMessage(responseData)) {
		cacheTransaction(responseData, args);
		return responseData;
	}

	/* Filter pushed messages by checking the authority */
	const fromProcess = getTagValue(responseData.node?.tags, 'From-Process');
	const messageOwner = responseData.node?.owner?.address;

	// No authority check needed
	if (!fromProcess || !messageOwner) {
		cacheTransaction(responseData, args);
		return responseData;
	}

	// Prevent infinite recursion
	if (depth >= MAX_DEPTH) {
		console.warn(`Max depth ${MAX_DEPTH} reached when searching for tx ${args.txId}`);
		return responseData;
	}

	try {
		const fromProcessResponse = await searchTxById(
			{
				txId: fromProcess,
				getGQLData: args.getGQLData,
				readProcess: args.readProcess,
				store: args.store,
				dispatch: args.dispatch,
			},
			depth + 1
		);

		const fromProcessVariant = getTagValue(fromProcessResponse?.node?.tags, 'Variant');

		if (fromProcessVariant === MessageVariantEnum.Mainnet) {
			const mainnetResponseData = await hydrateMainnetMessageSchedule(responseData);

			cacheTransaction(mainnetResponseData, args);
			return mainnetResponseData;
		}

		const fromProcessAuthority = getTagValue(fromProcessResponse?.node?.tags, 'Authority');

		// Reject if the pushing authority doesn't match the process's declared Authority.
		// Authorities rotate over time, so a process's Authority tag can lag behind the
		// authority that actually pushed the message — allow it through when the owner is
		// a known trusted legacy authority for the message's block height.
		if (
			fromProcessAuthority &&
			fromProcessAuthority !== messageOwner &&
			!isTrustedLegacyAuthority(messageOwner, responseData.node?.block?.height)
		) {
			return null;
		}

		const legacynetResponseData = await hydrateLegacyMessageSchedule(responseData);

		cacheTransaction(legacynetResponseData, args);
		return legacynetResponseData;
	} catch (e: any) {
		console.error(e);
		return responseData;
	}
}

async function addressHasTransactions(args: SearchTxArgs) {
	try {
		const activityResponse = await args.getGQLData({ owners: [args.txId] });
		return (activityResponse?.data?.length ?? 0) > 0;
	} catch (e: any) {
		console.error(e);
		return false;
	}
}

async function addressHasArBalance(address: string) {
	try {
		const response = await requestRemote(getARBalanceEndpoint(address));
		if (!response.ok) return false;

		const balance = await response.text();
		return isNumeric(balance) && Number(balance) > 0;
	} catch (e: any) {
		console.error(e);
		return false;
	}
}

async function addressHasAoBalance(args: SearchTxArgs) {
	try {
		const balance = await readAoBalance(args.txId);

		return isNumeric(balance) && Number(balance) > 0;
	} catch (e: any) {
		console.error(e);
		return false;
	}
}

/* An address is a wallet if it has transaction activity or any AR / AO balance */
async function isWalletAddress(args: SearchTxArgs) {
	if (await addressHasTransactions(args)) return true;
	if (await addressHasArBalance(args.txId)) return true;
	if (await addressHasAoBalance(args)) return true;

	return false;
}

export async function searchTxById(args: SearchTxArgs, depth: number = 0): Promise<GQLNodeResponseType> {
	if (FLAGS.USE_TX_CACHE && args.store) {
		const cached = selectTransaction(args.store.getState(), args.txId);
		if (cached && shouldUseCachedTransaction(cached)) {
			if (args.dispatch) args.dispatch(touchTransaction(args.txId));
			return cached;
		}
	}

	try {
		const directLookupResponse = await lookupTransaction(args.txId);

		if (directLookupResponse) {
			const normalizedDirectResponse = await normalizeGqlResponse({
				count: 1,
				nextCursor: null,
				previousCursor: null,
				data: [directLookupResponse],
			});

			return await resolveResponseData(
				normalizedDirectResponse?.data?.[0] ?? (directLookupResponse as any),
				args,
				depth
			);
		}
	} catch (e: any) {
		console.error(e);
	}

	try {
		let response: any = await args.getGQLData({ id: [args.txId] });

		if (!response) response = { data: [] };

		response = await normalizeGqlResponse(response);

		const responseData = response?.data?.[0];

		if (!responseData) {
			/* Check if this is a wallet based on activity or AR / AO balance */
			if (await isWalletAddress(args)) {
				const walletResponse = {
					cursor: null,
					node: {
						id: args.txId,
						tags: [{ name: 'Type', value: 'Wallet' }],
						data: null,
						owner: {
							address: null,
						},
						block: {
							height: null,
							timestamp: null,
						},
					},
				};

				cacheTransaction(walletResponse as GQLNodeResponseType, args, { skipBlockHeightCheck: true });
				return walletResponse as GQLNodeResponseType;
			}

			return null;
		}

		return await resolveResponseData(responseData, args, depth);
	} catch (e: any) {
		throw new Error(e);
	}
}
