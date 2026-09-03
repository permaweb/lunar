import { AddressApiError, AddressChunk, AddressSnapshot, ArAddressBalance } from './types';

const DEFAULT_ARWEAVE_ENDPOINT = 'https://arweave.net';
const ARWEAVE_ADDRESS_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const ARWEAVE_ADDRESS_BYTE_LENGTH = 32;
const WALLET_LIST_ROOT_PATTERN = /^[A-Za-z0-9_-]{64}$/;
const DECIMAL_INTEGER_PATTERN = /^\d+$/;
const TEXT_DECODER = new TextDecoder();

const ETF_TAGS = {
	version: 131,
	smallInteger: 97,
	integer: 98,
	atom: 100,
	smallTuple: 104,
	largeTuple: 105,
	nil: 106,
	string: 107,
	list: 108,
	binary: 109,
	smallBig: 110,
	largeBig: 111,
	map: 116,
	atomUtf8: 118,
	smallAtomUtf8: 119,
	smallAtom: 115,
} as const;

class ErlangTermReader {
	private offset = 0;

	constructor(private readonly bytes: Uint8Array) {}

	read() {
		if (this.readByte() !== ETF_TAGS.version) {
			throw new AddressApiError('invalid-response', 'Wallet list response is not a valid Erlang term');
		}

		const value = this.readTerm();
		if (this.offset !== this.bytes.length) {
			throw new AddressApiError('invalid-response', 'Wallet list response contains trailing data');
		}

		return value;
	}

	private readTerm(): unknown {
		const tag = this.readByte();

		switch (tag) {
			case ETF_TAGS.smallInteger:
				return BigInt(this.readByte());
			case ETF_TAGS.integer:
				return BigInt(this.readInt32());
			case ETF_TAGS.atom:
			case ETF_TAGS.atomUtf8:
				return this.readText(this.readUint16());
			case ETF_TAGS.smallAtom:
			case ETF_TAGS.smallAtomUtf8:
				return this.readText(this.readByte());
			case ETF_TAGS.smallTuple:
				return this.readTerms(this.readByte());
			case ETF_TAGS.largeTuple:
				return this.readTerms(this.readUint32());
			case ETF_TAGS.nil:
				return [];
			case ETF_TAGS.string:
				return Array.from(this.readBytes(this.readUint16()), (byte) => BigInt(byte));
			case ETF_TAGS.list:
				return this.readList();
			case ETF_TAGS.binary:
				return this.readBytes(this.readUint32());
			case ETF_TAGS.smallBig:
				return this.readBigInteger(this.readByte());
			case ETF_TAGS.largeBig:
				return this.readBigInteger(this.readUint32());
			case ETF_TAGS.map:
				return this.readMap();
			default:
				throw new AddressApiError('invalid-response', `Wallet list uses unsupported Erlang term tag ${tag}`);
		}
	}

	private readList() {
		const values = this.readTerms(this.readUint32());
		const tail = this.readTerm();

		if (!Array.isArray(tail) || tail.length !== 0) {
			throw new AddressApiError('invalid-response', 'Wallet list contains an improper Erlang list');
		}

		return values;
	}

	private readMap() {
		const result: Record<string, unknown> = {};
		const size = this.readUint32();

		for (let index = 0; index < size; index += 1) {
			const key = this.readTerm();
			if (typeof key !== 'string') {
				throw new AddressApiError('invalid-response', 'Wallet list map contains a non-string key');
			}

			result[key] = this.readTerm();
		}

		return result;
	}

	private readTerms(size: number) {
		const result: unknown[] = [];

		for (let index = 0; index < size; index += 1) {
			result.push(this.readTerm());
		}

		return result;
	}

	private readBigInteger(size: number) {
		const sign = this.readByte();
		if (sign !== 0 && sign !== 1) {
			throw new AddressApiError('invalid-response', 'Wallet list contains an invalid integer sign');
		}

		const digits = this.readBytes(size);
		let value = BigInt(0);

		for (let index = digits.length - 1; index >= 0; index -= 1) {
			value = value * BigInt(256) + BigInt(digits[index]);
		}

		return sign === 1 ? -value : value;
	}

	private readText(size: number) {
		return TEXT_DECODER.decode(this.readBytes(size));
	}

	private readByte() {
		if (this.offset >= this.bytes.length) {
			throw new AddressApiError('invalid-response', 'Wallet list response ended unexpectedly');
		}

		const value = this.bytes[this.offset];
		this.offset += 1;
		return value;
	}

	private readBytes(size: number) {
		const end = this.offset + size;
		if (!Number.isSafeInteger(size) || size < 0 || end > this.bytes.length) {
			throw new AddressApiError('invalid-response', 'Wallet list response ended unexpectedly');
		}

		const value = this.bytes.slice(this.offset, end);
		this.offset = end;
		return value;
	}

