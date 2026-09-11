import { getTxEndpoint } from './endpoints';
import { checkValidAddress } from './utils';

export function normalizeProfileImage(value: unknown): string | null {
	if (typeof value !== 'string' || !value || value.length > 2048) return null;
	if (checkValidAddress(value)) return `ar://${value}`;
	if (value.startsWith('ar://') && checkValidAddress(value.slice(5))) return value;
	try {
		const url = new URL(value);
		return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
	} catch {
		return null;
	}
}

export function getProfileImageUrl(value: unknown): string | undefined {
	const normalized = normalizeProfileImage(value);
	return normalized?.startsWith('ar://') ? getTxEndpoint(normalized.slice(5)) : normalized ?? undefined;
}
