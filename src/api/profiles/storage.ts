import type { ProfileType } from 'helpers/types';

import { parseAccountProfile } from './arweaveAdapter';

export type CachedProfile = { data: ProfileType | null; submitted: boolean };
const key = (address: string) => `lunar:account-profile:arweave:v1:${address}`;
const CACHE_TTL = 60 * 60 * 1000;
const memory = new Map<string, string>();

export function getCachedProfile(address: string): CachedProfile | null {
	try {
		let serialized = memory.get(address);
		if (!serialized) serialized = localStorage.getItem(key(address));
		const stored = JSON.parse(serialized ?? 'null');
		if (
			!stored ||
			stored.version !== 1 ||
			stored.address !== address ||
			typeof stored.submitted !== 'boolean' ||
			!Number.isFinite(stored.savedAt) ||
			Date.now() - stored.savedAt > CACHE_TTL ||
			stored.savedAt > Date.now()
		)
			return null;
		if (stored.data === null) return stored.submitted ? null : { data: null, submitted: false };
		const data = parseAccountProfile(address, stored.data.id, {
			handle: stored.data.username,
			name: stored.data.displayName,
			bio: stored.data.description,
			avatar: stored.data.thumbnail,
			banner: stored.data.banner,
		});
		return { data, submitted: stored.submitted };
	} catch {
		return null;
	}
}

export function cacheProfile(address: string, data: ProfileType | null, submitted = false): void {
	const serialized = JSON.stringify({ version: 1, savedAt: Date.now(), address, data, submitted });
	memory.set(address, serialized);
	if (memory.size > 20) memory.delete(memory.keys().next().value);
	try {
		localStorage.setItem(key(address), serialized);
	} catch {
		/* Profiles remain available in memory when browser storage is unavailable. */
	}
}
