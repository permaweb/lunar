import type { ProfileType } from 'helpers/types';

export type ProfileUpdate = {
	username: string;
	displayName: string;
	description: string;
	thumbnail: string | File | null;
	banner: string | File | null;
};
export type ProfilePhase = 'preparing' | 'awaiting-wallet' | 'uploading';
export type ProfileErrorCode =
	| 'invalid-input'
	| 'invalid-response'
	| 'unavailable'
	| 'timeout'
	| 'cancelled'
	| 'rejected'
	| 'wallet-changed'
	| 'wallet-unavailable'
	| 'unknown-outcome';
export class ProfileError extends Error {
	constructor(
		public readonly code: ProfileErrorCode,
		public readonly transactionId?: string,
		public readonly uploadedImages?: Partial<Record<'thumbnail' | 'banner', string>>
	) {
		super(code);
		this.name = 'ProfileError';
	}
}
export type ProfileApi = {
	read: (address: string, signal: AbortSignal) => Promise<ProfileType | null>;
	save: (
		wallet: unknown,
		address: string,
		update: ProfileUpdate,
		options: { signal: AbortSignal; onPhase?: (phase: ProfilePhase) => void }
	) => Promise<ProfileType>;
};
export const PROFILE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const PROFILE_IMAGE_TYPES = ['image/gif', 'image/jpeg', 'image/png', 'image/webp'];
