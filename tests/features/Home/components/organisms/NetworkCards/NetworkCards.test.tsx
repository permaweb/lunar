// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { NetworkCards } from '../../../../../../src/features/Home';
import { darkTheme, theme } from '../../../../../../src/helpers/themes';

vi.mock('api/prices', () => ({ getTokenPriceQuote: async () => null }));
vi.mock('react-svg', () => ({ ReactSVG: () => <svg aria-hidden="true" /> }));

let container: HTMLElement;
let root: ReturnType<typeof createRoot>;
let arBottom: number;
let aoBottom: number;
let resize: () => void;
const onPricesScrollChange = vi.fn();
const disconnect = vi.fn();

beforeEach(() => {
	vi.useFakeTimers();
	vi.clearAllMocks();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(callback, 16));
	vi.stubGlobal('cancelAnimationFrame', (frame: number) => clearTimeout(frame));
	vi.stubGlobal(
		'ResizeObserver',
		class {
			constructor(callback: () => void) {
				resize = callback;
			}
			observe() {}
			disconnect = disconnect;
		}
	);
	arBottom = 150;
	aoBottom = 150;
	vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
		const isArweave = this.querySelector('[aria-label="Arweave Price (USD)"]');
		return new DOMRect(0, (isArweave ? arBottom : aoBottom) - 20, 100, 20);
	});
	container = document.createElement('div');
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await React.act(async () => root.unmount());
	container.remove();
	vi.restoreAllMocks();
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

async function render() {
	await React.act(async () =>
		root.render(
			<ThemeProvider theme={theme(darkTheme)}>
				<NetworkCards snapshot={null} isLoading={false} onPricesScrollChange={onPricesScrollChange} />
			</ThemeProvider>
		)
	);
}

async function scroll() {
	await React.act(async () => {
		window.dispatchEvent(new Event('scroll'));
		await vi.advanceTimersByTimeAsync(16);
	});
}

it('reports passing both price rows at the sticky-header boundary and reverses when scrolling up', async () => {
	await render();
	expect(onPricesScrollChange).toHaveBeenLastCalledWith(false);
	arBottom = 60;
	await scroll();
	expect(onPricesScrollChange).toHaveBeenCalledTimes(1);
	aoBottom = 71.5;
	await scroll();
	expect(onPricesScrollChange).toHaveBeenLastCalledWith(true);
	await scroll();
	expect(onPricesScrollChange).toHaveBeenCalledTimes(2);
	aoBottom = 72;
	await scroll();
	expect(onPricesScrollChange).toHaveBeenLastCalledWith(false);
});

it('handles jumps from below the viewport to above the header', async () => {
	arBottom = 1500;
	aoBottom = 2000;
	await render();
	expect(onPricesScrollChange).toHaveBeenLastCalledWith(false);
	arBottom = -600;
	aoBottom = -100;
	await scroll();
	expect(onPricesScrollChange).toHaveBeenLastCalledWith(true);
});

it('measures restored scroll positions immediately and rechecks responsive layout changes', async () => {
	arBottom = -100;
	aoBottom = -100;
	await render();
	expect(onPricesScrollChange).toHaveBeenLastCalledWith(true);
	aoBottom = 120;
	await React.act(async () => {
		resize();
		await vi.advanceTimersByTimeAsync(16);
	});
	expect(onPricesScrollChange).toHaveBeenLastCalledWith(false);
	aoBottom = 50;
	await React.act(async () => {
		window.dispatchEvent(new Event('resize'));
		await vi.advanceTimersByTimeAsync(16);
	});
	expect(onPricesScrollChange).toHaveBeenLastCalledWith(true);
});

it('cleans up pending work and resets the state when leaving Home', async () => {
	await render();
	window.dispatchEvent(new Event('scroll'));
	await React.act(async () => root.unmount());
	expect(disconnect).toHaveBeenCalledOnce();
	expect(onPricesScrollChange).toHaveBeenLastCalledWith(false);
	onPricesScrollChange.mockClear();
	await scroll();
	expect(onPricesScrollChange).not.toHaveBeenCalled();
});
