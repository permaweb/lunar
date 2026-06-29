import React from 'react';
import { Bar, Chart, Line, Pie } from 'react-chartjs-2';
import {
	ArcElement,
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Filler,
	Legend,
	LinearScale,
	LineElement,
	PointElement,
	Title,
	Tooltip,
} from 'chart.js';
import { ChoroplethController, ColorScale, GeoFeature, ProjectionScale, topojson } from 'chartjs-chart-geo';
import iso from 'i18n-iso-countries';
import { useTheme } from 'styled-components';
import worldAtlas from 'world-atlas/countries-110m.json';

import { MetricDataPoint } from 'helpers/types';
import { formatCount, formatDate, getTranslucentColor } from 'helpers/utils';

import * as S from './styles';

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
	Filler
);

// Geo controller + element + projection/color scales for the `map` (choropleth)
// chart type. The ChoroplethController's own defaults register a `color` scale,
// so ColorScale must be registered or the chart throws at render. We hide that
// color legend (mapOptions) and drive every country's color from the dataset's
// backgroundColor/borderColor callbacks instead.
ChartJS.register(ChoroplethController, ColorScale, GeoFeature, ProjectionScale);

// Build the world country features once at module scope. Vite resolves the
// .json import to the TopoJSON Topology; topojson.feature converts the
// `countries` object into GeoJSON features. Each feature.id is the ISO 3166-1
// numeric code as a string (e.g. '840' = USA); feature.properties.name is the
// display name.
const COUNTRY_FEATURES = (topojson.feature(worldAtlas as any, (worldAtlas as any).objects.countries) as any)
	.features as Array<{ id: string; properties: { name: string } }>;

type CountryColor = { fill: string; border: string; value: number };

// Resolve a location label to a numeric ISO id matching world-atlas feature ids.
// Demographic rows are normally alpha-2 (e.g. 'US') but can be alpha-3 or a full
// country name; the 'Unknown' sentinel (no geo headers) is intentionally skipped
// so it stays off the map. All branches read i18n-iso-countries' bundled
// codes.json (browser-safe, no locale registration needed).
function dayToNumericIso(day: unknown): string | undefined {
	const raw = String(day || '').trim();
	if (!raw || raw.toLowerCase() === 'unknown') return undefined;
	const upper = raw.toUpperCase();
	if (iso.alpha2ToNumeric(upper)) return iso.alpha2ToNumeric(upper);
	if (iso.alpha3ToNumeric(upper)) return iso.alpha3ToNumeric(upper);
	const alpha2 = iso.getAlpha2Code(raw, 'en');
	return alpha2 ? iso.alpha2ToNumeric(alpha2) : undefined;
}

// Map a numeric ISO id -> { translucent fill, solid border, visits } using the
// SAME index-based editor color assignment as the pie, so each country shares a
// single color across the pie and the map.
function buildCountryColorMap(
	dataList: MetricDataPoint[],
	metric: keyof MetricDataPoint,
	editorColors: string[]
): Map<string, CountryColor> {
	const map = new Map<string, CountryColor>();
	dataList.forEach((item, index) => {
		const numeric = dayToNumericIso(item.day);
		if (!numeric) return;
		const color = editorColors[index % editorColors.length];
		map.set(numeric, {
			fill: getTranslucentColor(color, 0.55),
			border: color,
			value: Number(item[metric]) || 0,
		});
	});
	return map;
}

