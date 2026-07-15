type PriceSymbol = 'AO' | 'AR';

type PriceSourceShape =
	| 'coingecko-market-chart'
	| 'coinpaprika-historical'
	| 'gateio-spot-ticker'
	| 'binance-ticker-price';

type PriceSource = {
	shape: PriceSourceShape;
	url: string;
};

type PriceCache = {
	price: number;
	updatedAt: number;
};

const PRICE_CACHE_PREFIX = 'lunar-token-price-usd';
const PRICE_CACHE_TTL = 5 * 60 * 1000;
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
const priceRequests: Partial<Record<PriceSymbol, Promise<number | null>>> = {};

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

function normalizePrice(value: unknown): number | null {
	const price = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
	return Number.isFinite(price) && price > 0 ? price : null;
}

function readPriceCache(symbol: PriceSymbol, maxAge = PRICE_CACHE_TTL): number | null {
	const now = Date.now();
	const memoryCache = priceCaches[symbol];

	if (memoryCache && now - memoryCache.updatedAt <= maxAge) {
		return memoryCache.price;
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
		const parsedCache = JSON.parse(storedCache) as PriceCache;
		const cachedPrice = normalizePrice(parsedCache?.price);
		const updatedAt = Number(parsedCache?.updatedAt);

		if (cachedPrice === null || !Number.isFinite(updatedAt)) {
			return null;
		}

		priceCaches[symbol] = { price: cachedPrice, updatedAt };
		return now - updatedAt <= maxAge ? cachedPrice : null;
	} catch {
		return null;
	}
}

function writePriceCache(symbol: PriceSymbol, price: number) {
	const cache = { price, updatedAt: Date.now() };
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

function getTickerByPair(tickers: any[], pair: string) {
	for (let i = 0; i < tickers.length; i++) {
		if (tickers[i]?.currency_pair === pair || tickers[i]?.symbol === pair) {
			return tickers[i];
		}
	}

	return tickers[0];
}

function parsePrice(source: PriceSource, data: any): number | null {
	switch (source.shape) {
		case 'coingecko-market-chart': {
			const pricePoints = Array.isArray(data?.prices) ? data.prices : [];
			for (let i = pricePoints.length - 1; i >= 0; i--) {
				const pricePoint = pricePoints[i];
				if (Array.isArray(pricePoint)) {
					return normalizePrice(pricePoint[1]);
				}
			}
			return null;
		}
		case 'coinpaprika-historical': {
			const pricePoints = Array.isArray(data) ? data : [];
			for (let i = pricePoints.length - 1; i >= 0; i--) {
				if (pricePoints[i]?.price !== undefined) {
					return normalizePrice(pricePoints[i].price);
				}
			}
			return null;
		}
		case 'gateio-spot-ticker': {
			const ticker = Array.isArray(data) ? getTickerByPair(data, 'AO_USDT') : data;
			return normalizePrice(ticker?.last);
		}
		case 'binance-ticker-price': {
			return normalizePrice(data?.price);
		}
		default:
			return null;
	}
}

async function fetchPriceFromSource(symbol: PriceSymbol, source: PriceSource): Promise<number | null> {
	try {
		const response = await fetch(getPriceUrl(source));

		if (!response.ok) {
			console.error(`error fetching ${symbol} price from ${source.shape}: HTTP ${response.status}`);
			return null;
		}

		const data = await response.json();
		const price = parsePrice(source, data);

		if (price === null) {
			console.error(`invalid ${symbol} price response from ${source.shape}:`, data);
		}

		return price;
	} catch (error) {
		console.error(`error fetching ${symbol} price from ${source.shape}:`, error);
		return null;
	}
}

async function fetchPriceFromSources(symbol: PriceSymbol): Promise<number | null> {
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

async function getTokenPrice(symbol: PriceSymbol): Promise<number | null> {
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
	return price ?? readPriceCache(symbol, Number.POSITIVE_INFINITY);
}

export async function getAoPrice(): Promise<number | null> {
	return getTokenPrice('AO');
}

export async function getArPrice(): Promise<number | null> {
	return getTokenPrice('AR');
}
