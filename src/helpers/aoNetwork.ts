import { DEFAULT_AO_PEERS } from './config';

export interface InjectedAoFetch {
	(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
	readonly peers?: readonly string[];
	ready?(): Promise<readonly string[]>;
	networkPolicy?(): Promise<unknown>;
	cacheMetadata?(response: Response): { origin?: string } | undefined;
}

export interface AoNetworkSettings {
	peers: string[];
	preferPermawebOS: boolean;
	fallbackToPeers: boolean;
}

export const DEFAULT_AO_NETWORK: AoNetworkSettings = {
	peers: DEFAULT_AO_PEERS,
	preferPermawebOS: true,
	fallbackToPeers: true,
};

/** Accept peer origins only; paths, credentials, and query strings are not network configuration. */
export function parseAoPeers(value: unknown): string[] | null {
	const entries = typeof value === 'string' ? value.split(/[\s,]+/).filter(Boolean) : value;
	if (!Array.isArray(entries) || !entries.length || entries.length > 8) return null;
	const peers: string[] = [];
	for (const entry of entries) {
		if (typeof entry !== 'string') return null;
		try {
			const url = new URL(entry);
			const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
			if (
				(url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
				url.username ||
				url.password ||
				url.search ||
				url.hash ||
				url.pathname !== '/'
			)
				return null;
			if (!peers.includes(url.origin)) peers.push(url.origin);
		} catch {
			return null;
		}
	}
	return peers;
}

export function restoreAoNetwork(value: unknown): AoNetworkSettings {
	const saved = value && typeof value === 'object' ? (value as Partial<AoNetworkSettings>) : {};
	return {
		peers: parseAoPeers(saved.peers) ?? [...DEFAULT_AO_PEERS],
		preferPermawebOS: typeof saved.preferPermawebOS === 'boolean' ? saved.preferPermawebOS : true,
		fallbackToPeers: typeof saved.fallbackToPeers === 'boolean' ? saved.fallbackToPeers : true,
	};
}
