import fc from 'fast-check';
import { createHash } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';

import { requestRemote } from '../../src/api/http';
import { lookupTransaction } from '../../src/api/transactions';
import { selectTransactionSignature } from '../../src/api/transactions/signatureInput';
import {
	ARWEAVE_HOST,
	ETHEREUM_ADDRESS,
	ETHEREUM_DID,
	ETHEREUM_KEY,
	ETHEREUM_KEY_HEX,
	SOLANA_DID,
	SOLANA_KEY,
} from '../fixtures/identities';

vi.mock('api/http', () => ({ requestRemote: vi.fn() }));
afterEach(() => vi.resetAllMocks());
const id = 'a'.repeat(43);

async function lookup(signatureInput: string, headers: Record<string, string> = {}) {
	vi.mocked(requestRemote).mockResolvedValue(
		new Response(null, { headers: { 'signature-input': signatureInput, ...headers } })
	);
	return (await lookupTransaction(id)).node;
}

it.each([
	[`committer="${ETHEREUM_DID}";owner="${ETHEREUM_KEY}"`, ETHEREUM_DID, ETHEREUM_KEY],
	[`committer="${ARWEAVE_HOST}";owner="${SOLANA_KEY}"`, ARWEAVE_HOST, SOLANA_KEY],
	[`keyid="${ETHEREUM_DID}";public-key="${ETHEREUM_KEY}"`, ETHEREUM_DID, ETHEREUM_KEY],
	[`committer="did:web:example.com";owner="${ETHEREUM_KEY}"`, 'did:web:example.com', ETHEREUM_KEY],
])('keeps a reported identity and key from the same commitment: %s', async (params, address, key) => {
	expect((await lookup(`sig=("action");alg="ans104@1.0/ethereum";${params}`)).owner).toEqual({ address, key });
});

it.each([
	['ethereum', ETHEREUM_KEY, ETHEREUM_DID],
	[
		'typed_ethereum',
		Buffer.from('0x2c7536e3605d9c16a7a3d7b1898e529396a65c23').toString('base64url'),
		'did:pkh:eip155:1:0x2c7536E3605D9C16a7a3D7b1898e529396a65c23',
	],
	['solana', SOLANA_KEY, SOLANA_DID],
])('derives %s owners using the declared signing scheme', async (type, key, address) => {
	expect((await lookup(`sig=();alg="ans104@1.0/${type}";owner="${key}"`)).owner).toEqual({ address, key });
});

it.each([
	['rsa-pss-sha256', Buffer.alloc(512, 42)],
	['ed25519-sha512', Buffer.from(SOLANA_KEY, 'base64url')],
	['ecdsa-secp256k1-sha256', Buffer.from(`02${ETHEREUM_KEY_HEX.slice(2, 66)}`, 'hex')],
])('hashes the correct public-key representation for %s', async (type, bytes) => {
	const key = bytes.toString('base64url');
	expect((await lookup(`sig=();alg="tx@1.0/${type}";owner="${key}"`)).owner).toEqual({
		address: createHash('sha256').update(bytes).digest('base64url'),
		key,
	});
});

it('retains the old publickey response convention', async () => {
	expect((await lookup(`sig=();keyid="publickey:${ETHEREUM_KEY}"`)).owner).toEqual({
		address: ETHEREUM_ADDRESS,
		key: ETHEREUM_KEY,
	});
});

it('takes native metadata rather than the gateway signature, regardless of order', async () => {
	const gateway = `gateway=("server");alg="rsa-pss-sha512";keyid="did:ar:${'b'.repeat(43)}";public-key="other"`;
	const native = `native=("action");alg="ans104@1.0/ethereum";committer="${ETHEREUM_DID}";owner="${ETHEREUM_KEY}"`;
	for (const input of [`${gateway}, ${native}`, `${native}, ${gateway}`]) {
		const node = await lookup(input, { action: 'Transfer', server: 'gateway' });
		expect(node.owner).toEqual({ address: ETHEREUM_DID, key: ETHEREUM_KEY });
		expect(node.tags).toEqual([{ name: 'action', value: 'Transfer' }]);
	}
});

it('selects the requested commitment among multiple native signatures', async () => {
	const input = `other=();alg="ans104@1.0/ethereum";committer="other", comm-${id}=();alg="ans104@1.0/ethereum";committer="${ETHEREUM_DID}";owner="${ETHEREUM_KEY}"`;
	expect((await lookup(input)).owner).toEqual({ address: ETHEREUM_DID, key: ETHEREUM_KEY });
});

it.each([
	`first=();alg="ans104@1.0/ethereum";committer="${ETHEREUM_DID}", second=();alg="ans104@1.0/ethereum";owner="${ETHEREUM_KEY}"`,
	`sig=();alg="unknown@1.0/unknown";owner="${ETHEREUM_KEY}"`,
	`sig=();alg="ans104@1.0/ethereum";owner="${SOLANA_KEY}"`,
	`sig=();alg="ans104@1.0/typed_ethereum";owner="${SOLANA_KEY}"`,
	`sig=();alg="ans104@1.0/solana";owner="${ETHEREUM_KEY}"`,
	`sig=();alg="hmac-sha256";keyid="hmac:constant:ao"`,
	`comm-${id}=();alg="ans104@1.0/unsigned-sha256", gateway=();alg="rsa-pss-sha512";keyid="${ETHEREUM_DID}"`,
	`sig=();committer="${ETHEREUM_DID}";committer="other"`,
	`sig=();committer="${ETHEREUM_DID}`,
])('does not fabricate an owner for malformed, ambiguous, unsigned or unsupported metadata: %s', async (input) => {
	expect((await lookup(input)).owner.address).toBeNull();
});

it('keeps quoted commas, semicolons and escaped quotes inside their parameter', async () => {
	const node = await lookup(
		`sig=("action");note="comma, semicolon; quote \\"";committer="${ETHEREUM_DID}";owner="${ETHEREUM_KEY}"`,
		{ action: 'Transfer' }
	);
	expect(node.owner.address).toBe(ETHEREUM_DID);
});

it('handles arbitrary untrusted signature-input text without throwing', () => {
	fc.assert(
		fc.property(fc.string({ maxLength: 500 }), (input) => {
			expect(() => selectTransactionSignature(input, id)).not.toThrow();
		})
	);
});
