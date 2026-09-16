import type { AoNetworkSettings } from 'helpers/aoNetwork';

import { createAoReadTransport } from './transport';

let cached: { key: string; transport: ReturnType<typeof createAoReadTransport> };

export function getAoReadTransport(settings: AoNetworkSettings) {
	const key = JSON.stringify(settings);
	if (cached?.key !== key) cached = { key, transport: createAoReadTransport(settings) };
	return cached.transport;
}

export { createAoReadTransport } from './transport';
export type { AoNetworkStatus, AoReadResult, InjectedAoFetch } from './types';
export { AoReadError } from './types';
