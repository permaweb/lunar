import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { PROCESSES } from '../../src/helpers/config';
import {
	formatTokenQuantity,
	getKnownTokenMetadata,
	getTokenMetadataFromResponse,
	getTokenTransfer,
	mergeTokenMetadata,
} from '../../src/helpers/tokens';

const TOKEN = 'suz9pH8HYQbmzhhU-UaudmHf2_9l4qiyStyrYWxNcMc';
const SENDER = 'wCSXTL1g1Entfpv5iyPNHxJlk9N6MfhYve2reKFJWTg';
const RECIPIENT = 'n6QjVXFWUMHUIgNL6E7tEAHGGbKc2jFwW4bU-LYNbDU';

function randomCase(value: string) {
	return fc
		.array(fc.boolean(), { minLength: value.length, maxLength: value.length })
		.map((upper) => [...value].map((char, i) => (upper[i] ? char.toUpperCase() : char.toLowerCase())).join(''));
}

describe('getTokenTransfer', () => {
	it('reads a HyperBEAM L1 transfer with lowercase tags', () => {
		expect(
			getTokenTransfer({
				recipient: TOKEN,
				owner: { address: SENDER },
				tags: [
					{ name: 'action', value: 'transfer' },
					{ name: 'recipient', value: RECIPIENT },
					{ name: 'quantity', value: '1000000000000' },
				],
			})
		).toEqual({ token: TOKEN, from: SENDER, recipient: RECIPIENT, quantity: '1000000000000' });
	});

	it('uses the Target tag and From-Process of an AO message', () => {
		const fromProcess = 'p'.repeat(43);

		expect(
			getTokenTransfer({
				owner: { address: SENDER },
				tags: [
					{ name: 'Action', value: 'Transfer' },
					{ name: 'Target', value: TOKEN },
					{ name: 'From-Process', value: fromProcess },
					{ name: 'Recipient', value: RECIPIENT },
					{ name: 'Quantity', value: '5' },
				],
			})
		).toEqual({ token: TOKEN, from: fromProcess, recipient: RECIPIENT, quantity: '5' });
	});

	it.each([
		['a different action', [{ name: 'Action', value: 'Transfer-Error' }]],
		[
			'no recipient tag',
			[
				{ name: 'Action', value: 'Transfer' },
				{ name: 'Quantity', value: '1' },
			],
		],
		[
			'no quantity tag',
			[
				{ name: 'Action', value: 'Transfer' },
				{ name: 'Recipient', value: RECIPIENT },
			],
		],
	])('rejects %s', (_label, tags) => {
		expect(getTokenTransfer({ recipient: TOKEN, tags: tags })).toBeNull();
	});

	it('rejects a transfer without a token process', () => {
		expect(
			getTokenTransfer({
				tags: [
					{ name: 'Action', value: 'Transfer' },
					{ name: 'Recipient', value: RECIPIENT },
					{ name: 'Quantity', value: '1' },
				],
			})
		).toBeNull();
		expect(getTokenTransfer(null)).toBeNull();
	});

	it('ignores the case of tag names and the action value', () => {
		fc.assert(
			fc.property(
				randomCase('Action'),
				randomCase('Transfer'),
				randomCase('Recipient'),
				randomCase('Quantity'),
				(action, transfer, recipient, quantity) => {
					const tags = [
						{ name: action, value: transfer },
						{ name: recipient, value: RECIPIENT },
						{ name: quantity, value: '42' },
					];

					expect(getTokenTransfer({ recipient: TOKEN, tags: tags })?.quantity).toBe('42');
				}
			)
		);
	});
});

describe('token metadata', () => {
	it('reads lowercase process tags written by HyperBEAM', () => {
		const response = {
			node: {
				tags: [
					{ name: 'denomination', value: '12' },
					{ name: 'ticker', value: 'tAO' },
				],
			},
		};

		expect(getTokenMetadataFromResponse(response)).toEqual({ denomination: 12, ticker: 'tAO', logo: null });
	});

	it('prefers Info response fields over tags', () => {
		const response = {
			Denomination: '6',
			Ticker: 'TKN',
			Logo: 'l'.repeat(43),
			node: { tags: [{ name: 'Denomination', value: '12' }] },
		};

		expect(getTokenMetadataFromResponse(response)).toEqual({ denomination: 6, ticker: 'TKN', logo: 'l'.repeat(43) });
	});

	it('returns null without a usable denomination or ticker', () => {
		expect(getTokenMetadataFromResponse(null)).toBeNull();
		expect(getTokenMetadataFromResponse({ node: { tags: [{ name: 'Denomination', value: 'abc' }] } })).toBeNull();
	});

	it('merges later metadata over known token defaults', () => {
		expect(mergeTokenMetadata(getKnownTokenMetadata(PROCESSES.ao), { denomination: null, ticker: 'wAO' })).toEqual({
			denomination: 12,
			ticker: 'wAO',
			logo: null,
		});
		expect(mergeTokenMetadata(null, null)).toBeNull();
	});

	it('formats atomic quantities only when the denomination is known', () => {
		expect(formatTokenQuantity('1000000000000', { denomination: 12 })).toBe('1');
		expect(formatTokenQuantity('1000000000000', { denomination: null })).toBe('1000000000000');
		expect(formatTokenQuantity('1000000000000', null)).toBe('1000000000000');
	});
});
