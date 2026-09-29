import { requestRemote } from 'api/http';

import type { PriceSourceShape } from './quotes';
import { isRecord, normalizeChange, normalizePrice, parseQuote } from './quotes';
import type { PriceSymbol, TokenPriceQuote } from './types';

type PriceSource = {
	shape: PriceSourceShape;
	url: string;
};

type PriceCache = {
	version: 2;
	quote: TokenPriceQuote;
	updatedAt: number;
};

const PRICE_CACHE_PREFIX = 'lunar-token-price-usd-v2';
const PRICE_CACHE_TTL = 5 * 60 * 1000;
const PRICE_REQUEST_TIMEOUT = 8000;
const PRICE_SOURCES: Record<PriceSymbol, PriceSource[]> = {
	AO: [
		{
			shape: 'coingecko-market-chart',
			url: 'https://api.coingecko.com/api/v3/coins/ao-computer/market_chart?vs_currency=usd&days={{days}}',
		},
		{
			shape: 'coinpaprika-historical',
			url: 'https://api.coinpaprika.com/v1/tickers/ao-ao-computer/historical?start={{start}}&end={{end}}&interval=1d&quote=usd',
		},
		{
			shape: 'gateio-spot-ticker',
			url: 'https://api.gateio.ws/api/v4/spot/tickers?currency_pair=AO_USDT',
		},
	],
	AR: [
		{
			shape: 'coingecko-market-chart',
			url: 'https://api.coingecko.com/api/v3/coins/arweave/market_chart?vs_currency=usd&days={{days}}',
		},
		{
			shape: 'coinpaprika-historical',
			url: 'https://api.coinpaprika.com/v1/tickers/ar-arweave/historical?start={{start}}&end={{end}}&interval=1d&quote=usd',
		},
		{
			shape: 'binance-ticker-price',
			url: 'https://api.binance.com/api/v3/ticker/price?symbol=ARUSDT',
		},
	],
};

const priceCaches: Partial<Record<PriceSymbol, PriceCache>> = {};
const priceRequests: Partial<Record<PriceSymbol, Promise<TokenPriceQuote | null>>> = {};

function getPriceCacheKey(symbol: PriceSymbol) {
	return `${PRICE_CACHE_PREFIX}-${symbol.toLowerCase()}`;
}

function getPriceStorage(): Storage | null {
	try {
		return typeof window !== 'undefined' ? window.localStorage : null;
	} catch {
		return null;
	}
}

function readPriceCache(symbol: PriceSymbol, maxAge = PRICE_CACHE_TTL): TokenPriceQuote | null {
	const now = Date.now();
	const memoryCache = priceCaches[symbol];

	if (memoryCache && now >= memoryCache.updatedAt && now - memoryCache.updatedAt <= maxAge) {
		return memoryCache.quote;
	}

	let storedCache: string | null | undefined;
	try {
		storedCache = getPriceStorage()?.getItem(getPriceCacheKey(symbol));
	} catch {
		return null;
	}

	if (!storedCache) {
		return null;
	}

	try {
		const parsedCache: unknown = JSON.parse(storedCache);
		if (!isRecord(parsedCache) || parsedCache.version !== 2 || !isRecord(parsedCache.quote)) return null;
		const cachedPrice = normalizePrice(parsedCache.quote.price);
		const updatedAt = parsedCache.updatedAt;

		if (
			cachedPrice === null ||
			typeof updatedAt !== 'number' ||
			!Number.isFinite(updatedAt) ||
			updatedAt < 0 ||
			updatedAt > now
		) {
			return null;
		}

		const quote = { price: cachedPrice, change24hPercent: normalizeChange(parsedCache.quote.change24hPercent) };
		priceCaches[symbol] = { version: 2, quote, updatedAt };
		return now - updatedAt <= maxAge ? quote : null;
	} catch {
		return null;
	}
}

function writePriceCache(symbol: PriceSymbol, quote: TokenPriceQuote) {
	const cache: PriceCache = { version: 2, quote, updatedAt: Date.now() };
	priceCaches[symbol] = cache;

	try {
		getPriceStorage()?.setItem(getPriceCacheKey(symbol), JSON.stringify(cache));
	} catch {
		// In-memory cache still prevents duplicate requests during this page session.
	}
}

function formatPriceDate(date: Date) {
	return date.toISOString().split('T')[0];
}

function getPriceUrl(source: PriceSource) {
	const endDate = new Date();
	const startDate = new Date(endDate.getTime() - 2 * 24 * 60 * 60 * 1000);

	return source.url
		.replace('{{days}}', '1')
		.replace('{{start}}', formatPriceDate(startDate))
		.replace('{{end}}', formatPriceDate(endDate));
}

async function fetchPriceFromSource(symbol: PriceSymbol, source: PriceSource): Promise<TokenPriceQuote | null> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), PRICE_REQUEST_TIMEOUT);
	try {
		const response = await requestRemote(getPriceUrl(source), { signal: controller.signal });

		if (!response.ok) {
			console.error(`error fetching ${symbol} price from ${source.shape}: HTTP ${response.status}`);
			return null;
		}

		const data = await response.json();
		const price = parseQuote(source.shape, data);

		if (price === null) {
			console.error(`invalid ${symbol} price response from ${source.shape}`);
		}

		return price;
	} catch (error) {
		console.error(`error fetching ${symbol} price from ${source.shape}:`, error);
		return null;
	} finally {
		clearTimeout(timeout);
	}
}

async function fetchPriceFromSources(symbol: PriceSymbol): Promise<TokenPriceQuote | null> {
	const sources = PRICE_SOURCES[symbol];

	for (let i = 0; i < sources.length; i++) {
		const price = await fetchPriceFromSource(symbol, sources[i]);

		if (price !== null) {
			writePriceCache(symbol, price);
			return price;
		}
	}

	return null;
}

export async function getTokenPriceQuote(symbol: PriceSymbol): Promise<TokenPriceQuote | null> {
	const cachedPrice = readPriceCache(symbol);
	if (cachedPrice !== null) {
		return cachedPrice;
	}

	if (!priceRequests[symbol]) {
		priceRequests[symbol] = (async () => {
			try {
				return await fetchPriceFromSources(symbol);
			} finally {
				priceRequests[symbol] = undefined;
			}
		})();
	}

	const price = await priceRequests[symbol];
	if (price) return price;
	const stale = readPriceCache(symbol, Number.POSITIVE_INFINITY);
	return stale ? { ...stale, change24hPercent: null } : null;
}

export async function getAoPrice(): Promise<number | null> {
	return (await getTokenPriceQuote('AO'))?.price ?? null;
}

export async function getArPrice(): Promise<number | null> {
	return (await getTokenPriceQuote('AR'))?.price ?? null;
}
