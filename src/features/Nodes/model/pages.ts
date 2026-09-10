import type { ArweavePeer, NodeObservation } from 'api/nodes';

import { NODES_PAGE_SIZE } from './config';

export function getNodePages(peers: ArweavePeer[], observations: Record<string, NodeObservation>) {
	const reachable: ArweavePeer[] = [];
	const unchecked: ArweavePeer[] = [];
	const unavailable: ArweavePeer[] = [];
	for (const peer of peers) {
		const status = observations[peer.address]?.status;
		if (status === 'reachable') reachable.push(peer);
		else if (status === 'unavailable') unavailable.push(peer);
		else unchecked.push(peer);
	}
	const eligible = [...reachable, ...unchecked];
	// Reserve page one for reachable and not-yet-checked peers, even if fewer
	// than a full page remain. Unavailable peers are still accessible afterward.
	const first = eligible.slice(0, NODES_PAGE_SIZE);
	const remaining = [...eligible.slice(NODES_PAGE_SIZE), ...unavailable];
	return {
		count: 1 + Math.ceil(remaining.length / NODES_PAGE_SIZE),
		rows: (page: number) =>
			page === 1 ? first : remaining.slice((page - 2) * NODES_PAGE_SIZE, (page - 1) * NODES_PAGE_SIZE),
	};
}
