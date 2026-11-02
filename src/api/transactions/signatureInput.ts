import { secp256k1 } from '@noble/curves/secp256k1.js';
import { sha256 } from '@noble/hashes/sha2.js';

import {
	checksumEthereumAddress,
	encodeBase58,
	getEthereumOwnerAddress,
	isEthereumAddress,
	SOLANA_MAINNET,
} from 'helpers/identities';

export type SignatureInput = { label: string; value: string; params: Map<string, string> };

/** Split dictionary members/parameters without splitting quoted values or covered component lists. */
function splitFields(value: string, delimiter: string): string[] | null {
	const fields: string[] = [];
	let start = 0;
	let quoted = false;
	let escaped = false;
	let depth = 0;
	for (let index = 0; index < value.length; index++) {
		const char = value[index];
		if (escaped) {
			if (char !== '"' && char !== '\\') return null;
			escaped = false;
		} else if (quoted && char === '\\') escaped = true;
		else if (char === '"') quoted = !quoted;
		else if (!quoted && char === '(') {
			if (++depth > 1) return null;
		} else if (!quoted && char === ')') {
			if (--depth < 0) return null;
		} else if (!quoted && depth === 0 && char === delimiter) {
			fields.push(value.slice(start, index).trim());
			start = index + 1;
		}
	}
	if (quoted || escaped || depth !== 0) return null;
	fields.push(value.slice(start).trim());
	return fields.every(Boolean) ? fields : null;
}

function readInputs(value: string | null): SignatureInput[] {
	const entries: SignatureInput[] = [];
	for (const entry of splitFields(value ?? '', ',') ?? []) {
		const fields = splitFields(entry, ';');
		const label = fields?.[0].match(/^([a-z*][a-z\d_.*-]*)=\(.*\)$/);
		if (!label || entries.some((input) => input.label === label[1])) return [];
		const params = new Map<string, string>();
		for (const field of fields.slice(1)) {
			const param = /^([a-z*][a-z\d_.*-]*)(?:=("(?:[^"\\\r\n]|\\["\\])*"|[^\s";]+))?$/.exec(field);
			if (!param || params.has(param[1])) return [];
			const raw = param[2] ?? '';
			params.set(param[1], raw.startsWith('"') ? raw.slice(1, -1).replace(/\\(["\\])/g, '$1') : raw);
		}
		entries.push({ label: label[1], value: entry, params });
	}
	return entries;
}

function isUnsigned(input: SignatureInput): boolean {
	return (
		/^(?:.*\/)?(?:hmac-sha256|unsigned-sha256)$/.test(input.params.get('alg') ?? '') ||
		/^(?:hmac:)?constant:/.test(input.params.get('keyid') ?? input.params.get('committer') ?? '')
	);
}

export function selectTransactionSignature(value: string | null, txId: string): SignatureInput | null {
	const inputs = readInputs(value);
	const exact = inputs.find((input) => input.label === `comm-${txId.toLowerCase()}` || input.params.get('id') === txId);
	if (exact) return isUnsigned(exact) ? null : exact;
	const native = inputs.filter((input) => /^(?:ans104|tx)@1\.0\//.test(input.params.get('alg') ?? ''));
	// Never combine a gateway's signature with another commitment's owner/key parameters.
	if (native.length) return native.length === 1 && !isUnsigned(native[0]) ? native[0] : null;
	const signed = inputs.filter((input) => !isUnsigned(input));
	return signed.length === 1 ? signed[0] : null;
}

export function readSignatureOwner(input: SignatureInput | null): { address: string | null; key?: string } {
	if (!input) return { address: null };
	const keyId = input.params.get('keyid');
	const legacyKey = keyId?.startsWith('publickey:') ? keyId.slice(10) : undefined;
	const key = input.params.get('public-key') ?? input.params.get('owner') ?? legacyKey;
	const reported = input.params.get('committer') ?? (legacyKey ? undefined : keyId);
	if (reported) return { address: reported, key };
	if (!key || !/^[A-Za-z0-9_-]+={0,2}$/.test(key)) return { address: null };
	try {
		const bytes = Uint8Array.from(atob(key.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0));
		const type = input.params.get('alg')?.split('/').pop();
		let address: string | null = null;
		if (type === 'ethereum' || (!type && legacyKey)) address = getEthereumOwnerAddress(key);
		if (type === 'typed_ethereum') {
			const account = new TextDecoder().decode(bytes);
			if (isEthereumAddress(account)) address = checksumEthereumAddress(account);
		}
		if (address) return { address: legacyKey ? address : `did:pkh:eip155:1:${address}`, key };
		if (type === 'solana')
			return {
				address: bytes.length === 32 ? `did:pkh:solana:${SOLANA_MAINNET}:${encodeBase58(bytes)}` : null,
				key,
			};
		const isRsa = ['rsa-pss-sha256', 'rsa-pss-sha512'].includes(type) && bytes.length >= 256;
		const isEd25519 = type === 'ed25519-sha512' && bytes.length === 32;
		const isEcdsa = type === 'ecdsa-secp256k1-sha256' && bytes.length === 33;
		if (isEcdsa) secp256k1.Point.fromBytes(bytes).assertValidity();
		// Old publickey: responses sometimes omit alg; retain their historical RSA fallback only there.
		if (!isRsa && !isEd25519 && !isEcdsa && !(legacyKey && !type)) return { address: null, key };
		return {
			address: btoa(String.fromCharCode(...sha256(bytes)))
				.replace(/\+/g, '-')
				.replace(/\//g, '_')
				.replace(/=+$/, ''),
			key,
		};
	} catch {
		return { address: null };
	}
}
