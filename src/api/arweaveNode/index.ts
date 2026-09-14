import { createArweaveNodeApi } from './relayAdapter';

export const arweaveNodeApi = createArweaveNodeApi();
export type { NodeForkHistory } from './forkHistory';
export type { ForkGraph, ForkNode } from './forks';
export type { CachedNodeHistory } from './storage';
export type { MempoolSnapshot } from './storage';
export {
	getCachedNodeHistories,
	readNodeCache,
	readNodeHistory,
	readNodeInfo,
	saveNodeHistory,
	writeNodeCache,
} from './storage';
export { readNodeMempool, saveNodeMempool } from './storage';
export type { ArweaveNodeApi, NodeAnchor, NodeBlock, NodeErrorCode, NodeInfo, NodeTransaction } from './types';
export { ArweaveNodeError } from './types';
