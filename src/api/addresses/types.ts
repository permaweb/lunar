export type ArAddressBalance = {
	address: string;
	balance: string;
	lastTransaction: string | null;
};

export type AddressChunk = {
	addresses: ArAddressBalance[];
	nextCursor: string | null;
};

export type AddressSnapshot = AddressChunk & {
	blockHeight: number;
	walletListRoot: string;
};

export type AddressApiErrorCode = 'invalid-response' | 'unavailable';

export class AddressApiError extends Error {
	readonly code: AddressApiErrorCode;

	constructor(code: AddressApiErrorCode, message: string) {
		super(message);
		this.name = 'AddressApiError';
		this.code = code;
	}
}
