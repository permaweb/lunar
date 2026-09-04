// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'lunar-graphql-source';

describe('configured GraphQL source', () => {
	const unsubscribers: (() => void)[] = [];

	beforeEach(() => {
		vi.resetModules();
		localStorage.clear();
	});

	afterEach(() => {
		unsubscribers.splice(0).forEach((unsubscribe) => unsubscribe());
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('defaults to AR LMDB and ignores malformed or unsupported preferences', async () => {
		const source = await import('../../../src/api/graphql/source');
		expect(source.getConfiguredGraphQLSource()).toBe('ar-lmdb');
		for (const invalid of ['true', 'REMOTE', '{"source":"remote"}', 'null', '']) {
			localStorage.setItem(STORAGE_KEY, invalid);
			expect(source.getConfiguredGraphQLSource()).toBe('ar-lmdb');
		}
	});

	it('restores the saved preference before any UI subscribes', async () => {
		localStorage.setItem(STORAGE_KEY, 'remote');
		const source = await import('../../../src/api/graphql/source');
		expect(source.getConfiguredGraphQLSource()).toBe('remote');
	});

	it('persists changes and synchronously notifies same-tab consumers only when the source changes', async () => {
		const source = await import('../../../src/api/graphql/source');
		const snapshots: string[] = [];
		unsubscribers.push(source.subscribeGraphQLSource(() => snapshots.push(source.getConfiguredGraphQLSource())));
		source.setConfiguredGraphQLSource('remote');
		expect(snapshots).toEqual(['remote']);
		expect(localStorage.getItem(STORAGE_KEY)).toBe('remote');
		source.setConfiguredGraphQLSource('remote');
		expect(snapshots).toEqual(['remote']);
		source.setConfiguredGraphQLSource('ar-lmdb');
		expect(snapshots).toEqual(['remote', 'ar-lmdb']);
	});

	it('accepts cross-tab changes, ignores unrelated storage, and defaults when the preference is cleared', async () => {
		const source = await import('../../../src/api/graphql/source');
		const listener = vi.fn();
		unsubscribers.push(source.subscribeGraphQLSource(listener));
		window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: 'remote' }));
		expect(source.getConfiguredGraphQLSource()).toBe('remote');
		window.dispatchEvent(new StorageEvent('storage', { key: 'another-app', newValue: 'ar-lmdb' }));
		window.dispatchEvent(
			new StorageEvent('storage', { key: STORAGE_KEY, newValue: 'ar-lmdb', storageArea: sessionStorage })
		);
		expect(source.getConfiguredGraphQLSource()).toBe('remote');
		expect(listener).toHaveBeenCalledTimes(1);
		window.dispatchEvent(new StorageEvent('storage', { key: null, newValue: null }));
		expect(source.getConfiguredGraphQLSource()).toBe('ar-lmdb');
		expect(listener).toHaveBeenCalledTimes(2);
	});

	it('removes the shared storage listener after the last subscription ends and restores later changes', async () => {
		const source = await import('../../../src/api/graphql/source');
		const addListener = vi.spyOn(window, 'addEventListener');
		const removeListener = vi.spyOn(window, 'removeEventListener');
		const unsubscribeFirst = source.subscribeGraphQLSource(vi.fn());
		const unsubscribeSecond = source.subscribeGraphQLSource(vi.fn());
		expect(addListener).toHaveBeenCalledTimes(1);
		unsubscribeFirst();
		expect(removeListener).not.toHaveBeenCalled();
		unsubscribeSecond();
		expect(removeListener).toHaveBeenCalledWith('storage', expect.any(Function));
		localStorage.setItem(STORAGE_KEY, 'remote');
		unsubscribers.push(source.subscribeGraphQLSource(vi.fn()));
		expect(source.getConfiguredGraphQLSource()).toBe('remote');
	});

	it('retains a working session preference when storage is blocked or full', async () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new DOMException('Storage disabled', 'SecurityError');
		});
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('Storage disabled', 'QuotaExceededError');
		});
		const source = await import('../../../src/api/graphql/source');
		expect(source.getConfiguredGraphQLSource()).toBe('ar-lmdb');
		source.setConfiguredGraphQLSource('remote');
		expect(source.getConfiguredGraphQLSource()).toBe('remote');
		unsubscribers.push(source.subscribeGraphQLSource(vi.fn()));
		expect(source.getConfiguredGraphQLSource()).toBe('remote');
	});

	it('is safe without browser globals', async () => {
		vi.stubGlobal('window', undefined);
		const source = await import('../../../src/api/graphql/source');
		expect(source.getConfiguredGraphQLSource()).toBe('ar-lmdb');
		source.setConfiguredGraphQLSource('remote');
		expect(source.getConfiguredGraphQLSource()).toBe('remote');
		unsubscribers.push(source.subscribeGraphQLSource(vi.fn()));
	});
});
