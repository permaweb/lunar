import { checkValidAddress } from './utils';

export const arweaveEndpoint = 'https://arweave.net';

export function getARBalanceEndpoint(walletAddress: string) {
	return `${arweaveEndpoint}/wallet/${walletAddress}/balance`;
}

export function getTxEndpoint(txId: string) {
	return `${arweaveEndpoint}/${txId}`;
}

export function getRendererEndpoint(renderWith: string, tx: string) {
	if (checkValidAddress(renderWith)) {
		return `${arweaveEndpoint}/${renderWith}/?tx=${tx}`;
	} else {
		return `https://${renderWith}.arweave.dev/?tx=${tx}`;
	}
}

export function getMetricsEndpoint(days: number, network: 'mainnet' | 'legacynet') {
	return `https://atlas-server.decent.land/${network === 'mainnet' ? 'mainnet/' : ''}explorer/days?limit=${days}`;
}

export function getRoutesEndpoint(routerUrl: string) {
	return `https://${routerUrl}/~router@1.0/routes/?require-codec=application/json&accept-bundle=true`;
}
