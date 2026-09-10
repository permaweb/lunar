import { createArweaveNodeApi } from './relayAdapter';

export const arweaveNodeApi = createArweaveNodeApi();
export type { ArweaveNodeApi, NodeAnchor, NodeBlock, NodeErrorCode, NodeInfo, NodeTransaction } from './types';
export { ArweaveNodeError } from './types';
