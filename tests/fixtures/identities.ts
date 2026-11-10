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

// Public chain metadata read from arweave.net transaction headers and GraphQL on 2026-11-08.
export const HB_IDENTITY_WITNESSES = {
	process: {
		id: 'yRzMTypGwjnefwJy8xk5UIeVNiak_dlqRAdn-nO8W4I',
		address: '1tPHie2bHfkDD7jimuxLr2zCAAyqRTpmDCIqvmtJkqc',
		committer: 'uri-did-ar-1tphie2bhfkdd7jimuxlr2zcaayqrtpmdciqvmtjkqc4qgbcqv5s',
	},
	trustedNotice: {
		id: 'GJVHZGxRgCH_m4hwvICtRajEjxG9Sgrl43vjlD4Ishk',
		address: '6qOD-VYFZBKwYtrOm1Keh2ETif7SDUPAPx-UEu4qlR4',
		committer: 'uri-did-ar-6qod-vyfzbkwytrom1keh2etif7sdupapx-ueu4qlr45g48rzvo0',
		blockHeight: 2030780,
		fromProcess: '0syT13r0s0tgPmIed95bJnuSqaD29HQNN8D3ElLSrsc',
		processAuthority: 'fcoN_xJeisVsPXA-trzVAuIiqO3ydLQxM-L4XbrQKzY',
		processCommitter: 'uri-did-ar-gezphdovgxzlypbzglgradghbvazaidotlzkviaqiyg3db2p5r68',
	},
	ethereum: {
		id: 'XT-s5PhcwF8RqZtS8SSDgkX3XxHI5SvmbFfLWLE8Jag',
		address: '0x9340d6860A301b869Bb7a7d4664Ed757294267A1',
		committer: 'uri-did-pkh-eip155-1-0x9340d6860a301b869bb7a7d4664ed757294267a1',
	},
	solana: {
		id: 'hXKqH_9rkYZ7LwvVps81uKNZd_i36WZjlp4Wnc5BkiE',
		address: 'GGuACHp2FbtB4wwT5TmPCU6W5FGa3wB1vqno4gsKsxHz',
		committer: 'uri-did-pkh-solana-gguachp2fbtb4wwt5tmpcu6w5fga3wb1vqno4gsksxhz5df64lvrm',
	},
} as const;
