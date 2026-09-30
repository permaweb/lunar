// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { getTokenPriceQuote } from '../../src/api/prices';
import { formatUsdPrice } from '../../src/helpers/prices';
import { useTokenPrices } from '../../src/hooks/useTokenPrices';

vi.mock('api/prices', () => ({ getTokenPriceQuote: vi.fn() }));

let container: HTMLElement;
let root: ReturnType<typeof createRoot>;

function Harness() {
	const prices = useTokenPrices();
	return (
		<div data-ar-change={prices.ar?.change24hPercent} data-ao-change={prices.ao?.change24hPercent}>
			{formatUsdPrice(prices.ar?.price ?? null)} / {formatUsdPrice(prices.ao?.price ?? null)}
		</div>
	);
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.mocked(getTokenPriceQuote).mockImplementation(async (symbol) =>
		symbol === 'AR' ? { price: 4.21, change24hPercent: 2 } : { price: 4.53, change24hPercent: -1 }
	);
	container = document.createElement('div');
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.resetAllMocks();
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

it('shows an unavailable price without hiding the other token price', async () => {
	vi.mocked(getTokenPriceQuote).mockImplementation(async (symbol) => {
		if (symbol === 'AO') throw new Error('offline');
		return { price: 4.21, change24hPercent: 2 };
	});
	await React.act(async () => root.render(<Harness />));
	expect(container.textContent).toBe('$4.21 / -');
});

it('refreshes prices and retains the last valid price when one feed fails', async () => {
	await React.act(async () => root.render(<Harness />));
	expect(container.textContent).toBe('$4.21 / $4.53');
	expect(container.firstElementChild?.getAttribute('data-ar-change')).toBe('2');
	expect(container.firstElementChild?.getAttribute('data-ao-change')).toBe('-1');
	vi.mocked(getTokenPriceQuote).mockImplementation(async (symbol) =>
		symbol === 'AR' ? null : { price: 0.123456, change24hPercent: null }
	);
	await React.act(async () => vi.advanceTimersByTimeAsync(60000));
	expect(container.textContent).toBe('$4.21 / $0.123456');
	expect(container.firstElementChild?.hasAttribute('data-ar-change')).toBe(false);
	expect(container.firstElementChild?.hasAttribute('data-ao-change')).toBe(false);
});

it('does not overlap refreshes and cleans up polling while a request is pending', async () => {
	let resolvePrice: (price: { price: number; change24hPercent: number | null }) => void;
	vi.mocked(getTokenPriceQuote).mockReturnValue(
		new Promise((resolve) => {
			resolvePrice = resolve;
		})
	);
	await React.act(async () => root.render(<Harness />));
	expect(container.textContent).toBe('- / -');
	await React.act(async () => vi.advanceTimersByTimeAsync(120000));
	expect(getTokenPriceQuote).toHaveBeenCalledTimes(2);
	await React.act(async () => root.unmount());
	expect(vi.getTimerCount()).toBe(0);
	await React.act(async () => resolvePrice({ price: 4.21, change24hPercent: null }));
	expect(container.textContent).toBe('');
});
