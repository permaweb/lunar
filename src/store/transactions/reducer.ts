import { Types } from '@permaweb/libs';

// Action types
export const ADD_TRANSACTION = 'ADD_TRANSACTION';
export const GET_TRANSACTION = 'GET_TRANSACTION';
export const TOUCH_TRANSACTION = 'TOUCH_TRANSACTION';
export const PRUNE_TRANSACTION_CACHE = 'PRUNE_TRANSACTION_CACHE';

const DAY_MS = 24 * 60 * 60 * 1000;
const TX_CACHE_LOW_USE_MAX_AGE_MS = 30 * DAY_MS;
const TX_CACHE_LOW_USE_MAX_IDLE_MS = 14 * DAY_MS;
const TX_CACHE_FREQUENT_VIEW_THRESHOLD = 3;
const TX_CACHE_FREQUENT_MAX_IDLE_MS = 180 * DAY_MS;
const TX_CACHE_MAX_ENTRIES = 10000;

type TransactionCacheMetadata = {
	cachedAt: number;
	lastViewedAt: number;
	viewCount: number;
};

type CachedTransaction = Types.GQLNodeResponseType & {
	__cache?: TransactionCacheMetadata;
};

interface AddTransactionAction {
	type: typeof ADD_TRANSACTION;
	payload: {
		id: string;
		data: Types.GQLNodeResponseType;
	};
}

interface GetTransactionAction {
	type: typeof GET_TRANSACTION;
	payload: string;
}

interface TouchTransactionAction {
	type: typeof TOUCH_TRANSACTION;
	payload: string;
}

interface PruneTransactionCacheAction {
	type: typeof PRUNE_TRANSACTION_CACHE;
	payload?: {
		now?: number;
	};
}

export type TransactionActionTypes =
	| AddTransactionAction
	| GetTransactionAction
	| TouchTransactionAction
	| PruneTransactionCacheAction;

export interface TransactionState {
	[id: string]: CachedTransaction;
}

const initialState: TransactionState = {};

function getSafeNumber(value: unknown, fallback: number) {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function getCacheMetadata(entry: CachedTransaction | null | undefined, now: number): TransactionCacheMetadata {
	const meta = entry?.__cache;
	const cachedAt = getSafeNumber(meta?.cachedAt, now);
	const lastViewedAt = getSafeNumber(meta?.lastViewedAt, cachedAt);
	const viewCount = getSafeNumber(meta?.viewCount, 0);

	return {
		cachedAt: cachedAt,
		lastViewedAt: lastViewedAt,
		viewCount: viewCount,
	};
}

function markTransactionViewed(
	entry: Types.GQLNodeResponseType,
	existingEntry: CachedTransaction | null | undefined,
	now: number
): CachedTransaction {
	const meta = getCacheMetadata(existingEntry ?? (entry as CachedTransaction), now);

	return {
		...entry,
		__cache: {
			cachedAt: meta.cachedAt,
			lastViewedAt: now,
			viewCount: meta.viewCount + 1,
		},
	};
}

function normalizeCachedTransaction(entry: CachedTransaction, now: number): CachedTransaction {
	return {
		...entry,
		__cache: getCacheMetadata(entry, now),
	};
}

function shouldPruneTransaction(entry: CachedTransaction, now: number) {
	const meta = getCacheMetadata(entry, now);
	const cacheAge = now - meta.cachedAt;
	const idleTime = now - meta.lastViewedAt;

	if (meta.viewCount >= TX_CACHE_FREQUENT_VIEW_THRESHOLD) {
		return idleTime > TX_CACHE_FREQUENT_MAX_IDLE_MS;
	}

	return cacheAge > TX_CACHE_LOW_USE_MAX_AGE_MS && idleTime > TX_CACHE_LOW_USE_MAX_IDLE_MS;
}

function pruneTransactionState(state: TransactionState, now: number): TransactionState {
	const keptEntries = Object.entries(state).reduce<[string, CachedTransaction][]>((acc, [id, entry]) => {
		if (!entry || shouldPruneTransaction(entry, now)) return acc;

		acc.push([id, normalizeCachedTransaction(entry, now)]);
		return acc;
	}, []);

	if (keptEntries.length > TX_CACHE_MAX_ENTRIES) {
		keptEntries.sort(([, a], [, b]) => {
			const metaA = getCacheMetadata(a, now);
			const metaB = getCacheMetadata(b, now);
			const aFrequent = metaA.viewCount >= TX_CACHE_FREQUENT_VIEW_THRESHOLD;
			const bFrequent = metaB.viewCount >= TX_CACHE_FREQUENT_VIEW_THRESHOLD;

			if (aFrequent !== bFrequent) return aFrequent ? 1 : -1;
			if (metaA.viewCount !== metaB.viewCount) return metaA.viewCount - metaB.viewCount;

			return metaA.lastViewedAt - metaB.lastViewedAt;
		});
		keptEntries.splice(0, keptEntries.length - TX_CACHE_MAX_ENTRIES);
	}

	return keptEntries.reduce<TransactionState>((acc, [id, entry]) => {
		acc[id] = entry;
		return acc;
	}, {});
}

export default function transactionReducer(state = initialState, action: TransactionActionTypes): TransactionState {
	switch (action.type) {
		case ADD_TRANSACTION: {
			const now = Date.now();
			const updatedState = {
				...state,
				[action.payload.id]: markTransactionViewed(action.payload.data, state[action.payload.id], now),
			};

			return pruneTransactionState(updatedState, now);
		}
		case TOUCH_TRANSACTION: {
			const existingEntry = state[action.payload];
			if (!existingEntry) return state;

			const now = Date.now();

			return pruneTransactionState(
				{
					...state,
					[action.payload]: markTransactionViewed(existingEntry, existingEntry, now),
				},
				now
			);
		}
		case PRUNE_TRANSACTION_CACHE:
			return pruneTransactionState(state, action.payload?.now ?? Date.now());
		default:
			return state;
	}
}

export const addTransaction = (id: string, data: Types.GQLNodeResponseType): AddTransactionAction => ({
	type: ADD_TRANSACTION,
	payload: { id, data },
});

export const getTransaction = (id: string): GetTransactionAction => ({
	type: GET_TRANSACTION,
	payload: id,
});

export const touchTransaction = (id: string): TouchTransactionAction => ({
	type: TOUCH_TRANSACTION,
	payload: id,
});

export const pruneTransactionCache = (now?: number): PruneTransactionCacheAction => ({
	type: PRUNE_TRANSACTION_CACHE,
	payload: { now },
});

export const selectTransaction = (state: { transactions: TransactionState }, id: string) => {
	const cached = state.transactions[id] || null;
	if (!cached || shouldPruneTransaction(cached, Date.now())) return null;

	return cached;
};
