import countryData from './data/metadata.json';
import { createNodesApi } from './arweaveAdapter';

export const nodeAnalyticsUrl = 'https://stats.forward.computer';
export const nodesApi = createNodesApi();
export const nodeCountryData = { release: countryData.release, attributionUrl: countryData.attributionUrl };
export type { ArweavePeer, NodeCountries, NodeCountry, NodeObservation, NodesApi, NodesErrorCode } from './types';
export { NodesApiError } from './types';
