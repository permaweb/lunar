import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	width: 100%;
`;

export const HeaderWrapper = styled.div`
	width: 100%;
	padding: 15px 20px 0 20px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 15px;

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

	position: relative;

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

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		position: relative;
	}
`;

export const HeaderSection = styled.div`
	display: flex;
	flex-direction: column;
`;

export const HeaderLabel = styled.div`
	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const HeaderValue = styled.div`
	p {
		font-size: clamp(18px, 1.5vw, 22px);
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.xBold};
		color: ${(props) => props.theme.colors.font.primary};
	}
`;

export const BodyWrapper = styled.div`
	width: 100%;
`;

export const ChartWrapper = styled.div`
	height: 240.5px;
	width: 100%;
	position: relative;
	cursor: crosshair;
	overflow: hidden;
	border-bottom-left-radius: ${STYLING.dimensions.radius.alt1};
	border-bottom-right-radius: ${STYLING.dimensions.radius.alt1};

	canvas {
		width: calc(100% + 16.5px) !important;
		position: absolute;
		top: 9.5px;
		left: -9.5px;
	}
`;
