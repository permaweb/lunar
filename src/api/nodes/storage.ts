import type { ArweavePeer, NodeObservation } from './types';

const MAX_ENTRIES = 4096;
const PEERS_TTL = 60_000;
const REACHABLE_TTL = 5 * 60_000;
const UNAVAILABLE_TTL = 30_000;

export function createNodesCache(
	source: string,
	analyticsUrl: string,
	parsePeers: (value: unknown) => ArweavePeer[],
	parseObservation: (value: unknown, peer: ArweavePeer) => NodeObservation
) {
	const key = `lunar:nodes:v1:${source}:${analyticsUrl}`;
	let loaded = false;
	let peers: { data: ArweavePeer[]; fetchedAt: number } | null = null;
	const observations = new Map<string, NodeObservation>();
	const isFresh = (time: number, ttl: number) =>
		Number.isSafeInteger(time) && time > 0 && time <= Date.now() && Date.now() - time < ttl;
	function prune() {
		for (const [address, observation] of observations) {
			if (!isFresh(observation.checkedAt, observation.status === 'reachable' ? REACHABLE_TTL : UNAVAILABLE_TTL))
				observations.delete(address);
		}
	}
	function read() {
		if (loaded) return;
		loaded = true;
		try {
			const raw = globalThis.localStorage?.getItem(key);
			if (!raw || raw.length > 2_000_000) return;
			const value = JSON.parse(raw);
			if (value?.version !== 1 || value.source !== source || value.analyticsUrl !== analyticsUrl) return;
			if (value.peers && isFresh(value.peers.fetchedAt, PEERS_TTL))
				peers = { data: parsePeers(value.peers.addresses), fetchedAt: value.peers.fetchedAt };
			if (Array.isArray(value.observations) && value.observations.length <= MAX_ENTRIES) {
				for (const entry of value.observations) {
					try {
						const peer = parsePeers([entry?.peer])[0];
						if (peer) observations.set(peer.address, parseObservation(entry, peer));
					} catch {
						// Ignore this invalid entry without discarding other valid observations.
					}
				}
			}
			prune();
		} catch {
			// Storage may be unavailable, corrupt, or disabled. Network reads still work.
		}
	}
	function persist() {
		prune();
		try {
			globalThis.localStorage?.setItem(
				key,
				JSON.stringify({
					version: 1,
					source,
					analyticsUrl,
					peers: peers ? { fetchedAt: peers.fetchedAt, addresses: peers.data.map((peer) => peer.address) } : null,
					observations: [...observations.values()],
				})
			);
		} catch {
			// Quota and privacy restrictions fall back to the same in-memory cache.
		}
	}
	return {
		getInfos(peers: ArweavePeer[]) {
			read();
			prune();
			return peers.flatMap((peer) => observations.get(peer.address) ?? []);
		},
		getPeers() {
			read();
			return peers && isFresh(peers.fetchedAt, PEERS_TTL) ? peers.data : null;
		},
		setPeers(data: ArweavePeer[]) {
			read();
			peers = { data, fetchedAt: Date.now() };
			const allowed = new Set(data.map((peer) => peer.address));
			for (const address of observations.keys()) if (!allowed.has(address)) observations.delete(address);
			persist();
		},
		getInfo(address: string) {
			read();
			prune();
			return observations.get(address);
		},
		setInfo(data: NodeObservation) {
			read();
			if (observations.size >= MAX_ENTRIES) observations.delete(observations.keys().next().value);
			observations.set(data.peer, data);
			persist();
		},
	};
}
