import { isArweaveId } from './identities';

/** Read an AO message link without widening the resource-ID validator. */
export function readAoLinkId(value: unknown): string | null {
	if (typeof value !== 'string' || !value.startsWith('ao:')) return null;
	const id = value.slice(3);
	return isArweaveId(id) ? id : null;
}

function isLiteralSyntaxKey(key: string): boolean {
	const normalized = key.toLowerCase();
	return normalized === 'path' || normalized === 'hashpath' || normalized.startsWith('priv');
}

/** Commitment records and private values retain their URI text as metadata. */
export function isAoLinkMetadataKey(key: string): boolean {
	const normalized = key.toLowerCase();
	return normalized === 'commitments' || normalized === 'commitments+link' || normalized.startsWith('priv');
}

export function isLegacyAoLinkKey(key: string, isCommitmentMetadata = false): boolean {
	return !isCommitmentMetadata && key.endsWith('+link') && !isLiteralSyntaxKey(key.slice(0, -5));
}

/** Read current URI values and historical +link fields in their message context. */
export function readMessageLinkId(key: string, value: unknown, isCommitmentMetadata = false): string | null {
	if (isCommitmentMetadata || isLiteralSyntaxKey(key)) return null;
	if (isAoLinkMetadataKey(key) && !isLegacyAoLinkKey(key)) return null;
	const id = readAoLinkId(value);
	if (id) return id;
	return isLegacyAoLinkKey(key) && typeof value === 'string' && isArweaveId(value) ? value : null;
}
