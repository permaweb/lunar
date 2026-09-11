import { afterEach, describe, expect, it, vi } from 'vitest';

import Arweave from 'arweave';
import Transaction from 'arweave/web/lib/transaction';

import { createProfileApi, parseAccountProfile } from '../../src/api/profiles/arweaveAdapter';
import { getProfileImageUrl } from '../../src/helpers/profile';

const ADDRESS = 'a'.repeat(43);
const ID = 'p'.repeat(43);
const AVATAR = 'v'.repeat(43);
const draft = {
	username: 'captain',
	displayName: 'Captain',
	description: 'Ships code.',
	thumbnail: `ar://${AVATAR}`,
	banner: null,
};
const signal = () => new AbortController().signal;
afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});
function writingApi() {
	const arweave = Arweave.init({});
	vi.spyOn(arweave, 'createTransaction').mockImplementation(
		async ({ data }) =>
			new Transaction({
				data: typeof data === 'string' ? new TextEncoder().encode(data) : (data as Uint8Array),
				reward: '42',
				last_tx: 'l'.repeat(43),
			})
	);
	vi.spyOn(arweave.transactions, 'verify').mockResolvedValue(true);
	vi.spyOn(arweave.wallets, 'ownerToAddress').mockResolvedValue(ADDRESS);
	const wallet = {
		getActiveAddress: vi.fn(async () => ADDRESS),
		sign: vi.fn(async (tx: Transaction) => ({ ...tx.toJSON(), id: ID, owner: 'public-key', signature: 'signature' })),
	};
	const fetcher = vi.fn(async () => new Response('', { status: 202 }));
	return { api: createProfileApi({ arweave, fetch: fetcher }), wallet, arweave, fetcher };
}

