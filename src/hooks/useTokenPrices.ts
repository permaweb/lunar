import React from 'react';

import type { TokenPriceQuote } from 'api/prices';
import { getTokenPriceQuote } from 'api/prices';

type TokenPrices = { ao: TokenPriceQuote | null; ar: TokenPriceQuote | null };
const PRICE_REFRESH_INTERVAL = 60 * 1000;

export function useTokenPrices(): TokenPrices {
	const [prices, setPrices] = React.useState<TokenPrices>({ ao: null, ar: null });

	React.useEffect(() => {
		let cancelled = false;
		let pending = false;

		async function refreshPrices() {
			if (pending) return;
			pending = true;
			const [ao, ar] = await Promise.allSettled([getTokenPriceQuote('AO'), getTokenPriceQuote('AR')]);
			pending = false;
			if (cancelled) return;
			setPrices((previous) => ({
				ao:
					(ao.status === 'fulfilled' ? ao.value : null) ??
					(previous.ao ? { ...previous.ao, change24hPercent: null } : null),
				ar:
					(ar.status === 'fulfilled' ? ar.value : null) ??
					(previous.ar ? { ...previous.ar, change24hPercent: null } : null),
			}));
		}

		void refreshPrices();
		const interval = window.setInterval(refreshPrices, PRICE_REFRESH_INTERVAL);
		return () => {
			cancelled = true;
			window.clearInterval(interval);
		};
	}, []);

	return prices;
}
