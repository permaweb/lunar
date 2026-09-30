import { describe, expect, it } from 'vitest';

import { parseQuote } from '../../../src/api/prices/quotes';

const NOW = Date.parse('2026-09-29T12:00:00Z');
const DAY = 86400000;

describe('token price quote normalization', () => {
	it.each([
		[110, 10],
		[90, -10],
		[100, 0],
	])('calculates the 24-hour movement at %s', (price, change) => {
		expect(
			parseQuote('coingecko-market-chart', {
				prices: [
					[NOW, price],
					[NOW - DAY, 100],
				],
			})
		).toEqual({
			price,
			change24hPercent: change,
		});
	});
	it('chooses the closest 24-hour baseline and ignores invalid price samples', () => {
		expect(
			parseQuote('coingecko-market-chart', {
				prices: [
					[NOW - DAY - 600000, 80],
					[NOW - DAY, 100],
					[NOW, 110],
					[NOW + 1, 'bad'],
				],
			})
		).toEqual({ price: 110, change24hPercent: 10 });
	});
	it.each([
		[[NOW, 100]],
		[
			[NOW - 3600000, 90],
			[NOW, 100],
		],
		[
			[NOW - DAY, 0],
			[NOW, 100],
		],
	])('keeps a price without inventing a movement when a daily baseline is unavailable', (...prices) => {
		expect(parseQuote('coingecko-market-chart', { prices })).toEqual({ price: 100, change24hPercent: null });
	});
	it('compares timestamped daily CoinPaprika samples from the same response', () => {
		expect(
			parseQuote('coinpaprika-historical', [
				{ timestamp: '2026-09-28T00:00:00Z', price: 4 },
				{ timestamp: '2026-09-29T00:00:00Z', price: 5 },
			])
		).toEqual({ price: 5, change24hPercent: 25 });
	});
	it('reads Gate’s supplied daily percentage, including zero, and checks the pair', () => {
		expect(
			parseQuote('gateio-spot-ticker', [{ currency_pair: 'AO_USDT', last: '4.5', change_percentage: '0' }])
		).toEqual({ price: 4.5, change24hPercent: 0 });
		expect(parseQuote('gateio-spot-ticker', [{ currency_pair: 'BTC_USDT', last: '4.5' }])).toBeNull();
	});
	it.each([null, '', 'invalid', Infinity, -101])('does not turn an invalid percentage into zero: %s', (change) => {
		expect(
			parseQuote('gateio-spot-ticker', { currency_pair: 'AO_USDT', last: '4.5', change_percentage: change })
		).toEqual({ price: 4.5, change24hPercent: null });
	});
	it('allows Binance’s price-only fallback without a percentage', () => {
		expect(parseQuote('binance-ticker-price', { symbol: 'ARUSDT', price: '4.21' })).toEqual({
			price: 4.21,
			change24hPercent: null,
		});
		expect(parseQuote('binance-ticker-price', { symbol: 'BTCUSDT', price: '4.21' })).toBeNull();
	});
});
