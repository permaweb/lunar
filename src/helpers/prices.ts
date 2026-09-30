export function formatUsdPrice(price: number | null): string {
	if (price === null) return '-';

	return price.toLocaleString(undefined, {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: price >= 1 ? 2 : 4,
		maximumFractionDigits: price >= 1 ? 2 : 6,
	});
}

export function formatPriceChange(change: number | null): string | null {
	if (change === null || !Number.isFinite(change)) return null;
	return (change / 100).toLocaleString(undefined, {
		style: 'percent',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
		signDisplay: 'exceptZero',
	});
}
