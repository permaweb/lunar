import { secp256k1 } from '@noble/curves/secp256k1.js';
import { expect, it, vi } from 'vitest';

import Arweave from 'arweave';

import { ecdsaTransactionSignatureData, signedTransactionSignerAddress } from '../../src/api/profiles/signature';

it('verifies Bazar-compatible ECDSA transactions and rejects changed data', async () => {
	const secretKey = new Uint8Array(32);
	secretKey[31] = 1;
	const tx = {
		format: 2,
		owner: '',
		target: '',
		quantity: '0',
		reward: '1',
		last_tx: '',
		tags: [],
		data_size: '0',
		data_root: '',
		signature: '',
		id: '',
	};
	const recovered = secp256k1.sign(await ecdsaTransactionSignatureData(tx), secretKey, { format: 'recovered' });
	const signature = new Uint8Array(65);
	signature.set(recovered.subarray(1));
	signature[64] = recovered[0];
	tx.signature = Arweave.utils.bufferTob64Url(signature);
	tx.id = Arweave.utils.bufferTob64Url(await Arweave.crypto.hash(signature));
	const expected = Arweave.utils.bufferTob64Url(await Arweave.crypto.hash(secp256k1.getPublicKey(secretKey)));
	const verifier = { ownerToAddress: vi.fn(), verifyRsa: vi.fn() };
	expect(await signedTransactionSignerAddress(tx, verifier)).toBe(expected);
	expect(verifier.verifyRsa).not.toHaveBeenCalled();
	await expect(signedTransactionSignerAddress({ ...tx, id: 'x'.repeat(43) }, verifier)).rejects.toThrow();
	expect(await signedTransactionSignerAddress({ ...tx, reward: '2' }, verifier)).not.toBe(expected);
});