const crosshairPlugin = {
	id: 'crosshairPlugin',
	afterDatasetsDraw(chart: any, _args: any, pluginOptions: any) {
		if (!pluginOptions) return;

		const { ctx, scales } = chart;

		// The crosshair is only meaningful on cartesian charts. Scale-less charts
		// (e.g. pie/doughnut) have no x/y scales, so bail before touching them.
		if (!scales?.x || !scales?.y) return;

		if (pluginOptions.currentDate !== undefined && pluginOptions.currentDate >= 0) {
			const currentDateIndex = pluginOptions.currentDate;
			ctx.save();
			ctx.beginPath();
			if (chart.options.indexAxis === 'y') {
				const yCoord = scales.y.getPixelForValue(currentDateIndex);
				ctx.moveTo(scales.x.left, yCoord);
				ctx.lineTo(scales.x.right, yCoord);
			} else {
				const xCoord = scales.x.getPixelForValue(currentDateIndex);
				ctx.moveTo(xCoord, scales.y.top);
				ctx.lineTo(xCoord, scales.y.bottom);
			}
			ctx.lineWidth = pluginOptions.currentLine?.lineWidth ?? 2;
			ctx.strokeStyle = pluginOptions.currentLine?.borderColor || 'red';
			if (pluginOptions.currentLine?.borderDash) {
				ctx.setLineDash(pluginOptions.currentLine.borderDash);
			}
			ctx.stroke();
			ctx.restore();
		}

		const activeElement = chart.$activeElement;
		if (activeElement) {
			const x = activeElement.x;
			const y = activeElement.y;
			const topY = scales.y.top;
			const bottomY = scales.y.bottom;
			const leftX = scales.x.left;
			const rightX = scales.x.right;

			ctx.save();

			ctx.beginPath();
			ctx.moveTo(x, topY);
			ctx.lineTo(x, bottomY);
			ctx.lineWidth = pluginOptions?.verticalLine?.lineWidth ?? 1;
			ctx.strokeStyle = pluginOptions?.verticalLine?.borderColor || 'black';
			if (pluginOptions?.verticalLine?.borderDash) {
				ctx.setLineDash(pluginOptions.verticalLine.borderDash);
			}
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(leftX, y);
			ctx.lineTo(rightX, y);
			ctx.lineWidth = pluginOptions?.horizontalLine?.lineWidth ?? 1;
			ctx.strokeStyle = pluginOptions?.horizontalLine?.borderColor || 'black';
			if (pluginOptions?.horizontalLine?.borderDash) {
				ctx.setLineDash(pluginOptions.horizontalLine.borderDash);
			}
			ctx.stroke();

			const dotRadius = pluginOptions?.crosshairDot?.radius ?? 5;
			const dotColor = pluginOptions?.crosshairDot?.color || 'black';
			ctx.beginPath();
			ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
			ctx.fillStyle = dotColor;
			ctx.fill();
			ctx.setLineDash([]);
			ctx.strokeStyle = pluginOptions?.crosshairDot?.borderColor || 'white';
			ctx.lineWidth = pluginOptions?.crosshairDot?.borderWidth ?? 2;
			ctx.stroke();

			ctx.restore();
		}
	},
};

ChartJS.register(crosshairPlugin);

const loadedChartKeys = new Set<string>();

// A line chart switches to a log scale when its largest point is more than this
// many times its median — enough to flatten the rest on a linear axis.
const SKEW_THRESHOLD = 1;

// Compact percent label for the pie legend: whole numbers for larger shares,
// one decimal for small ones so they don't collapse to '0%'.
function formatPercent(percent: number) {
	if (!Number.isFinite(percent)) return '0%';
	return `${percent >= 10 ? Math.round(percent) : Math.round(percent * 10) / 10}%`;
}

type MetricChartProps = {
	chartType?: 'horizontal-bar' | 'line' | 'map' | 'pie' | 'vertical-bar';
	dataList: MetricDataPoint[];
	metric: keyof MetricDataPoint;
	totalField: keyof MetricDataPoint;
	chartLabel: string;
	loadingDelay?: number;
	totalLabel?: string;
	// Overrides the computed top-left value (e.g. a count of countries/browsers
	// that isn't derivable from a per-point `totalField`).
	totalValue?: string | number;
	// Helper text appended to the top-right label, e.g. "Views", to clarify the
	// unit of the value shown beneath it.
	valueLabel?: string;
	valueFormatter?: (value: string | number) => string;
	itemLabelFormatter?: (value: string) => string;
	valueScale?: 'fit' | 'zero';
	height?: number;
	noHeader?: boolean;
	noWrapper?: boolean;
	// Cross-chart hover sync: `activeKey` is the externally-controlled active
	// item (a dataList[].day value, e.g. a country code); `onActiveChange` fires
	// when this chart hovers an item, so a sibling chart can highlight the same.
	activeKey?: string | null;
	onActiveChange?: (key: string | null) => void;
};

