import styled from 'styled-components';

import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px25};
	padding: ${CSS_DIMENSIONS.px15};
	position: relative;
	background: ${(props) => props.theme.colors.container.alt1.background} !important;
`;

export const ActionWrapper = styled.div`
	position: absolute;
	top: ${CSS_DIMENSIONS.px15};
	right: ${CSS_DIMENSIONS.px15};
`;

export const MetricsSection = styled.div`
	width: 100%;
	height: 100%;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px5_35};

	p {
		width: 100%;
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		color: ${(props) => props.theme.colors.font.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		white-space: nowrap;
	}

	span {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
		text-transform: uppercase;
	}

	.metric-value {
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-size: ${(props) => props.theme.typography.size.lg};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		margin: ${CSS_DIMENSIONS.px7_5} 0 0 0;
	}
`;

export const MetricLineFlex = styled.div`
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px7_5};
`;

export const Indicator = styled.div<{ isOnline: boolean }>`
	height: ${CSS_DIMENSIONS.px11_5};
	width: ${CSS_DIMENSIONS.px11_5};
	margin: -${CSS_DIMENSIONS.px0_15} 0 0 0;
	border-radius: 50%;
	background: ${(props) => (props.isOnline ? props.theme.colors.indicator.active : props.theme.colors.warning.primary)};
`;
