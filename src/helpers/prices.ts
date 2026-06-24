async function getRedstonePrice(symbol: 'AO' | 'AR'): Promise<number | null> {
	try {
		const response = await fetch(`https://api.redstone.finance/prices?symbols=${symbol}&provider=redstone`);

		if (!response.ok) {
			throw new Error(`HTTP error - status: ${response.status}`);
		}

		const data = await response.json();
		const price = data?.[symbol]?.value;

		if (typeof price !== 'number') {
			console.error(`invalid ${symbol} price response from redstone:`, data);
			return null;
		}

		return price;
	} catch (error) {
		console.error(`error fetching ${symbol} price from redstone:`, error);
		return null;
	}
}

export async function getAoPrice(): Promise<number | null> {
	return getRedstonePrice('AO');
}

export async function getArPrice(): Promise<number | null> {
	return getRedstonePrice('AR');
}
