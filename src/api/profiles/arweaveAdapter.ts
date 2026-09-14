import Arweave from 'arweave';

import { arweaveEndpoint } from 'helpers/endpoints';
import { normalizeProfileImage } from 'helpers/profile';
import type { ProfileType } from 'helpers/types';
import { checkValidAddress } from 'helpers/utils';

import { signedTransactionSignerAddress } from './signature';
import type { ProfileApi, ProfileUpdate } from './types';
import { PROFILE_IMAGE_MAX_BYTES, PROFILE_IMAGE_TYPES, ProfileError } from './types';

const PROFILE_PROTOCOL = 'Account-0.3';
const TIMEOUT_MS = 20_000;
type Transaction = Awaited<ReturnType<Arweave['createTransaction']>>;
type SigningWallet = { getActiveAddress: () => Promise<string>; sign: (transaction: Transaction) => Promise<unknown> };

function record(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ProfileError('invalid-response');
	return value as Record<string, unknown>;
}
function text(value: unknown, maximum: number): string {
	if (value === undefined) return '';
	if (typeof value !== 'string' || value.length > maximum) throw new ProfileError('invalid-response');
	return value;
}
function image(value: unknown): string {
	if (value === undefined || value === '') return '';
	const normalized = normalizeProfileImage(value);
	if (!normalized) throw new ProfileError('invalid-response');
	return normalized;
}
export function parseAccountProfile(address: string, id: string, payload: unknown): ProfileType {
	if (!checkValidAddress(address) || !checkValidAddress(id)) throw new ProfileError('invalid-response');
	const body = record(payload);
	return {
		id,
		walletAddress: address,
		username: text(body.handle, 64),
		displayName: text(body.name, 200),
		description: text(body.bio, 500),
		thumbnail: image(body.avatar),
		banner: image(body.banner),
		assets: [],
	};
}
function validateUpdate(update: ProfileUpdate) {
	if (
		typeof update.username !== 'string' ||
		update.username.length > 64 ||
		typeof update.displayName !== 'string' ||
		update.displayName.length > 200 ||
		typeof update.description !== 'string' ||
		update.description.length > 500
	)
		throw new ProfileError('invalid-input');
	for (const value of [update.thumbnail, update.banner]) {
		if (value === null || value === '') continue;
		if (typeof value === 'string') {
			if (!normalizeProfileImage(value)) throw new ProfileError('invalid-input');
		} else if (
			!(value instanceof File) ||
			!PROFILE_IMAGE_TYPES.includes(value.type) ||
			!value.size ||
			value.size > PROFILE_IMAGE_MAX_BYTES
		)
			throw new ProfileError('invalid-input');
	}
}

