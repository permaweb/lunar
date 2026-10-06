// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { MetricChart } from '../../../../src/components/molecules/MetricChart';
import { darkTheme, theme } from '../../../../src/helpers/themes';
import type { MetricDataPoint } from '../../../../src/helpers/types';

const mocks = vi.hoisted(() => ({ chart: vi.fn() }));

vi.mock('react-chartjs-2', async () => {
	const { default: React } = await import('react');
	const Chart = React.forwardRef((props, _ref) => {
		mocks.chart(props);
		return <canvas />;
	});
	return { Bar: Chart, Chart, Line: Chart, Pie: Chart };
});

const DAY = '2026-09-29T12:00:00.000Z';
let container: HTMLElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
	vi.useFakeTimers();
	vi.clearAllMocks();
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
		fillRect: vi.fn(),
		beginPath: vi.fn(),
		arc: vi.fn(),
		fill: vi.fn(),
		createPattern: vi.fn(),
	} as unknown as CanvasRenderingContext2D);
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

async function render(
	dataList: MetricDataPoint[],
	options: {
		chartType?: 'line' | 'vertical-bar';
		valueFormatter?: (value: string | number) => string;
		valueScale?: 'fit' | 'zero';
	} = {}
) {
	await React.act(async () => {
		root.render(
			<ThemeProvider theme={theme(darkTheme)}>
				<MetricChart
					dataList={dataList}
					metric="mainnet_messages_rolling"
					totalField="mainnet_messages_total"
					chartLabel="Messages"
					loadingDelay={0}
					{...options}
				/>
			</ThemeProvider>
		);
	});
	await React.act(async () => vi.runOnlyPendingTimers());
}

function readouts() {
	return [...container.querySelectorAll('p')].map((element) => element.textContent);
}

function chartProps() {
	return mocks.chart.mock.calls.at(-1)[0];
}

it.each([
	{ day: DAY },
	{ day: DAY, mainnet_messages_rolling: undefined, mainnet_messages_total: undefined },
	{ day: DAY, mainnet_messages_rolling: null, mainnet_messages_total: null },
])('renders unavailable fields as placeholders and chart gaps: %j', async (point) => {
	const valueFormatter = vi.fn((value) => String(value));
	await render([point]);
	expect(readouts()).toEqual(['-', '-']);
	expect(chartProps().data.datasets[0].data).toEqual([null]);
	await render([point], { chartType: 'vertical-bar', valueFormatter });
	expect(readouts()).toEqual(['-', '-']);
	expect(valueFormatter).not.toHaveBeenCalled();
});

it('keeps gaps out of logarithmic compression and fitted axis bounds', async () => {
	await render(
		[
			{ day: DAY, mainnet_messages_rolling: 5 },
			{ day: DAY, mainnet_messages_rolling: null },
			{ day: DAY },
			{ day: DAY, mainnet_messages_rolling: 10 },
			{ day: DAY, mainnet_messages_rolling: 50 },
		],
		{ valueScale: 'fit' }
	);
	expect(chartProps().data.datasets[0].data).toEqual([Math.log1p(5), null, null, Math.log1p(10), Math.log1p(50)]);
	expect(chartProps().options.scales.y.min).toBeCloseTo(1.4);
	expect(chartProps().options.scales.y.max).toBeCloseTo(53.6);
});

it('handles hovering unavailable fields and preserves valid zero and large integer strings', async () => {
	await render([
		{ day: DAY },
		{ day: DAY, mainnet_messages_rolling: 0 },
		{ day: DAY, mainnet_messages_rolling: '9007199254740993', mainnet_messages_total: '9007199254740993' },
	]);
	expect(readouts()).toEqual(['9,007,199,254,740,993', '9,007,199,254,740,993']);
	for (const [index, expected] of [
		[0, '-'],
		[1, '0'],
	] as const) {
		await React.act(async () => chartProps().options.onHover(null, [{ index, element: {} }], {}));
		expect(readouts()[1]).toBe(expected);
	}
});

it('clears the previous header when the dataset becomes empty', async () => {
	await render([{ day: DAY, mainnet_messages_rolling: 25, mainnet_messages_total: 100 }]);
	expect(readouts()).toEqual(['100', '25']);
	await render([]);
	expect(readouts()).toEqual(['-', '-']);
	expect(container.querySelectorAll('span')[1].textContent).toBe('-');
});
