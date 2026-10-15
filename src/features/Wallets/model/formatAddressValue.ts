const PRICE_DECIMALS = 8;
const PRICE_SCALE_NUMBER = 10 ** PRICE_DECIMALS;

function formatScaledUsd(amount: bigint, calculationDecimals: number, decimalPlaces: number) {
	const divisor = BigInt(10) ** BigInt(calculationDecimals - decimalPlaces);
	const rounded = (amount + divisor / BigInt(2)) / divisor;
	const scale = BigInt(10) ** BigInt(decimalPlaces);
	const dollars = rounded / scale;
	const cents = (rounded % scale).toString().padStart(decimalPlaces, '0');

	return `$${dollars.toLocaleString()}.${cents}`;
}

export function formatTokenUsdValue(balance: string, tokenUsdPrice: number | null, denomination: number): string {
	if (
		tokenUsdPrice === null ||
		!Number.isFinite(tokenUsdPrice) ||
		tokenUsdPrice <= 0 ||
		!/^\d+$/.test(balance) ||
		!Number.isInteger(denomination) ||
		denomination < 0 ||
		denomination > 36
	)
		return '-';

	const scaledPrice = Math.round(tokenUsdPrice * PRICE_SCALE_NUMBER);
	if (!Number.isSafeInteger(scaledPrice) || scaledPrice <= 0) return '-';

	const usdAmount = BigInt(balance) * BigInt(scaledPrice);
	if (usdAmount === BigInt(0)) return '$0.00';

	const calculationDecimals = denomination + PRICE_DECIMALS;
	return formatScaledUsd(usdAmount, calculationDecimals, 2);
}
