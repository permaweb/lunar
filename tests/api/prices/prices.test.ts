// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('api/http', () => ({ requestRemote: mocks.request }));
const NOW = Date.parse('2026-09-29T12:00:00Z');
const chart = {
	prices: [
		[NOW - 86400000, 4],
		[NOW, 5],
	],
};
const response = (body: unknown) => new Response(JSON.stringify(body));

beforeEach(() => {
	vi.resetModules();
	vi.useFakeTimers();
	vi.setSystemTime(NOW);
	localStorage.clear();
	mocks.request.mockReset().mockImplementation(async () => response(chart));
	vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

it('shares one request between quote and numeric consumers and restores both fields from storage', async () => {
	const prices = await import('../../../src/api/prices');
	const [quote, numeric] = await Promise.all([prices.getTokenPriceQuote('AR'), prices.getArPrice()]);
	expect(quote).toEqual({ price: 5, change24hPercent: 25 });
	expect(numeric).toBe(5);
	expect(mocks.request).toHaveBeenCalledOnce();
	vi.resetModules();
	const reloaded = await import('../../../src/api/prices');
	expect(await reloaded.getTokenPriceQuote('AR')).toEqual(quote);
	expect(mocks.request).toHaveBeenCalledOnce();
});

it('retains an expired cached price but hides its movement when all sources fail', async () => {
	const prices = await import('../../../src/api/prices');
	await prices.getTokenPriceQuote('AR');
	vi.setSystemTime(NOW + 300001);
	mocks.request.mockRejectedValue(new Error('offline'));
	expect(await prices.getTokenPriceQuote('AR')).toEqual({ price: 5, change24hPercent: null });
	expect(mocks.request).toHaveBeenCalledTimes(4);
});

it('times out an unresponsive source, uses the next source, and clears request timers', async () => {
	mocks.request
		.mockImplementationOnce(
			(_url, options) =>
				new Promise((_resolve, reject) => {
					options.signal.addEventListener('abort', () => reject(new Error('aborted')));
				})
		)
		.mockResolvedValueOnce(
			response([
				{ timestamp: '2026-09-28T00:00:00Z', price: 4 },
				{ timestamp: '2026-09-29T00:00:00Z', price: 5 },
			])
		);
	const prices = await import('../../../src/api/prices');
	const quote = prices.getTokenPriceQuote('AR');
	await vi.advanceTimersByTimeAsync(8000);
	expect(await quote).toEqual({ price: 5, change24hPercent: 25 });
	expect(mocks.request).toHaveBeenCalledTimes(2);
	expect(mocks.request.mock.calls[0][1].signal.aborted).toBe(true);
	await vi.advanceTimersByTimeAsync(8000);
	expect(mocks.request.mock.calls[1][1].signal.aborted).toBe(false);
});

it('falls back to Gate with its own price and movement together', async () => {
	mocks.request
		.mockRejectedValueOnce(new Error('offline'))
		.mockResolvedValueOnce(response([]))
		.mockResolvedValueOnce(response([{ currency_pair: 'AO_USDT', last: '4.5', change_percentage: '-2.5' }]));
	const prices = await import('../../../src/api/prices');
	expect(await prices.getTokenPriceQuote('AO')).toEqual({ price: 4.5, change24hPercent: -2.5 });
});

it.each(['{', JSON.stringify({ version: 2, updatedAt: NOW + 1000, quote: { price: 3, change24hPercent: 9 } })])(
	'ignores malformed or future-dated cached quotes',
	async (stored) => {
		localStorage.setItem('lunar-token-price-usd-v2-ar', stored);
		const prices = await import('../../../src/api/prices');
		expect(await prices.getTokenPriceQuote('AR')).toEqual({ price: 5, change24hPercent: 25 });
		expect(mocks.request).toHaveBeenCalledOnce();
	}
);
