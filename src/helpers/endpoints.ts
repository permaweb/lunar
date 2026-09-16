import { checkValidAddress } from './utils';

export const legacyCuEndpoint = 'https://cu.ao-testnet.xyz';
export const arweaveEndpoint = 'https://arweave.net';
export const metricsPeerEndpoint = 'https://app-1.forward.computer';

function trimTrailingSlash(url: string) {
	return url.replace(/\/+$/, '');
}

export function getARBalanceEndpoint(walletAddress: string) {
	return `${arweaveEndpoint}/wallet/${walletAddress}/balance`;
}

export function getTxEndpoint(txId: string) {
	return `${arweaveEndpoint}/${txId}`;
}

export function getTxStatusEndpoint(txId: string) {
	return `${arweaveEndpoint}/tx/${txId}/status`;
}

export function getRendererEndpoint(renderWith: string, tx: string) {
	if (checkValidAddress(renderWith)) {
		return `${arweaveEndpoint}/${renderWith}/?tx=${tx}`;
	} else {
		return `https://${renderWith}.arweave.dev/?tx=${tx}`;
	}
}

export function getMetricsProcessEndpoint(processId: string) {
	if (!checkValidAddress(processId)) throw new Error('Invalid metrics process id');
	// The snapshot lives under the process state's `metrics` key; computing the root returns the AO envelope instead.
	return `${metricsPeerEndpoint}/${processId}~process@1.0/compute/metrics?require-codec=application/json&accept-bundle=true`;
}

export function getRoutesEndpoint(routerUrl: string) {
	return `https://${routerUrl}/~router@1.0/routes/?require-codec=application/json&accept-bundle=true`;
}

export function getLegacyResultsEndpoint(processId: string, cuEndpoint: string = legacyCuEndpoint) {
	return `${trimTrailingSlash(cuEndpoint)}/results/${processId}`;
}
