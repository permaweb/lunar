// secp256k1 generator: the public key for scalar 1, a public test vector.
export const ETHEREUM_KEY_HEX =
	'0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8';
export const ETHEREUM_KEY = Buffer.from(ETHEREUM_KEY_HEX, 'hex').toString('base64url');
export const ETHEREUM_ADDRESS = '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf';
export const ETHEREUM_DID = `did:pkh:eip155:1:${ETHEREUM_ADDRESS}`;
export const ARWEAVE_ADDRESS = 'kY9RAgTJEImkBpiKgVeXrsGV02T-D4dI3ZvSpnn7HSk';
export const ARWEAVE_HOST = 'uri-did-ar-ky9ragtjeimkbpikgvexrsgv02t-d4di3zvspnn7hsk8xyj2kegg';
export const SOLANA_KEY = 'X5BVS7PYwvyCtu5ZxJqqFD5399Sag-lWzh2-8XpD-AU';
export const SOLANA_ADDRESS = '7S3P4HxJpyyigGzodYwHtCxZyUQe9JiBMHyRWXArAaKv';
export const SOLANA_DID = `did:pkh:solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:${SOLANA_ADDRESS}`;
