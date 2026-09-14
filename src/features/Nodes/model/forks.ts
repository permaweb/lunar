import type { NodeInfo } from 'api/arweaveNode';
import type { ArweavePeer } from 'api/nodes';

export type ForkTip = { id: string; info: NodeInfo; peers: ArweavePeer[] };
export type ForkAncestry = Record<string, Record<number, string>>;
export type ForkGroup = {
	id: string;
	kind: 'fork' | 'unverified' | 'shared' | 'unclassified';
	tip?: NodeInfo;
	peers: ArweavePeer[];
};

export function getForkTips(peers: ArweavePeer[], infos: Record<string, NodeInfo>): ForkTip[] {
	const tips = new Map<string, ForkTip>();
	for (const peer of peers) {
		const info = infos[peer.address];
		if (!info) continue;
		const id = `${info.network}:${info.height}:${info.hash}`;
		const tip = tips.get(id);
		if (tip) tip.peers.push(peer);
		else tips.set(id, { id, info, peers: [peer] });
	}
	return [...tips.values()].sort((a, b) => b.info.height - a.info.height || a.id.localeCompare(b.id));
}

/** null means we have no evidence; equal heights alone never imply ancestry. */
export function compareTips(a: ForkTip, b: ForkTip, ancestry: ForkAncestry): boolean | null {
	if (a.info.network !== b.info.network) return false;
	if (a.id === b.id) return true;
	if (a.info.hash === b.info.hash) return null; // Conflicting heights for one hash.
	if (a.info.height === b.info.height) return false;
	const [higher, lower] = a.info.height > b.info.height ? [a, b] : [b, a];
	const hash = ancestry[higher.id]?.[lower.info.height];
	return hash === undefined ? null : hash === lower.info.hash;
}

export function groupNodesByFork(
	peers: ArweavePeer[],
	infos: Record<string, NodeInfo>,
	ancestry: ForkAncestry
): ForkGroup[] {
	const tips = getForkTips(peers, infos);
	// Ancestry is not an equivalence relation: a common ancestor must not bridge
	// two divergent descendants. First find maximal tips, then assign ancestors.
	const roots = tips.filter(
		(tip) => !tips.some((other) => other.info.height > tip.info.height && compareTips(tip, other, ancestry) === true)
	);
	const groups: ForkGroup[] = roots.map((root) => ({
		id: root.id,
		kind: roots.some((other) => compareTips(root, other, ancestry) === null) ? 'unverified' : 'fork',
		tip: root.info,
		peers: [],
	}));
	for (const tip of tips) {
		const matches = roots.filter((root) => compareTips(tip, root, ancestry) === true);
		if (matches.length === 1) groups.find((group) => group.id === matches[0].id)!.peers.push(...tip.peers);
		else
			groups.push({
				id: `ancestor:${tip.id}`,
				kind: matches.length > 1 ? 'shared' : 'unverified',
				tip: tip.info,
				peers: [...tip.peers],
			});
	}
	groups.sort((a, b) => b.peers.length - a.peers.length || a.id.localeCompare(b.id));
	const unclassified = peers.filter((peer) => !infos[peer.address]);
	if (unclassified.length) groups.push({ id: 'unclassified', kind: 'unclassified', peers: unclassified });
	return groups;
}

export function getForkPage(groups: ForkGroup[], page: number, size: number): ForkGroup[] {
	const start = (page - 1) * size;
	let offset = 0;
	return groups.flatMap((group) => {
		const peers = group.peers.slice(Math.max(0, start - offset), Math.max(0, start + size - offset));
		offset += group.peers.length;
		return peers.length ? [{ ...group, peers }] : [];
	});
}
