const PRICE_DECIMALS = 8;
const PRICE_SCALE_NUMBER = 10 ** PRICE_DECIMALS;
const USD_CALCULATION_DECIMALS = 12 + PRICE_DECIMALS;
const SMALL_USD_THRESHOLD = BigInt(1) * BigInt(10) ** BigInt(USD_CALCULATION_DECIMALS - 2);

function formatScaledUsd(amount: bigint, decimalPlaces: number) {
	const divisor = BigInt(10) ** BigInt(USD_CALCULATION_DECIMALS - decimalPlaces);
	const rounded = (amount + divisor / BigInt(2)) / divisor;
	const scale = BigInt(10) ** BigInt(decimalPlaces);
	const dollars = rounded / scale;
	const cents = (rounded % scale).toString().padStart(decimalPlaces, '0').replace(/0+$/, '').padEnd(2, '0');

	return `$${dollars.toLocaleString()}.${cents}`;
}

export function formatArUsdValue(balance: string, arUsdPrice: number | null) {
	if (arUsdPrice === null || !Number.isFinite(arUsdPrice) || arUsdPrice <= 0 || !/^\d+$/.test(balance)) return '-';

	const scaledPrice = Math.round(arUsdPrice * PRICE_SCALE_NUMBER);
	if (!Number.isSafeInteger(scaledPrice) || scaledPrice <= 0) return '-';

	const usdAmount = BigInt(balance) * BigInt(scaledPrice);
	if (usdAmount === BigInt(0)) return '$0.00';

	return formatScaledUsd(usdAmount, usdAmount < SMALL_USD_THRESHOLD ? 8 : 6);
}
