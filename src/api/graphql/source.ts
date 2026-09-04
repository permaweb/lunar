import type { GraphQLSource } from './types';

const STORAGE_KEY = 'lunar-graphql-source';
const DEFAULT_SOURCE: GraphQLSource = 'ar-lmdb';
const listeners = new Set<() => void>();

let configuredSource: GraphQLSource;
let hasSessionOnlyPreference = false;
let removeStorageListener: (() => void) | undefined;

function isGraphQLSource(value: unknown): value is GraphQLSource {
	return value === 'ar-lmdb' || value === 'remote';
}

function readStoredSource(): GraphQLSource {
	try {
		const storedSource = typeof window === 'undefined' ? null : window.localStorage.getItem(STORAGE_KEY);
		return isGraphQLSource(storedSource) ? storedSource : DEFAULT_SOURCE;
	} catch {
		// Restricted browser storage must not prevent read-only queries.
		return configuredSource ?? DEFAULT_SOURCE;
	}
}

function notifySourceChanged(source: GraphQLSource): void {
	if (configuredSource === source) return;
	configuredSource = source;
	for (const listener of Array.from(listeners)) listener();
}

export function getConfiguredGraphQLSource(): GraphQLSource {
	if (configuredSource === undefined || (listeners.size === 0 && !hasSessionOnlyPreference)) {
		configuredSource = readStoredSource();
	}
	return configuredSource;
}

export function setConfiguredGraphQLSource(source: GraphQLSource): void {
	if (!isGraphQLSource(source)) return;
	getConfiguredGraphQLSource();
	hasSessionOnlyPreference = true;
	try {
		if (typeof window !== 'undefined') {
			window.localStorage.setItem(STORAGE_KEY, source);
			hasSessionOnlyPreference = false;
		}
	} catch {
		// Keep this session's preference even when browser storage is unavailable or full.
	}
	// Synchronous notification keeps UI settings and subsequent requests on the same source.
	notifySourceChanged(source);
}

export function subscribeGraphQLSource(listener: () => void): () => void {
	getConfiguredGraphQLSource();
	listeners.add(listener);
	if (!removeStorageListener && typeof window !== 'undefined') {
		const browserWindow = window;
		const handleStorage = (event: StorageEvent) => {
			if (event.key !== STORAGE_KEY && event.key !== null) return;
			try {
				if (event.storageArea && event.storageArea !== browserWindow.localStorage) return;
			} catch {
				// A storage event still carries the updated value if storage access is restricted.
			}
			hasSessionOnlyPreference = false;
			notifySourceChanged(isGraphQLSource(event.newValue) ? event.newValue : DEFAULT_SOURCE);
		};
		browserWindow.addEventListener('storage', handleStorage);
		removeStorageListener = () => browserWindow.removeEventListener('storage', handleStorage);
	}

	return () => {
		listeners.delete(listener);
		if (listeners.size === 0) {
			removeStorageListener?.();
			removeStorageListener = undefined;
		}
	};
}
