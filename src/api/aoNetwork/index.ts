import type { AoNetworkSettings } from 'helpers/aoNetwork';

import { createAoReadTransport } from './transport';

const TRANSPORT_CACHE_LIMIT = 32;
const cached = new Map<string, ReturnType<typeof createAoReadTransport>>();

export function getAoReadTransport(settings: AoNetworkSettings) {
	const key = JSON.stringify(settings);
	const transport = cached.get(key) ?? createAoReadTransport(settings);
	cached.delete(key);
	cached.set(key, transport);
	if (cached.size > TRANSPORT_CACHE_LIMIT) cached.delete(cached.keys().next().value);
	return transport;
}

export {
	type ProcessReadPreferences,
	readProcessReadPreferences,
	writeProcessReadPreferences,
} from './processSettings';
export { createAoReadTransport } from './transport';
export type { AoNetworkStatus, AoReadResult, InjectedAoFetch } from './types';
export { AoReadError } from './types';
