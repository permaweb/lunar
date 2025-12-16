import React from 'react';
import { Line } from 'react-chartjs-2';
import {
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const crosshairPlugin = {
	id: 'crosshairPlugin',
	afterDatasetsDraw(chart: any, _args: any, pluginOptions: any) {
		const { ctx, scales } = chart;

		if (pluginOptions.currentDate !== undefined && pluginOptions.currentDate >= 0) {
			const currentDateIndex = pluginOptions.currentDate;
			const xCoord = scales.x.getPixelForValue(currentDateIndex);
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(xCoord, scales.y.top);
			ctx.lineTo(xCoord, scales.y.bottom);
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

export default function MetricChart(props: {
	dataList: MetricDataPoint[];
	metric: keyof MetricDataPoint;
	totalField: keyof MetricDataPoint;
	chartLabel: string;
}) {
	const theme = useTheme();
	const chartRef = React.useRef<any>(null);

	const [currentDate, setCurrentDate] = React.useState<string | null>(null);
	const [currentValue, setCurrentValue] = React.useState<string | number | null>(null);

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
		return value ? formatCount(value.toString()) : '-';
	}, [props.dataList, props.totalField]);

	const datasetData = React.useMemo(() => {
		return props.dataList.map((item) => item[props.metric]);
	}, [props.dataList, props.metric]);

	const chartData = React.useMemo(() => {
		return {
			labels,
			datasets: [
				{
					label: props.chartLabel || (props.metric as string),
					data: datasetData,
					fill: true,
					backgroundColor: theme.colors.container.alt1.background,
					borderColor: theme.colors.border.alt5,
					pointBackgroundColor: theme.colors.border.alt6,
					pointBorderColor: theme.colors.border.alt5,
					pointRadius: 1,
					lineTension: 0.1,
				},
			],
		};
	}, [labels, datasetData, theme, props.metric, props.chartLabel]);

	const handleHover = React.useCallback(
		(_event: any, activeElements: any[], chart: any) => {
			if (activeElements && activeElements.length > 0) {
				const activeElem = activeElements[0].element;
				chart.$activeElement = activeElem;
				const xIndex = chart.scales.x.getValueForPixel(activeElem.x);
				const yIndex = chart.scales.y.getValueForPixel(activeElem.y);
				if (xIndex !== null && yIndex !== null) {
					const element = props.dataList[xIndex];
					setCurrentDate(element.day);
					setCurrentValue(element[props.metric]);
				}
			} else {
				chart.$activeElement = null;
			}
		},
		[currentValue]
	);

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			tooltip: { enabled: false },
			legend: { display: false, labels: { usePointStyle: true } },
			crosshairPlugin: {
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
			},
			y: {
				title: { display: false },
				ticks: {
					display: false,
				},
				grid: { display: false, drawBorder: false, drawOnChartArea: false },
				border: { display: false },
			},
		},
		onHover: handleHover,
	};

	return (
		<S.Wrapper className={'border-wrapper-primary'}>
			<S.HeaderWrapper>
				<S.HeaderSection>
					<S.HeaderLabel>
						<span>{props.chartLabel}</span>
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
						<p>{currentValue ? formatCount(currentValue.toString()) : '-'}</p>
					</S.HeaderValue>
				</S.HeaderSection>
			</S.HeaderWrapper>
			<S.BodyWrapper>
				<S.ChartWrapper>
					<Line ref={chartRef} data={chartData} options={options} />
				</S.ChartWrapper>
			</S.BodyWrapper>
		</S.Wrapper>
	);
}