describe('transaction profiles', () => {
	it('reads the latest Account-0.3 transaction belonging to the requested wallet', async () => {
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(
				Response.json({ data: { transactions: { edges: [{ node: { id: ID, owner: { address: ADDRESS } } }] } } })
			)
			.mockResolvedValueOnce(
				Response.json({ handle: 'captain', name: 'Captain', bio: 'Ships code.', avatar: `ar://${AVATAR}` })
			);
		const profile = await createProfileApi({ fetch: fetcher }).read(ADDRESS, signal());
		expect(profile).toMatchObject({
			id: ID,
			walletAddress: ADDRESS,
			username: 'captain',
			displayName: 'Captain',
			description: 'Ships code.',
		});
		expect(getProfileImageUrl(profile.thumbnail)).toBe(`https://arweave.net/${AVATAR}`);
		const query = JSON.parse(fetcher.mock.calls[0][1].body);
		expect(query.variables).toEqual({ owners: [ADDRESS] });
		expect(query.query).toContain('Account-0.3');
		expect(query.query).toContain('HEIGHT_DESC, first: 1');
	});
	it('separates an empty profile from malformed, mismatched, and failed responses', async () => {
		const fetcher = vi.fn().mockResolvedValue(Response.json({ data: { transactions: { edges: [] } } }));
		const api = createProfileApi({ fetch: fetcher });
		expect(await api.read(ADDRESS, signal())).toBeNull();
		for (const value of [
			{},
			{ errors: ['no'] },
			{ data: { transactions: { edges: [{ node: { id: ID, owner: { address: AVATAR } } }] } } },
		]) {
			fetcher.mockResolvedValueOnce(Response.json(value));
			await expect(api.read(ADDRESS, signal())).rejects.toMatchObject({ code: 'invalid-response' });
		}
		fetcher.mockResolvedValueOnce(new Response('', { status: 503 }));
		await expect(api.read(ADDRESS, signal())).rejects.toMatchObject({ code: 'unavailable' });
		expect(() => parseAccountProfile(ADDRESS, ID, { handle: [], avatar: '' })).toThrow();
		expect(() => parseAccountProfile(ADDRESS, ID, { avatar: 'javascript:alert(1)' })).toThrow();
	});
	it('publishes profile creation and edits as signed JSON transactions with exact tags', async () => {
		const { api, wallet, arweave, fetcher } = writingApi();
		const onPhase = vi.fn();
		const profile = await api.save(wallet, ADDRESS, draft, { signal: signal(), onPhase });
		expect(profile).toMatchObject({ id: ID, username: 'captain', thumbnail: `ar://${AVATAR}` });
		const body = JSON.parse(fetcher.mock.calls[0][1].body);
		const decode = (value: string) => new TextDecoder().decode(Arweave.utils.b64UrlToBuffer(value));
		expect(JSON.parse(decode(body.data))).toEqual({
			handle: 'captain',
			name: 'Captain',
			bio: 'Ships code.',
			avatar: `ar://${AVATAR}`,
			banner: '',
		});
		expect(body.tags.map((tag) => ({ name: decode(tag.name), value: decode(tag.value) }))).toEqual([
			{ name: 'Content-Type', value: 'application/json' },
			{ name: 'Protocol-Name', value: 'Account-0.3' },
			{ name: 'App-Name', value: 'Lunar' },
			{ name: 'handle', value: 'captain' },
		]);
		expect(arweave.transactions.verify).toHaveBeenCalledOnce();
		expect(fetcher.mock.calls[0][0].pathname).toBe('/tx');
		expect(onPhase.mock.calls.flat()).toEqual(['preparing', 'awaiting-wallet', 'uploading']);
	});
	it('uploads changed images separately and records their transaction references in the profile', async () => {
		const { api, wallet, fetcher } = writingApi();
		const profile = await api.save(
			wallet,
			ADDRESS,
			{ ...draft, thumbnail: new File([new Uint8Array([1, 2, 3])], 'avatar.webp', { type: 'image/webp' }) },
			{ signal: signal() }
		);
		expect(fetcher).toHaveBeenCalledTimes(2);
		expect(profile.thumbnail).toBe(`ar://${ID}`);
		expect(wallet.sign).toHaveBeenCalledTimes(2);
	});
	it('validates image size and type before asking for a signature', async () => {
		const { api, wallet, fetcher } = writingApi();
		for (const thumbnail of [
			new File(['x'], 'x.svg', { type: 'image/svg+xml' }),
			new File([], 'x.png', { type: 'image/png' }),
			new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'x.png', { type: 'image/png' }),
		]) {
			await expect(api.save(wallet, ADDRESS, { ...draft, thumbnail }, { signal: signal() })).rejects.toMatchObject({
				code: 'invalid-input',
			});
		}
		expect(wallet.sign).not.toHaveBeenCalled();
		expect(fetcher).not.toHaveBeenCalled();
	});
	it('retains uploaded images if a later signature is rejected so retrying does not upload them again', async () => {
		const { api, wallet, fetcher } = writingApi();
		wallet.sign
			.mockImplementationOnce(async (tx) => ({
				...tx.toJSON(),
				id: AVATAR,
				owner: 'public-key',
				signature: 'signature',
			}))
			.mockRejectedValueOnce({ code: 4001 });
		const update = { ...draft, thumbnail: new File([new Uint8Array([1])], 'avatar.png', { type: 'image/png' }) };
		const failure = await api.save(wallet, ADDRESS, update, { signal: signal() }).catch((error) => error);
		expect(failure).toMatchObject({ code: 'rejected', uploadedImages: { thumbnail: `ar://${AVATAR}` } });
		expect(fetcher).toHaveBeenCalledOnce();
		const profile = await api.save(wallet, ADDRESS, { ...update, ...failure.uploadedImages }, { signal: signal() });
		expect(profile.thumbnail).toBe(`ar://${AVATAR}`);
		expect(fetcher).toHaveBeenCalledTimes(2);
		expect(wallet.sign).toHaveBeenCalledTimes(3);
	});
	it('does not publish after rejection, account switches, or a changed signed payload', async () => {
		const { api, wallet, fetcher } = writingApi();
		wallet.sign.mockRejectedValueOnce({ code: 4001 });
		await expect(api.save(wallet, ADDRESS, draft, { signal: signal() })).rejects.toMatchObject({ code: 'rejected' });
		wallet.getActiveAddress.mockResolvedValueOnce(AVATAR);
		await expect(api.save(wallet, ADDRESS, draft, { signal: signal() })).rejects.toMatchObject({
			code: 'wallet-changed',
		});
		wallet.sign.mockImplementationOnce(async (tx) => {
			tx.data = new Uint8Array([1]);
			return { ...tx.toJSON(), id: ID, owner: 'public-key', signature: 'signature' };
		});
		await expect(api.save(wallet, ADDRESS, draft, { signal: signal() })).rejects.toMatchObject({
			code: 'invalid-response',
		});
		expect(fetcher).not.toHaveBeenCalled();
	});
	it('preserves the transaction ID after an uncertain submission and never retries a signed write', async () => {
		const { api, wallet, fetcher } = writingApi();
		fetcher.mockRejectedValueOnce(new TypeError('offline'));
		await expect(api.save(wallet, ADDRESS, draft, { signal: signal() })).rejects.toMatchObject({
			code: 'unknown-outcome',
			transactionId: ID,
		});
		expect(fetcher).toHaveBeenCalledOnce();
		expect(wallet.sign).toHaveBeenCalledOnce();
	});
	it('cancels stale reads and times out stalled responses', async () => {
		vi.useFakeTimers();
		const fetcher = vi.fn(
			(_url, init) =>
				new Promise<Response>((_resolve, reject) =>
					init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
				)
		);
		const api = createProfileApi({ fetch: fetcher });
		const controller = new AbortController();
		const cancelled = api.read(ADDRESS, controller.signal).catch((error) => error);
		controller.abort();
		expect(await cancelled).toMatchObject({ code: 'cancelled' });
		const stalled = api.read(ADDRESS, signal()).catch((error) => error);
		await vi.advanceTimersByTimeAsync(20_001);
		expect(await stalled).toMatchObject({ code: 'timeout' });
	});
});
