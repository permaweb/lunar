import { checkValidAoAccount } from './aoAccounts';
import { normalizeArweaveNode } from './arweaveNode';

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
		checkValidAoAccount(input) ||
		checkValidBlockHeight(input) ||
		checkValidBlockId(input)
	);
}