export function createProfileApi(
	options: { gateway?: string; fetch?: typeof fetch; arweave?: Arweave } = {}
): ProfileApi {
	const gateway = options.gateway ?? arweaveEndpoint;
	const fetcher: typeof fetch = (...args) => (options.fetch ?? fetch)(...args);
	let arweave = options.arweave;
	function client() {
		const url = new URL(gateway);
		arweave ??= Arweave.init({
			host: url.hostname,
			port: Number(url.port || 443),
			protocol: url.protocol.slice(0, -1),
			timeout: TIMEOUT_MS,
		});
		return arweave;
	}
	async function request(path: string, signal: AbortSignal, init: RequestInit = {}): Promise<Response> {
		if (signal.aborted) throw new ProfileError('cancelled');
		const controller = new AbortController();
		const handleAbort = () => controller.abort();
		signal.addEventListener('abort', handleAbort, { once: true });
		const timeout = setTimeout(handleAbort, TIMEOUT_MS);
		try {
			const response = await fetcher(new URL(path, gateway), {
				...init,
				signal: controller.signal,
				credentials: 'omit',
			});
			// Consume the body within the timeout so a stalled stream cannot keep profile reads pending.
			const body = await response.text();
			if (body.length > 256_000) throw new ProfileError('invalid-response');
			return new Response(body, { status: response.status, headers: response.headers });
		} catch (error) {
			if (signal.aborted) throw new ProfileError('cancelled');
			if (controller.signal.aborted) throw new ProfileError('timeout');
			throw error instanceof ProfileError ? error : new ProfileError('unavailable');
		} finally {
			clearTimeout(timeout);
			signal.removeEventListener('abort', handleAbort);
		}
	}
	async function read(address: string, signal: AbortSignal): Promise<ProfileType | null> {
		if (!checkValidAddress(address)) throw new ProfileError('invalid-input');
		try {
			const response = await request('/graphql', signal, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					query: `query LatestAccountProfile($owners: [String!]) { transactions(owners: $owners, tags: [{ name: "Protocol-Name", values: ["${PROFILE_PROTOCOL}"] }], sort: HEIGHT_DESC, first: 1) { edges { node { id owner { address } } } } }`,
					variables: { owners: [address] },
				}),
			});
			if (!response.ok) throw new ProfileError('unavailable');
			const payload = record(await response.json());
			if (payload.errors) throw new ProfileError('invalid-response');
			const edges = record(record(payload.data).transactions).edges;
			if (!Array.isArray(edges) || edges.length > 1) throw new ProfileError('invalid-response');
			if (!edges.length) return null;
			const node = record(record(edges[0]).node);
			if (typeof node.id !== 'string' || !checkValidAddress(node.id) || record(node.owner).address !== address)
				throw new ProfileError('invalid-response');
			const data = await request(`/${node.id}`, signal);
			if (!data.ok) throw new ProfileError('unavailable');
			return parseAccountProfile(address, node.id, await data.json());
		} catch (error) {
			throw error instanceof ProfileError ? error : new ProfileError('invalid-response');
		}
	}
	return {
		read,
		async save(wallet, address, update, saveOptions) {
			if (!checkValidAddress(address)) throw new ProfileError('invalid-input');
			validateUpdate(update);
			if (
				!wallet ||
				typeof wallet !== 'object' ||
				typeof (wallet as SigningWallet).sign !== 'function' ||
				typeof (wallet as SigningWallet).getActiveAddress !== 'function'
			)
				throw new ProfileError('wallet-unavailable');
			const signer = wallet as SigningWallet;
			async function assertWallet() {
				if (saveOptions.signal.aborted) throw new ProfileError('cancelled');
				if ((await signer.getActiveAddress()) !== address) throw new ProfileError('wallet-changed');
			}
			async function publish(data: string | Uint8Array, tags: { name: string; value: string }[]): Promise<string> {
				await assertWallet();
				saveOptions.onPhase?.('preparing');
				const transaction = await client().createTransaction({ data }, 'use_wallet');
				for (const tag of tags) transaction.addTag(tag.name, tag.value);
				const originalTags = JSON.stringify(transaction.tags);
				const originalData = transaction.toJSON().data;
				await assertWallet();
				saveOptions.onPhase?.('awaiting-wallet');
				try {
					const result = await signer.sign(transaction);
					if (result && result !== transaction) {
						const signed = record(result);
						if (
							typeof signed.id !== 'string' ||
							typeof signed.owner !== 'string' ||
							typeof signed.signature !== 'string'
						)
							throw new ProfileError('invalid-response');
						transaction.setSignature({
							id: signed.id,
							owner: signed.owner,
							signature: signed.signature,
							reward: typeof signed.reward === 'string' ? signed.reward : undefined,
							tags: Array.isArray(signed.tags) ? (signed.tags as Transaction['tags']) : undefined,
						});
					}
				} catch (error) {
					if (error instanceof ProfileError) throw error;
					const code = error && typeof error === 'object' ? (error as { code?: unknown }).code : undefined;
					throw new ProfileError(
						code === 4001 || code === 'USER_REJECTED' || code === 'ACTION_REJECTED' ? 'rejected' : 'wallet-unavailable'
					);
				}
				await assertWallet();
				if (
					!checkValidAddress(transaction.id) ||
					transaction.target !== '' ||
					transaction.quantity !== '0' ||
					JSON.stringify(transaction.tags) !== originalTags ||
					transaction.toJSON().data !== originalData
				)
					throw new ProfileError('invalid-response');
				let owner: string;
				try {
					owner = await signedTransactionSignerAddress(transaction, {
						ownerToAddress: (key) => client().wallets.ownerToAddress(key),
						verifyRsa: (candidate) => client().transactions.verify(candidate as Transaction),
					});
				} catch {
					throw new ProfileError('invalid-response');
				}
				if (owner !== address) throw new ProfileError('wallet-changed');
				await assertWallet();
				saveOptions.onPhase?.('uploading');
				try {
					const response = await request('/tx', saveOptions.signal, {
						method: 'POST',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify(transaction.toJSON()),
					});
					if (![200, 202, 208].includes(response.status)) throw new ProfileError('unknown-outcome', transaction.id);
				} catch {
					throw new ProfileError('unknown-outcome', transaction.id);
				}
				return transaction.id;
			}
			const uploadedImages: Partial<Record<'thumbnail' | 'banner', string>> = {};
			async function uploadImage(value: ProfileUpdate['thumbnail'], kind: 'Avatar' | 'Banner'): Promise<string> {
				if (!value) return '';
				if (typeof value === 'string') return normalizeProfileImage(value)!;
				const id = await publish(new Uint8Array(await value.arrayBuffer()), [
					{ name: 'Content-Type', value: value.type },
					{ name: 'App-Name', value: 'Lunar' },
					{ name: 'Type', value: `Profile-${kind}` },
				]);
				uploadedImages[kind === 'Avatar' ? 'thumbnail' : 'banner'] = `ar://${id}`;
				return `ar://${id}`;
			}
			try {
				const body = {
					handle: update.username.trim(),
					name: update.displayName.trim(),
					bio: update.description,
					avatar: await uploadImage(update.thumbnail, 'Avatar'),
					banner: await uploadImage(update.banner, 'Banner'),
				};
				const id = await publish(JSON.stringify(body), [
					{ name: 'Content-Type', value: 'application/json' },
					{ name: 'Protocol-Name', value: PROFILE_PROTOCOL },
					{ name: 'App-Name', value: 'Lunar' },
					{ name: 'handle', value: body.handle },
				]);
				return parseAccountProfile(address, id, body);
			} catch (error) {
				throw new ProfileError(
					error instanceof ProfileError ? error.code : 'unavailable',
					error instanceof ProfileError ? error.transactionId : undefined,
					uploadedImages
				);
			}
		},
	};
}
