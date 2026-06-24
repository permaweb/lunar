import React from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
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
import { useTheme } from 'styled-components';

import { MetricDataPoint } from 'helpers/types';
import { formatCount, formatDate } from 'helpers/utils';

import * as S from './styles';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const crosshairPlugin = {
	id: 'crosshairPlugin',
	afterDatasetsDraw(chart: any, _args: any, pluginOptions: any) {
		if (!pluginOptions) return;

		const { ctx, scales } = chart;

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

type MetricChartProps = {
	chartType?: 'horizontal-bar' | 'line' | 'vertical-bar';
	dataList: MetricDataPoint[];
	metric: keyof MetricDataPoint;
	totalField: keyof MetricDataPoint;
	chartLabel: string;
	loadingDelay?: number;
	totalLabel?: string;
	valueFormatter?: (value: string | number) => string;
	valueScale?: 'fit' | 'zero';
};

function MetricChart(props: MetricChartProps) {
	const theme = useTheme();
	const chartRef = React.useRef<any>(null);
	const chartType = props.chartType ?? 'line';
	const isBarChart = chartType !== 'line';
	const loadingKey = `${props.chartLabel}:${String(props.metric)}`;

	const [currentDate, setCurrentDate] = React.useState<string | null>(null);
	const [currentValue, setCurrentValue] = React.useState<string | number | null>(null);
	const [isLoading, setIsLoading] = React.useState<boolean>(() => !loadedChartKeys.has(loadingKey));

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

	React.useEffect(() => {
		if (props.dataList.length > 0) {
			const currentDataPoint = props.dataList[props.dataList.length - 1];
			setCurrentDate(currentDataPoint.day);
			setCurrentValue(currentDataPoint[props.metric]);
		}
	}, [props.dataList, props.metric]);

	const labels = React.useMemo(() => {
		return props.dataList.map((item) => {
			const date = new Date(item.day);
			return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
		});
	}, [props.dataList]);

	const total = React.useMemo(() => {
		const value = props.dataList?.[props.dataList.length - 1][props.totalField];
		if (value === undefined || value === null) return '-';
		return props.valueFormatter ? props.valueFormatter(value) : formatCount(value.toString());
	}, [props.dataList, props.totalField, props.valueFormatter]);

	const datasetData = React.useMemo(() => {
		return props.dataList.map((item) => item[props.metric]);
	}, [props.dataList, props.metric]);

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

		// Background color
		ctx.fillStyle = theme.colors.container.alt2.background;
		ctx.fillRect(0, 0, 3, 3);

		// Dot color
		ctx.fillStyle = theme.colors.container.alt5.background;
		ctx.beginPath();
		ctx.arc(3, 3, 1, 0, 2 * Math.PI);
		ctx.fill();

		return ctx.createPattern(canvas, 'repeat');
	}, [theme]);

	const chartData = React.useMemo(() => {
		const barColor = theme.colors.container.alt6.background;
		const barHoverColor = theme.colors.container.alt10.background;

		return {
			labels,
			datasets: [
				{
					label: props.chartLabel || (props.metric as string),
					data: datasetData,
					fill: true,
					backgroundColor: isBarChart ? barColor : createDottedPattern(),
					borderColor: isBarChart ? barColor : theme.colors.border.alt5,
					borderWidth: isBarChart ? 0 : 1.5,
					hoverBackgroundColor: isBarChart ? barHoverColor : undefined,
					hoverBorderColor: isBarChart ? barHoverColor : undefined,
					pointBackgroundColor: theme.colors.border.alt6,
					pointBorderColor: theme.colors.border.alt5,
					pointRadius: 0,
					lineTension: 0.1,
					maxBarThickness: 32,
				},
			],
		};
	}, [labels, datasetData, theme, props.metric, props.chartLabel, isBarChart, createDottedPattern]);

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
					const element = props.dataList[dataIndex];
					if (element) {
						setCurrentDate(element.day);
						setCurrentValue(element[props.metric]);
					}
				}
			} else {
				chart.$activeElement = null;
			}
		},
		[props.dataList, props.metric]
	);

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		animation: false as any,
		indexAxis: chartType === 'horizontal-bar' ? ('y' as const) : ('x' as const),
		plugins: {
			tooltip: { enabled: false },
			legend: { display: false, labels: { usePointStyle: true } },
			crosshairPlugin: isBarChart
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
						currentDate: props.dataList.length - 1,
						currentLine: {
							lineWidth: 1.5,
							borderColor: theme.colors.border.alt2,
							borderDash: [3, 2],
						},
				  },
		},
		interaction: {
			mode: 'index' as const,
			intersect: false,
		},
		scales: {
			x: {
				title: { display: false, text: 'Days' },
				ticks: {
					display: false,
				},
				grid: { display: false, drawBorder: false, drawOnChartArea: false },
				border: { display: false },
				...(chartType === 'horizontal-bar' ? fittedValueScale : {}),
			},
			y: {
				title: { display: false },
				ticks: {
					display: false,
				},
				grid: { display: false, drawBorder: false, drawOnChartArea: false },
				border: { display: false },
				...(chartType === 'horizontal-bar' ? {} : fittedValueScale),
			},
		},
		onHover: handleHover,
	};

	if (isLoading) {
		return <S.Placeholder className={'border-wrapper-alt4'} />;
	}

	return (
		<S.Wrapper className={'border-wrapper-alt4'}>
			<S.HeaderWrapper>
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
						<span>{currentDate ? formatDate(currentDate, 'dateString') : '-'}</span>
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
			<S.BodyWrapper>
				<S.ChartWrapper $showCrosshair>
					{chartType === 'line' ? (
						<Line ref={chartRef} data={chartData} options={options} />
					) : (
						<Bar ref={chartRef} data={chartData} options={options} />
					)}
				</S.ChartWrapper>
			</S.BodyWrapper>
		</S.Wrapper>
	);
}

export default React.memo(MetricChart);
