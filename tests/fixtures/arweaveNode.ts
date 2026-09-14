import type { NodeBlock, NodeInfo } from '../../src/api/arweaveNode';

export const NODE_URL = 'http://tip-1.arweave.xyz:1984';
export const MINER_ADDRESS = 'a'.repeat(43);
export function hash(height: number): string {
	return String(height).padStart(64, 'a');
}
export function nodeBlock(height: number, miner = MINER_ADDRESS): NodeBlock {
	return {
		height,
		hash: hash(height),
		previous: height === 0 ? '' : hash(height - 1),
		timestamp: 1_700_000_000 + height,
		miner,
		reward: '12345678901234567',
		denomination: 1,
		transactions: 5,
		dataSize: '123456',
		weaveSize: '9007199254740993',
	};
}
export const NODE_INFO: NodeInfo = {
	network: 'arweave.N.1',
	height: 100,
	hash: hash(100),
	version: 5,
	release: 100,
	peers: 200,
	queueLength: 0,
	latency: 1,
	blocks: 100,
	gitHash: null,
};
export function rawBlock(height: number) {
	const block = nodeBlock(height);
	return {
		height,
		indep_hash: block.hash,
		previous_block: block.previous,
		timestamp: block.timestamp,
		reward_addr: block.miner,
		reward: block.reward,
		denomination: '1',
		txs: [],
		block_size: block.dataSize,
		weave_size: block.weaveSize,
	};
}
