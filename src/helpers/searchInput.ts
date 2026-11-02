import { normalizeArweaveNode } from './arweaveNode';
import { parseAccountIdentity } from './identities';

export function checkValidBlockId(value: string): boolean {
	return /^[a-z0-9_-]{64}$/i.test(value);
}

export function checkValidBlockHeight(value: string): boolean {
	return /^\d+$/.test(value) && Number.isSafeInteger(Number(value));
}

export function isValidSearchInput(value: string): boolean {
	const input = value.trim();
	return (
		normalizeArweaveNode(input) !== null ||
		parseAccountIdentity(input) !== null ||
		checkValidBlockHeight(input) ||
		checkValidBlockId(input)
	);
}
