import { type AoNetworkSettings, parseAoPeers } from 'helpers/aoNetwork';
import { checkValidAddress } from 'helpers/utils';

export interface ProcessReadPreferences {
	useGlobal: boolean;
	network: AoNetworkSettings;
}

function storageKey(processId: string): string {
	return `lunar:ao-mainnet:process-read:v1:${processId}`;
}

function parsePreferences(value: unknown): ProcessReadPreferences | null {
	if (!value || typeof value !== 'object') return null;
	const saved = value as Partial<ProcessReadPreferences>;
	const peers = parseAoPeers(saved.network?.peers);
	if (
		typeof saved.useGlobal !== 'boolean' ||
		!peers ||
		typeof saved.network?.preferPermawebOS !== 'boolean' ||
		typeof saved.network?.fallbackToPeers !== 'boolean'
	)
		return null;
	return {
		useGlobal: saved.useGlobal,
		network: {
			peers,
			preferPermawebOS: saved.network.preferPermawebOS,
			fallbackToPeers: saved.network.fallbackToPeers,
		},
	};
}

export function readProcessReadPreferences(processId: string): ProcessReadPreferences | null {
	if (!checkValidAddress(processId)) return null;
	try {
		const envelope: unknown = JSON.parse(globalThis.localStorage?.getItem(storageKey(processId)) ?? 'null');
		if (
			!envelope ||
			typeof envelope !== 'object' ||
			!('version' in envelope) ||
			envelope.version !== 1 ||
			!('preferences' in envelope)
		)
			return null;
		return parsePreferences(envelope.preferences);
	} catch {
		// Invalid or inaccessible saved preferences fall back to the current global network.
		return null;
	}
}

export function writeProcessReadPreferences(processId: string, preferences: ProcessReadPreferences): boolean {
	const parsed = parsePreferences(preferences);
	if (!checkValidAddress(processId) || !parsed) return false;
	try {
		if (!globalThis.localStorage) return false;
		globalThis.localStorage.setItem(
			storageKey(processId),
			JSON.stringify({ version: 1, updatedAt: Date.now(), preferences: parsed })
		);
		return true;
	} catch {
		return false;
	}
}
