import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import type { NodeInfo } from '../../../src/api/arweaveNode';
import { getForkPage, getForkTips, groupNodesByFork } from '../../../src/features/Nodes/model/forks';
import { hash, NODE_INFO } from '../../fixtures/arweaveNode';

function fixture(heights: number[]) {
	const peers = heights.map((_, i) => ({ address: `8.8.8.${i + 1}:1984`, ip: `8.8.8.${i + 1}`, port: 1984 }));
	const infos: Record<string, NodeInfo> = Object.fromEntries(
		peers.map((peer, i) => [peer.address, { ...NODE_INFO, height: heights[i], hash: hash(heights[i]) }])
	);
	return { peers, infos };
}
function chainIndex(peers, infos) {
	return Object.fromEntries(
		getForkTips(peers, infos).map((tip) => [
			tip.id,
			Object.fromEntries(Array.from({ length: tip.info.height + 1 }, (_, height) => [height, hash(height)])),
		])
	);
}

describe('node fork grouping', () => {
	it('groups identical tips and nodes behind on the same chain', () => {
		const { peers, infos } = fixture([100, 99, 95, 100]);
		const groups = groupNodesByFork(peers, infos, chainIndex(peers, infos));
		expect(groups).toHaveLength(1);
		expect(groups[0].kind).toBe('fork');
		expect(groups[0].peers).toHaveLength(4);
		expect(groups[0].tip.height).toBe(100);
	});
	it('keeps divergent tips at different heights apart and does not let a shared ancestor bridge them', () => {
		const { peers, infos } = fixture([100, 99, 98]);
		infos[peers[1].address].hash = 'b'.repeat(64);
		const groups = groupNodesByFork(peers, infos, chainIndex(peers, infos));
		expect(groups.filter((group) => group.kind === 'fork')).toHaveLength(2);
		expect(groups.find((group) => group.kind === 'shared')?.peers).toEqual([peers[2]]);
		expect(groups.flatMap((group) => group.peers)).toHaveLength(3);
	});
	it('does not infer ancestry from matching heights, unavailable history, or another network', () => {
		const { peers, infos } = fixture([100, 99, 100, 100]);
		infos[peers[2].address].hash = 'b'.repeat(64);
		infos[peers[3].address].network = 'arweave.test';
		const groups = groupNodesByFork(peers, infos, {});
		expect(groups).toHaveLength(4);
		expect(groups.filter((group) => group.kind === 'unverified')).toHaveLength(3);
		expect(groups.find((group) => group.tip.network === 'arweave.test')?.peers).toEqual([peers[3]]);
	});
	it('retains unchecked nodes and paginates groups without dropping or duplicating endpoints', () => {
		const { peers, infos } = fixture(Array(125).fill(100));
		delete infos[peers[124].address];
		const groups = groupNodesByFork(peers, infos, {});
		expect(groups.at(-1).kind).toBe('unclassified');
		const pages = [1, 2, 3].map((page) => getForkPage(groups, page, 50));
		expect(pages.map((page) => page.flatMap((group) => group.peers).length)).toEqual([50, 50, 25]);
		expect(pages.flatMap((page) => page.flatMap((group) => group.peers))).toEqual(peers);
	});
	it('never places incomparable tips together across generated forks and peer orders', () => {
		fc.assert(
			fc.property(
				fc.array(fc.record({ branch: fc.integer({ min: 0, max: 2 }), height: fc.integer({ min: 0, max: 20 }) }), {
					minLength: 1,
					maxLength: 40,
				}),
				(nodes) => {
					const { peers, infos } = fixture(nodes.map((node) => node.height));
					const blockHash = (branch: number, height: number) =>
						height < 5 ? hash(height) : `${branch}-${height}`.padStart(64, 'b');
					peers.forEach((peer, i) => {
						infos[peer.address].hash = blockHash(nodes[i].branch, nodes[i].height);
					});
					const ancestry = Object.fromEntries(
						getForkTips(peers, infos).map((tip) => {
							const branch = nodes[peers.findIndex((peer) => peer.address === tip.peers[0].address)].branch;
							return [
								tip.id,
								Object.fromEntries(
									Array.from({ length: tip.info.height + 1 }, (_, height) => [height, blockHash(branch, height)])
								),
							];
						})
					);
					const groups = groupNodesByFork([...peers].reverse(), infos, ancestry);
					expect(
						groups
							.flatMap((group) => group.peers)
							.map((peer) => peer.address)
							.sort()
					).toEqual(peers.map((peer) => peer.address).sort());
					for (const group of groups)
						for (const a of group.peers)
							for (const b of group.peers) {
								const i = peers.findIndex((peer) => peer.address === a.address);
								const j = peers.findIndex((peer) => peer.address === b.address);
								expect(nodes[i].branch === nodes[j].branch || Math.min(nodes[i].height, nodes[j].height) < 5).toBe(
									true
								);
							}
				}
			),
			{ numRuns: 100 }
		);
	});
});