	private readUint16() {
		const bytes = this.readBytes(2);
		return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(0);
	}

	private readUint32() {
		const bytes = this.readBytes(4);
		return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0);
	}

	private readInt32() {
		const bytes = this.readBytes(4);
		return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getInt32(0);
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Uint8Array);
}

function bytesToBase64Url(bytes: Uint8Array) {
	let binary = '';

	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function normalizeBalance(address: unknown, balance: unknown, lastTransaction: unknown): ArAddressBalance | null {
	if (address === '') return null;
	if (typeof address !== 'string' || !ARWEAVE_ADDRESS_PATTERN.test(address)) {
		throw new AddressApiError('invalid-response', 'Wallet list contains an invalid address');
	}
	if (typeof balance !== 'string' || !DECIMAL_INTEGER_PATTERN.test(balance)) {
		throw new AddressApiError('invalid-response', 'Wallet list contains an invalid balance');
	}

	const normalizedBalance = BigInt(balance).toString();
	if (normalizedBalance === '0') return null;
	if (
		lastTransaction !== '' &&
		(typeof lastTransaction !== 'string' || !ARWEAVE_ADDRESS_PATTERN.test(lastTransaction))
	) {
		throw new AddressApiError('invalid-response', 'Wallet list contains an invalid last transaction');
	}

	return {
		address: address,
		balance: normalizedBalance,
		lastTransaction: lastTransaction === '' ? null : lastTransaction,
	};
}

function parseJsonWalletChunk(bytes: Uint8Array): AddressChunk {
	let parsed: unknown;

	try {
		parsed = JSON.parse(TEXT_DECODER.decode(bytes));
	} catch {
		throw new AddressApiError('invalid-response', 'Wallet list returned invalid JSON');
	}

	if (!isRecord(parsed) || !Array.isArray(parsed.wallets)) {
		throw new AddressApiError('invalid-response', 'Wallet list JSON has an invalid shape');
	}

	const addresses = parsed.wallets
		.map((wallet) => {
			if (!isRecord(wallet)) {
				throw new AddressApiError('invalid-response', 'Wallet list JSON contains an invalid entry');
			}

			return normalizeBalance(wallet.address, wallet.balance, wallet.last_tx);
		})
		.filter((wallet): wallet is ArAddressBalance => wallet !== null);

	const nextCursor = parsed.next_cursor;
	if (nextCursor !== undefined && (typeof nextCursor !== 'string' || !ARWEAVE_ADDRESS_PATTERN.test(nextCursor))) {
		throw new AddressApiError('invalid-response', 'Wallet list JSON contains an invalid cursor');
	}

	return {
		addresses: addresses,
		nextCursor: typeof nextCursor === 'string' ? nextCursor : null,
	};
}

function parseEtfWalletChunk(bytes: Uint8Array): AddressChunk {
	const parsed = new ErlangTermReader(bytes).read();

	if (!isRecord(parsed) || !Array.isArray(parsed.wallets)) {
		throw new AddressApiError('invalid-response', 'Wallet list Erlang term has an invalid shape');
	}

	const addresses = parsed.wallets
		.map((wallet) => {
			if (!Array.isArray(wallet) || !(wallet[0] instanceof Uint8Array) || !Array.isArray(wallet[1])) {
				throw new AddressApiError('invalid-response', 'Wallet list Erlang term contains an invalid entry');
			}

			const rawAddress = wallet[0];
			// Wallet-list trees can contain internal ledger keys that are not AR addresses.
			if (rawAddress.length !== ARWEAVE_ADDRESS_BYTE_LENGTH) return null;

			const balance = wallet[1][0];
			if (typeof balance !== 'bigint' || balance < BigInt(0)) {
				throw new AddressApiError('invalid-response', 'Wallet list Erlang term contains an invalid balance');
			}

			const rawLastTransaction = wallet[1][1];
			if (!(rawLastTransaction instanceof Uint8Array)) {
				throw new AddressApiError('invalid-response', 'Wallet list Erlang term contains an invalid last transaction');
			}
			if (rawLastTransaction.length !== 0 && rawLastTransaction.length !== ARWEAVE_ADDRESS_BYTE_LENGTH) {
				throw new AddressApiError('invalid-response', 'Wallet list Erlang term contains an invalid last transaction');
			}

			return normalizeBalance(
				bytesToBase64Url(rawAddress),
				balance.toString(),
				rawLastTransaction.length === 0 ? '' : bytesToBase64Url(rawLastTransaction)
			);
		})
		.filter((wallet): wallet is ArAddressBalance => wallet !== null);

	const rawCursor = parsed.next_cursor;
	let nextCursor: string | null;

	if (rawCursor === 'last') {
		nextCursor = null;
	} else if (rawCursor instanceof Uint8Array) {
		nextCursor = bytesToBase64Url(rawCursor);
		if (!ARWEAVE_ADDRESS_PATTERN.test(nextCursor)) {
			throw new AddressApiError('invalid-response', 'Wallet list Erlang term contains an invalid cursor');
		}
	} else {
		throw new AddressApiError('invalid-response', 'Wallet list Erlang term contains an invalid cursor');
	}

	return {
		addresses: addresses,
		nextCursor: nextCursor,
	};
}

export function decodeWalletListChunk(buffer: ArrayBuffer): AddressChunk {
	const bytes = new Uint8Array(buffer);
	const firstContentByte = bytes.find((byte) => ![9, 10, 13, 32].includes(byte));

	if (firstContentByte === 123 || firstContentByte === 91) {
		return parseJsonWalletChunk(bytes);
	}

	return parseEtfWalletChunk(bytes);
}

function getEndpoint(gateway?: string) {
	return (gateway ?? DEFAULT_ARWEAVE_ENDPOINT).replace(/\/$/, '').replace(/\/graphql$/, '');
}

async function requestJson(endpoint: string, signal?: AbortSignal) {
	let response: Response;

	try {
		response = await fetch(endpoint, { signal: signal });
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') throw error;
		throw new AddressApiError('unavailable', 'Unable to reach the Arweave gateway');
	}

	if (!response.ok) {
		throw new AddressApiError('unavailable', `Arweave request failed with status ${response.status}`);
	}

	try {
		return (await response.json()) as unknown;
	} catch {
		throw new AddressApiError('invalid-response', 'Arweave gateway returned invalid JSON');
	}
}

export async function getAddressChunk(args: {
	walletListRoot: string;
	cursor?: string | null;
	gateway?: string;
	signal?: AbortSignal;
}): Promise<AddressChunk> {
	if (!WALLET_LIST_ROOT_PATTERN.test(args.walletListRoot)) {
		throw new AddressApiError('invalid-response', 'Wallet list root is invalid');
	}
	if (args.cursor && !ARWEAVE_ADDRESS_PATTERN.test(args.cursor)) {
		throw new AddressApiError('invalid-response', 'Wallet list cursor is invalid');
	}

	const endpoint = getEndpoint(args.gateway);
	const path = [endpoint, 'wallet_list', encodeURIComponent(args.walletListRoot), args.cursor]
		.filter((part): part is string => !!part)
		.join('/');

	let response: Response;

	try {
		response = await fetch(path, {
			headers: {
				'Content-Type': 'application/json',
			},
			signal: args.signal,
		});
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') throw error;
		throw new AddressApiError('unavailable', 'Unable to fetch the Arweave wallet list');
	}

	if (!response.ok) {
		throw new AddressApiError('unavailable', `Wallet list request failed with status ${response.status}`);
	}

	try {
		return decodeWalletListChunk(await response.arrayBuffer());
	} catch (error) {
		if (error instanceof AddressApiError) throw error;
		throw new AddressApiError('invalid-response', 'Unable to decode the Arweave wallet list');
	}
}

export async function getLatestAddressSnapshot(
	args: {
		gateway?: string;
		signal?: AbortSignal;
	} = {}
): Promise<AddressSnapshot> {
	const endpoint = getEndpoint(args.gateway);
	const networkInfo = await requestJson(`${endpoint}/info`, args.signal);

	if (!isRecord(networkInfo) || !Number.isInteger(networkInfo.height) || Number(networkInfo.height) < 0) {
		throw new AddressApiError('invalid-response', 'Arweave network info does not include a valid height');
	}

	const blockHeight = Number(networkInfo.height);
	const block = await requestJson(`${endpoint}/block/height/${blockHeight}`, args.signal);

	if (!isRecord(block) || typeof block.wallet_list !== 'string' || !WALLET_LIST_ROOT_PATTERN.test(block.wallet_list)) {
		throw new AddressApiError('invalid-response', 'Arweave block does not include a valid wallet list root');
	}

	let chunk = await getAddressChunk({
		walletListRoot: block.wallet_list,
		gateway: endpoint,
		signal: args.signal,
	});
	const seenCursors = new Set<string>();

	while (chunk.addresses.length === 0 && chunk.nextCursor) {
		if (seenCursors.has(chunk.nextCursor)) {
			throw new AddressApiError('invalid-response', 'Wallet list returned a repeated cursor');
		}

		seenCursors.add(chunk.nextCursor);
		chunk = await getAddressChunk({
			walletListRoot: block.wallet_list,
			cursor: chunk.nextCursor,
			gateway: endpoint,
			signal: args.signal,
		});
	}

	return {
		...chunk,
		blockHeight: blockHeight,
		walletListRoot: block.wallet_list,
	};
}