function MetricChart(props: MetricChartProps) {
	const theme = useTheme();
	const chartRef = React.useRef<any>(null);
	const chartType = props.chartType ?? 'line';
	const isPie = chartType === 'pie';
	const isMap = chartType === 'map';
	const isBarChart = chartType === 'vertical-bar' || chartType === 'horizontal-bar';
	const loadingKey = `${props.chartLabel}:${String(props.metric)}`;

	const [currentDate, setCurrentDate] = React.useState<string | null>(null);
	const [currentValue, setCurrentValue] = React.useState<string | number | null>(null);
	const [activeIndex, setActiveIndex] = React.useState<number>(0);
	const [isLoading, setIsLoading] = React.useState<boolean>(() => !loadedChartKeys.has(loadingKey));

	// Responsive left padding for the pie, so its plot shifts right and the
	// bottom-left HTML legend has room. Driven by the wrapper width (not by a
	// chart.js hook, which would recurse through the options proxy).
	const wrapperRef = React.useRef<HTMLDivElement>(null);
	const [pieLeftPad, setPieLeftPad] = React.useState(96);

	React.useEffect(() => {
		const el = wrapperRef.current;
		if (!isPie || !el || typeof ResizeObserver === 'undefined') return;
		const update = () => setPieLeftPad(Math.max(48, Math.round(el.clientWidth * 0.4)));
		update();
		const observer = new ResizeObserver(update);
		observer.observe(el);
		return () => observer.disconnect();
	}, [isPie]);

	React.useEffect(() => {
		if (loadedChartKeys.has(loadingKey)) {
			setIsLoading(false);
			return;
		}

		const timer = window.setTimeout(() => {
			loadedChartKeys.add(loadingKey);
			setIsLoading(false);
		}, props.loadingDelay ?? 1000);

		return () => window.clearTimeout(timer);
	}, [loadingKey, props.loadingDelay]);

	// Reset the highlighted slice to the largest (index 0, since locationPoints
	// are sorted desc) whenever the dataset changes, so the highlight never falls
	// on a stale/out-of-range index after a domain switch or reload.
	React.useEffect(() => {
		setActiveIndex(0);
	}, [props.dataList]);

	// The effective highlight: a sibling-controlled `activeKey` wins (cross-chart
	// hover sync), otherwise the chart's own hovered/largest slice.
	const controlledIndex =
		props.activeKey != null ? props.dataList.findIndex((item) => String(item.day) === props.activeKey) : -1;
	const effectiveActiveIndex = controlledIndex >= 0 ? controlledIndex : activeIndex;

	// Seed the header readout. For the pie, seed from the highlighted slice
	// (effectiveActiveIndex) so the header agrees with the persistent highlight;
	// for other charts, seed from the last data point as before.
	React.useEffect(() => {
		if (props.dataList.length === 0) return;
		const index = isPie
			? Math.min(Math.max(effectiveActiveIndex, 0), props.dataList.length - 1)
			: props.dataList.length - 1;
		const currentDataPoint = props.dataList[index];
		if (!currentDataPoint) return;
		setCurrentDate(currentDataPoint.day);
		setCurrentValue(currentDataPoint[props.metric]);
	}, [props.dataList, props.metric, isPie, effectiveActiveIndex]);

	// Keep the header in sync with an externally-set active item (e.g. when the
	// sibling map is hovered, this pie's header reflects that country too).
	React.useEffect(() => {
		if (props.activeKey == null) return;
		const row = props.dataList.find((item) => String(item.day) === props.activeKey);
		if (row) {
			setCurrentDate(row.day);
			setCurrentValue(row[props.metric]);
		}
	}, [props.activeKey, props.dataList, props.metric]);

	const labels = React.useMemo(() => {
		return props.dataList.map((item) => {
			// Categorical charts (e.g. browsers) format the label directly; time
			// series fall back to a date label.
			if (props.itemLabelFormatter) return props.itemLabelFormatter(item.day);
			const date = new Date(item.day);
			return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
		});
	}, [props.dataList, props.itemLabelFormatter]);

	const total = React.useMemo(() => {
		if (props.totalValue !== undefined && props.totalValue !== null) {
			return typeof props.totalValue === 'number' ? formatCount(String(props.totalValue)) : props.totalValue;
		}
		const value = props.dataList?.[props.dataList.length - 1]?.[props.totalField];
		if (value === undefined || value === null) return '-';
		return props.valueFormatter ? props.valueFormatter(value) : formatCount(value.toString());
	}, [props.dataList, props.totalField, props.valueFormatter, props.totalValue]);

	const datasetData = React.useMemo(() => {
		return props.dataList.map((item) => item[props.metric]);
	}, [props.dataList, props.metric]);

	// Auto-compress a spiky line chart. On a linear axis a single outlier (e.g. a
	// one-off transaction spike) flattens every other point to the floor. When the
	// largest value dwarfs the typical one (>10x the median), switch that line to a
	// log scale so the smaller points lift off the bottom. Only line charts qualify
	// — bars represent magnitude, where log would mislead.
	const useLogScale = React.useMemo(() => {
		if (chartType !== 'line') return false;

		const values = datasetData.map((value) => Number(value)).filter(Number.isFinite);
		if (values.length < 3) return false;

		const max = Math.max(...values);
		if (max <= 0) return false;

		const sorted = [...values].sort((a, b) => a - b);
		const median = sorted[Math.floor(sorted.length / 2)];
		const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
		// Fall back to the mean when the median is 0 (a series that's mostly zeros).
		const reference = median > 0 ? median : mean;

		return reference > 0 && max / reference > SKEW_THRESHOLD;
	}, [datasetData, chartType]);

	// The y-axis labels are hidden on line charts and the hover readout reads the
	// raw dataList, so plotting log1p(value) only reshapes the line — the numbers
	// shown stay exact. log1p keeps 0 at the baseline (log1p(0) === 0).
	const displayData = React.useMemo(() => {
		if (!useLogScale) return datasetData;

		return datasetData.map((value) => {
			const numericValue = Number(value);
			return Number.isFinite(numericValue) ? Math.log1p(Math.max(0, numericValue)) : value;
		});
	}, [datasetData, useLogScale]);

	const fittedValueScale = React.useMemo(() => {
		if (props.valueScale !== 'fit') return {};

		const values = datasetData.map((value) => Number(value)).filter(Number.isFinite);
		if (values.length < 2) return {};

		const min = Math.min(...values);
		const max = Math.max(...values);
		const range = max - min;

		if (range <= 0) return {};

		const padding = range * 0.08;

		return {
			beginAtZero: false,
			max: max + padding,
			min: Math.max(0, min - padding),
		};
	}, [datasetData, props.valueScale]);

	const createDottedPattern = React.useCallback(() => {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx) return theme.colors.container.alt2.background;

		canvas.width = 3;
		canvas.height = 3;

		ctx.fillStyle = theme.colors.container.alt2.background;
		ctx.fillRect(0, 0, 3, 3);

		ctx.fillStyle = theme.colors.container.alt5.background;
		ctx.beginPath();
		ctx.arc(3, 3, 1, 0, 2 * Math.PI);
		ctx.fill();

		return ctx.createPattern(canvas, 'repeat');
	}, [theme]);

	const chartData = React.useMemo<any>(() => {
		if (isMap) {
			const editorColors = Object.values(theme.colors.editor) as string[];
			const colorMap = buildCountryColorMap(props.dataList, props.metric, editorColors);

			const neutralFill = getTranslucentColor(theme.colors.container.alt4.background, 0.5);
			const neutralBorder = theme.colors.border.alt2;
			// The sibling-controlled active country is painted solid (same as the
			// pie's active slice) so hovering one chart highlights the other.
			const activeNumericId = props.activeKey ? dayToNumericIso(props.activeKey) : undefined;

			// ctx.dataIndex indexes the `data` array below, which is 1:1 with
			// COUNTRY_FEATURES, so COUNTRY_FEATURES[ctx.dataIndex].id is the
			// numeric ISO id of the hovered/painted country.
			const fillFor = (ctx: any) => {
				const feature = COUNTRY_FEATURES[ctx.dataIndex];
				const entry = feature && colorMap.get(String(feature.id));
				if (!entry) return neutralFill;
				return activeNumericId && String(feature.id) === activeNumericId ? entry.border : entry.fill;
			};
			const borderFor = (ctx: any) => {
				const feature = COUNTRY_FEATURES[ctx.dataIndex];
				const entry = feature && colorMap.get(String(feature.id));
				return entry ? entry.border : neutralBorder;
			};

			return {
				labels: COUNTRY_FEATURES.map((feature) => feature.properties.name),
				datasets: [
					{
						label: props.chartLabel || (props.metric as string),
						outline: COUNTRY_FEATURES,
						showOutline: true,
						showGraticule: false,
						data: COUNTRY_FEATURES.map((feature) => {
							const entry = colorMap.get(String(feature.id));
							return { feature, value: entry ? entry.value : 0 };
						}),
						backgroundColor: fillFor,
						borderColor: borderFor,
						borderWidth: 0.75,
						hoverBackgroundColor: (ctx: any) => {
							const feature = COUNTRY_FEATURES[ctx.dataIndex];
							const entry = feature && colorMap.get(String(feature.id));
							// Solid same-hue on hover for in-data countries.
							return entry ? entry.border : neutralFill;
						},
						hoverBorderColor: borderFor,
						hoverBorderWidth: 1,
					},
				],
			};
		}

		if (isPie) {
			const editorColors = Object.values(theme.colors.editor) as string[];
			const colorAt = (index: number) => editorColors[index % editorColors.length];

			return {
				labels,
				datasets: [
					{
						label: props.chartLabel || (props.metric as string),
						data: datasetData,
						// Translucent fill per slice; the active slice gets the solid same-hue
						// color so it stays highlighted even when the pointer leaves the chart.
						backgroundColor: datasetData.map((_value, index) =>
							index === effectiveActiveIndex ? colorAt(index) : getTranslucentColor(colorAt(index), 0.55)
						),
						borderColor: datasetData.map((_value, index) => colorAt(index)),
						borderWidth: 1.5,
						hoverBackgroundColor: datasetData.map((_value, index) => colorAt(index)),
						hoverBorderColor: datasetData.map((_value, index) => colorAt(index)),
					},
				],
			};
		}

		const barBackgroundColor = getTranslucentColor(theme.colors.container.alt6.background, 0.55);
		const barHoverColor = theme.colors.container.alt10.background;

		return {
			labels,
			datasets: [
				{
					label: props.chartLabel || (props.metric as string),
					data: displayData,
					fill: true,
					backgroundColor: isBarChart ? barBackgroundColor : createDottedPattern(),
					borderColor: theme.colors.border.alt5,
					borderWidth: isBarChart ? 1.5 : 2,
					hoverBackgroundColor: isBarChart ? barHoverColor : undefined,
					hoverBorderColor: isBarChart ? barHoverColor : undefined,
					pointBackgroundColor: theme.colors.border.alt6,
					pointBorderColor: theme.colors.border.alt5,
					pointRadius: 0,
					cubicInterpolationMode: 'default',
					maxBarThickness: 32,
				},
			],
		};
	}, [
		labels,
		datasetData,
		displayData,
		theme,
		props.metric,
		props.chartLabel,
		props.dataList,
		props.activeKey,
		isBarChart,
		isPie,
		isMap,
		effectiveActiveIndex,
		createDottedPattern,
	]);

	const pieLegend = React.useMemo(() => {
		if (!isPie) return [];
		const editorColors = Object.values(theme.colors.editor) as string[];
		const totalValue = props.dataList.reduce((sum, item) => sum + (Number(item[props.metric]) || 0), 0);
		return props.dataList.map((item, index) => {
			const value = Number(item[props.metric]) || 0;
			return {
				color: editorColors[index % editorColors.length],
				label: props.itemLabelFormatter ? props.itemLabelFormatter(item.day) : item.day,
				percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
			};
		});
	}, [isPie, theme, props.dataList, props.metric, props.itemLabelFormatter]);

	const handleHover = React.useCallback(
		(_event: any, activeElements: any[], chart: any) => {
			if (activeElements && activeElements.length > 0) {
				const activeElement = activeElements[0];
				const activeElem = activeElement.element;
				chart.$activeElement = activeElem;
				const dataIndex =
					typeof activeElement.index === 'number'
						? activeElement.index
						: chart.options.indexAxis === 'y'
						? chart.scales.y.getValueForPixel(activeElem.y)
						: chart.scales.x.getValueForPixel(activeElem.x);
				if (dataIndex !== null) {
					if (isPie) setActiveIndex(dataIndex);
					const element = props.dataList[dataIndex];
					if (element) {
						setCurrentDate(element.day);
						setCurrentValue(element[props.metric]);
						if (isPie && props.onActiveChange) props.onActiveChange(String(element.day));
					}
				}
			} else {
				chart.$activeElement = null;
			}
		},
		[props.dataList, props.metric, isPie, props.onActiveChange]
	);

	const handleMapHover = React.useCallback(
		(_event: any, activeElements: any[], _chart: any) => {
			if (activeElements && activeElements.length > 0) {
				const feature = COUNTRY_FEATURES[activeElements[0].index];
				if (!feature) return;
				const numericId = String(feature.id);
				// Reverse-map the hovered country's numeric id back to its data row.
				const match = props.dataList.find((item) => dayToNumericIso(item.day) === numericId);
				if (match) {
					setCurrentDate(match.day);
					setCurrentValue(match[props.metric]);
					if (props.onActiveChange) props.onActiveChange(String(match.day));
				}
			}
		},
		[props.dataList, props.metric, props.onActiveChange]
	);

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		animation: false as any,
		// Small top breathing room (the canvas now sits flush in its wrapper, so
		// this replaces the old canvas top-offset without clipping the plot).
		layout: { padding: { top: 9.5 } },
		indexAxis: chartType === 'horizontal-bar' ? ('y' as const) : ('x' as const),
		plugins: {
			tooltip: { enabled: false },
			legend: { display: false, labels: { usePointStyle: true } },
			crosshairPlugin:
				isBarChart || isPie
					? false
					: {
							verticalLine: {
								lineWidth: 1.5,
								borderColor: theme.colors.border.alt2,
								borderDash: [0, 0],
							},
							horizontalLine: {
								lineWidth: 1,
								borderColor: theme.colors.border.alt4,
								borderDash: [3, 2],
							},
							crosshairDot: {
								radius: 5,
								color: theme.colors.container.alt1.background,
								borderColor: theme.colors.border.alt5,
								borderWidth: 2,
								borderDash: [0, 0],
							},
					  },
		},
		interaction: {
			mode: 'index' as const,
			intersect: false,
			// Match hit-testing to the chart's index axis. Chart.js's `index` mode
			// defaults to `axis: 'x'`, which makes horizontal bars (indexAxis 'y')
			// resolve by the value axis instead of the category axis.
			axis: chartType === 'horizontal-bar' ? ('y' as const) : ('x' as const),
		},
		scales: {
			x: {
				title: { display: false, text: 'Days' },
				ticks: {
					display: false,
				},
				// tickLength 0 stops the hidden axis from reserving ~8px of empty
				// space (otherwise the plot is inset from the edges).
				grid: { display: false, drawBorder: false, drawOnChartArea: false, tickLength: 0 },
				border: { display: false },
				...(chartType === 'horizontal-bar' ? fittedValueScale : {}),
			},
			y: {
				title: { display: false },
				ticks: {
					// Horizontal bars are categorical: show the category labels (e.g.
					// browser names) on the y axis; other charts keep them hidden.
					display: chartType === 'horizontal-bar',
					autoSkip: false,
					color: theme.colors.font.alt1,
					font: { size: 11, family: theme.typography.family.primary.web },
					padding: 6,
				},
				grid: { display: false, drawBorder: false, drawOnChartArea: false, tickLength: 0 },
				border: { display: false },
				...(chartType === 'horizontal-bar' ? {} : fittedValueScale),
			},
		},
		onHover: handleHover,
	};

	const pieOptions = {
		responsive: true,
		maintainAspectRatio: false,
		// Keep layout/arc geometry instant, but animate the per-slice color swap
		// over 100ms so the active highlight fades in/out smoothly on hover.
		animation: { duration: 0 } as any,
		animations: {
			colors: {
				type: 'color' as const,
				properties: ['backgroundColor'] as const,
				duration: 100,
			},
		},
		// Shift the pie to the right so the bottom-left legend has room.
		layout: { padding: { left: pieLeftPad, right: 8, top: 8, bottom: 8 } },
		plugins: {
			tooltip: { enabled: false },
			legend: { display: false },
			crosshairPlugin: false,
		},
		// Nearest + intersect so hovering a slice activates exactly that slice.
		interaction: { mode: 'nearest' as const, intersect: true },
		onHover: handleHover,
	};

	const mapOptions = {
		responsive: true,
		maintainAspectRatio: false,
		animation: false as any,
		layout: { padding: 0 },
		plugins: {
			tooltip: { enabled: false },
			legend: { display: false },
			crosshairPlugin: false,
		},
		// Nearest + intersect so hovering a country activates exactly that arc.
		interaction: { mode: 'nearest' as const, intersect: true },
		scales: {
			// The projection scale key is 'projection' (default projection is
			// 'albersUsa' — US-only — so we override it to a world view). The
			// controller also defines a 'color' scale by default; we hide it since
			// colors come from the dataset callbacks, not a value->color scale.
			projection: {
				axis: 'x' as const,
				projection: 'equalEarth' as const,
			},
			// Must carry an `axis` or chart.js's mergeScaleConfig/determineAxis
			// throws (it can't resolve the axis for a typeless scale). Hidden, since
			// colors are driven by the dataset callbacks, not a value->color scale.
			color: {
				axis: 'x' as const,
				display: false,
			},
		},
		onHover: handleMapHover,
	};

	if (isLoading) {
		return <S.Placeholder className={'border-wrapper-alt4'} />;
	}

	return (
		<S.Wrapper className={props.noWrapper ? '' : 'border-wrapper-alt4'} $pie={isPie}>
			{!props.noHeader && (
				<S.HeaderWrapper $noWrapper={props.noWrapper}>
					<S.HeaderSection>
						<S.HeaderLabel>
							<span>{props.totalLabel ?? props.chartLabel}</span>
						</S.HeaderLabel>
						<S.HeaderValue>
							<p>{total}</p>
						</S.HeaderValue>
					</S.HeaderSection>
					<S.HeaderSection>
						<S.HeaderLabel>
							<span>
								{currentDate
									? props.itemLabelFormatter
										? props.itemLabelFormatter(currentDate)
										: formatDate(currentDate, 'dateString')
									: '-'}
								{props.valueLabel && currentDate ? ` (${props.valueLabel})` : ''}
							</span>
						</S.HeaderLabel>
						<S.HeaderValue>
							<p>
								{currentValue !== null
									? props.valueFormatter
										? props.valueFormatter(currentValue)
										: formatCount(currentValue.toString())
									: '-'}
							</p>
						</S.HeaderValue>
					</S.HeaderSection>
				</S.HeaderWrapper>
			)}
			<S.BodyWrapper>
				<S.ChartWrapper
					ref={wrapperRef}
					$showCrosshair={!isPie && !isMap}
					$pie={isPie}
					$map={isMap}
					$height={props.height}
				>
					{chartType === 'line' ? (
						<Line ref={chartRef} data={chartData} options={options} />
					) : isPie ? (
						<Pie ref={chartRef} data={chartData} options={pieOptions as any} />
					) : isMap ? (
						<Chart ref={chartRef} type={'choropleth'} data={chartData as any} options={mapOptions as any} />
					) : (
						<Bar ref={chartRef} data={chartData} options={options} />
					)}
					{isPie && pieLegend.length > 0 && (
						<S.PieLegend>
							{pieLegend.map((entry, index) => (
								<S.PieLegendItem key={index} $active={index === effectiveActiveIndex}>
									<S.PieLegendSwatch $color={entry.color} />
									<span>{entry.label}</span>
									<S.PieLegendPercent>{formatPercent(entry.percent)}</S.PieLegendPercent>
								</S.PieLegendItem>
							))}
						</S.PieLegend>
					)}
				</S.ChartWrapper>
			</S.BodyWrapper>
		</S.Wrapper>
	);
}

export default React.memo(MetricChart);
