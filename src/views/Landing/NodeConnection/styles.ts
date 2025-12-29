import styled from 'styled-components';

export const Wrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 25px;
	padding: 15px;
	position: relative;
	background: ${(props) => props.theme.colors.container.alt1.background} !important;
`;

export const ActionWrapper = styled.div`
	position: absolute;
	top: 15px;
	right: 15px;
`;

export const MetricsSection = styled.div`
	width: 100%;
	height: 100%;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 5.35px;

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
		font-weight: ${(props) => props.theme.typography.weight.xBold};
		color: ${(props) => props.theme.colors.font.primary};
		margin: 7.5px 0 0 0;
	}
`;

export const MetricLineFlex = styled.div`
	display: flex;
	align-items: center;
	gap: 7.5px;
`;

export const Indicator = styled.div<{ isOnline: boolean }>`
	height: 11.5px;
	width: 11.5px;
	margin: -0.15px 0 0 0;
	border-radius: 50%;

	animation: ${(props) => (props.isOnline ? 'pulse 1.075s infinite' : 'none')};
	background: ${(props) => (props.isOnline ? props.theme.colors.indicator.active : props.theme.colors.warning.primary)};

	@keyframes pulse {
		0%,
		100% {
			background: ${(props) => props.theme.colors.indicator.active};
			transform: scale(1);
		}
		50% {
			background: ${(props) => props.theme.colors.indicator.primary};
			transform: scale(1.15);
		}
	}
`;
