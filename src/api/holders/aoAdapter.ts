import { AoReadError, getAoReadTransport } from 'api/aoNetwork';

import { DEFAULT_AO_NODE, PROCESSES } from 'helpers/config';
import { checkValidAddress, checkValidEthereumAddress } from 'helpers/utils';

import type { TokenHolder, TokenHoldersSnapshot } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isAmount(value: unknown): value is string {
	return typeof value === 'string' && /^(0|[1-9]\d*)$/.test(value);
}

export function parseHoldersSnapshot(value: unknown, tokenProcess = PROCESSES.ao): TokenHoldersSnapshot {
	if (
		!isRecord(value) ||
		value.schema !== 'holders@1.0' ||
		value.tokenProcess !== tokenProcess ||
		typeof value.name !== 'string' ||
		!value.name ||
		typeof value.ticker !== 'string' ||
		!value.ticker ||
		typeof value.generatedAt !== 'string' ||
		!Number.isFinite(Date.parse(value.generatedAt)) ||
		!Number.isSafeInteger(value.denomination) ||
		Number(value.denomination) < 0 ||
		Number(value.denomination) > 36 ||
		!Number.isSafeInteger(value.lastScannedSlot) ||
		Number(value.lastScannedSlot) < 0 ||
		!['topN', 'totalBalances', 'totalHolders'].every(
			(key) => Number.isSafeInteger(value[key]) && Number(value[key]) >= 0
		) ||
		Number(value.topN) < 1 ||
		Number(value.totalHolders) > Number(value.totalBalances) ||
		!isAmount(value.totalSupply) ||
		!Array.isArray(value.holders) ||
		value.holders.length > Number(value.topN) ||
		value.holders.length > Number(value.totalHolders)
	)
		throw new AoReadError('invalid-response');
	const seen = new Set<string>();
	const holders: TokenHolder[] = value.holders.map((holder) => {
		if (
			!isRecord(holder) ||
			typeof holder.address !== 'string' ||
			(!checkValidAddress(holder.address) && !checkValidEthereumAddress(holder.address)) ||
			seen.has(holder.address) ||
			!isAmount(holder.balance)
		)
			throw new AoReadError('invalid-response');
		seen.add(holder.address);
		return { address: holder.address, balance: holder.balance };
	});
	holders.sort((left, right) => {
		const difference = BigInt(right.balance) - BigInt(left.balance);
		return difference > 0n ? 1 : difference < 0n ? -1 : left.address < right.address ? -1 : 1;
	});
	return {
		tokenProcess,
		name: value.name,
		ticker: value.ticker,
		denomination: Number(value.denomination),
		generatedAt: value.generatedAt,
		lastScannedSlot: Number(value.lastScannedSlot),
		topN: Number(value.topN),
		totalBalances: Number(value.totalBalances),
		totalHolders: Number(value.totalHolders),
		totalSupply: value.totalSupply,
		holders,
	};
}

export async function getTokenHolders(
	options: { tokenProcess?: string; signal?: AbortSignal } = {}
): Promise<TokenHoldersSnapshot> {
	const tokenProcess = options.tokenProcess ?? PROCESSES.ao;
	if (!checkValidAddress(tokenProcess)) throw new AoReadError('invalid-input');
	// This daily snapshot is published on the same peer as the network metrics process.
	const transport = getAoReadTransport({
		peers: [DEFAULT_AO_NODE.url],
		preferPermawebOS: false,
		fallbackToPeers: false,
	});
	const result = await transport.readJson(
		`/${PROCESSES.holders}~process@1.0/compute/holders/${tokenProcess}?require-codec=application/json&accept-bundle=true`,
		{ signal: options.signal, timeoutMs: 15_000 },
		(value) => parseHoldersSnapshot(value, tokenProcess)
	);
	return result.data;
}
