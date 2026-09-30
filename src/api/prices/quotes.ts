import type { TokenPriceQuote } from './types';

export type PriceSourceShape =
	| 'coingecko-market-chart'
	| 'coinpaprika-historical'
	| 'gateio-spot-ticker'
	| 'binance-ticker-price';

const DAY_MS = 24 * 60 * 60 * 1000;
// CoinGecko's one-day chart uses five-minute samples, which may not land exactly 24 hours apart.
const BASELINE_TOLERANCE_MS = 15 * 60 * 1000;

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown): number | null {
	if (typeof value !== 'number' && (typeof value !== 'string' || value.trim() === '')) return null;
	const number = Number(value);
	return Number.isFinite(number) ? number : null;
}

export function normalizePrice(value: unknown): number | null {
	const price = finiteNumber(value);
	return price !== null && price > 0 ? price : null;
}

export function normalizeChange(value: unknown): number | null {
	const change = finiteNumber(value);
	return change !== null && change >= -100 ? change : null;
}

type PricePoint = { price: number; timestamp: number };

function historicalQuote(points: PricePoint[]): TokenPriceQuote | null {
	const sorted = points.sort((left, right) => left.timestamp - right.timestamp);
	const latest = sorted[sorted.length - 1];
	if (!latest) return null;
	const target = latest.timestamp - DAY_MS;
	const baseline = sorted.reduce<PricePoint | null>((nearest, point) => {
		const distance = Math.abs(point.timestamp - target);
		if (distance > BASELINE_TOLERANCE_MS || (nearest && distance >= Math.abs(nearest.timestamp - target))) {
			return nearest;
		}
		return point;
	}, null);
	return {
		price: latest.price,
		change24hPercent: baseline ? normalizeChange(((latest.price - baseline.price) / baseline.price) * 100) : null,
	};
}

export function parseQuote(shape: PriceSourceShape, data: unknown): TokenPriceQuote | null {
	if (shape === 'coingecko-market-chart' || shape === 'coinpaprika-historical') {
		const rawPoints = shape === 'coingecko-market-chart' && isRecord(data) ? data.prices : data;
		if (!Array.isArray(rawPoints)) return null;
		const points: PricePoint[] = [];
		for (const point of rawPoints) {
			const price = normalizePrice(Array.isArray(point) ? point[1] : isRecord(point) ? point.price : null);
			const timestamp = Array.isArray(point)
				? finiteNumber(point[0])
				: isRecord(point) && typeof point.timestamp === 'string'
				? Date.parse(point.timestamp)
				: null;
			if (price !== null && timestamp !== null && Number.isFinite(timestamp) && timestamp > 0) {
				points.push({ price, timestamp });
			}
		}
		return historicalQuote(points);
	}
	if (shape === 'gateio-spot-ticker') {
		const ticker = Array.isArray(data)
			? data.find((item: unknown) => isRecord(item) && item.currency_pair === 'AO_USDT')
			: data;
		if (!isRecord(ticker) || ticker.currency_pair !== 'AO_USDT') return null;
		const price = normalizePrice(ticker.last);
		return price === null ? null : { price, change24hPercent: normalizeChange(ticker.change_percentage) };
	}
	if (!isRecord(data) || data.symbol !== 'ARUSDT') return null;
	const price = normalizePrice(data.price);
	// This fallback returns only the last price; an absent movement must not appear as 0%.
	return price === null ? null : { price, change24hPercent: null };
}
