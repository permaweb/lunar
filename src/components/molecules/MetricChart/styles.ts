import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div<{ $pie?: boolean }>`
	width: 100%;
	/* Clip the canvas to the card's rounded corners so the chart's bottom
	 * left/right edges don't poke past the wrapper's border radius. */
	overflow: hidden;
	padding: ${(props) => (props.$pie ? '0 0 20px 0' : '0')};
`;

export const Placeholder = styled.div`
	height: 313.5px;
	width: 100%;
	box-shadow: none !important;
	border-radius: ${STYLING.dimensions.radius.alt1};
	background: linear-gradient(
		90deg,
		${(props) => props.theme.colors.container.primary.background} 0%,
		${(props) => props.theme.colors.container.alt2.background} 50%,
		${(props) => props.theme.colors.container.primary.background} 100%
	);
	background-size: 200% 100%;
	animation: metric-chart-shimmer 1s ease-in-out infinite alternate;

	@keyframes metric-chart-shimmer {
		from {
			background-position: 0% 0;
		}
		to {
			background-position: 100% 0;
		}
	}
`;

export const HeaderWrapper = styled.div<{ $noWrapper?: boolean }>`
	width: 100%;
	padding: ${(props) => (props.$noWrapper ? '0' : '15px 20px 0 20px')};
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 15px;
	position: relative;

	> * {
		&:last-child {
			align-items: flex-end;
			justify-content: flex-end;

			p,
			span {
				text-align: right;
			}
		}
	}

	&:before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: ${(props) => props.theme.colors.view.background};
		z-index: -1;
		filter: blur(5px);
	}
`;

export const HeaderSection = styled.div`
	display: flex;
	flex-direction: column;
	min-width: 0;
`;

export const HeaderLabel = styled.div`
	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary.web};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const HeaderValue = styled.div`
	p {
		font-size: 22px;
		font-family: ${(props) => props.theme.typography.family.alt1.web};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		color: ${(props) => props.theme.colors.font.primary};
		overflow-wrap: anywhere;
	}
`;

export const BodyWrapper = styled.div`
	width: 100%;
`;

export const ChartWrapper = styled.div<{
	$showCrosshair?: boolean;
	$pie?: boolean;
	$map?: boolean;
	$height?: number;
}>`
	height: ${(props) => (props.$height ? props.$height : '240.5px')};
	width: 100%;
	position: relative;
	cursor: ${(props) => (props.$pie || props.$map ? 'pointer' : props.$showCrosshair ? 'crosshair' : 'default')};
	/* Bottom corners are clipped by the card Wrapper's rounded overflow, so the
	 * chart no longer needs (a mismatched) radius of its own here. */
	overflow: hidden;

	/*
	 * Chart.js snaps its plot area to whole device pixels, which leaves a ~1px gap
	 * on the right/bottom whenever the wrapper resolves to a fractional size (common
	 * in fluid grid layouts). Over-size the canvas by 1px on the right/bottom and let
	 * this wrapper's overflow:hidden clip the surplus, so the plotted area and the
	 * hover crosshair reach the visible edges. Top/left stay flush so the chart's own
	 * top padding (and pointer hit-testing) are unaffected.
	 */
	canvas {
		width: calc(100% + 2px) !important;
		height: calc(100% + 1px) !important;
		position: absolute;
		top: 1px;
		left: -1px;
	}
`;

export const PieLegend = styled.div`
	position: absolute;
	bottom: 0;
	left: 15px;
	display: flex;
	flex-direction: column;
	gap: 4px;
	z-index: 1;
	pointer-events: none;
	max-width: 55%;
`;

export const PieLegendItem = styled.div<{ $active?: boolean }>`
	display: flex;
	align-items: center;
	gap: 6px;
	opacity: ${(props) => (props.$active ? '1' : '0.6')};
	transition: opacity 100ms ease;

	span {
		min-width: 0;
		font-size: ${(props) => props.theme.typography.size.xxxxSmall};
		font-family: ${(props) => props.theme.typography.family.primary.web};
		font-weight: ${(props) =>
			props.$active ? props.theme.typography.weight.bold : props.theme.typography.weight.medium};
		color: ${(props) => (props.$active ? props.theme.colors.font.primary : props.theme.colors.font.alt1)};
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
`;

export const PieLegendPercent = styled.small`
	flex: none;
	margin-left: 2px;
	color: ${(props) => props.theme.colors.font.alt1};
	font-size: ${(props) => props.theme.typography.size.xxxxSmall};
	font-weight: ${(props) => props.theme.typography.weight.medium};
	font-variant-numeric: tabular-nums;
`;

export const PieLegendSwatch = styled.div<{ $color: string }>`
	width: 10px;
	height: 10px;
	min-width: 10px;
	border-radius: 2px;
	background: ${(props) => props.$color};
`;
