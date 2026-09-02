import styled from 'styled-components';

import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px35};
`;

export const RouterWrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px15};
`;

export const RouterBody = styled.div`
	width: 100%;
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.alt1};
	overflow: hidden;

	> * {
		&:not(:last-child) {
			border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
		}
	}
`;

export const RouterFooter = styled.div`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: flex-end;
`;

export const NodeRow = styled.div<{ count: number }>`
	display: grid;

	grid-template-columns: repeat(${({ count }) => count}, 1fr);

	> * {
		&:not(:last-child) {
			border-right: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
		}
		&:last-child {
		}
	}

	@media (max-width: ${STYLING.cutoffs.initial}) {
		grid-template-columns: repeat(1, 1fr);

		> * {
			&:not(:last-child) {
				border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
			}
		}
	}
`;

export const NodeWrapper = styled.a`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px25};
	padding: ${CSS_DIMENSIONS.px17_5};
	background: ${(props) => props.theme.colors.container.alt1.background};

	&:hover {
		background: ${(props) => props.theme.colors.container.primary.active};
	}
`;

export const NodeHeader = styled.div`
	width: 100%;
	display: flex;
	flex-wrap: wrap;
	gap: ${CSS_DIMENSIONS.px20};
	align-items: center;
	justify-content: space-between;

	p {
		font-size: ${(props) => props.theme.typography.size.small};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}

	span {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const IndicatorWrapper = styled.div`
	display: flex;
	gap: ${CSS_DIMENSIONS.px10};
	align-items: center;

	span {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const Indicator = styled.div<{ healthy: boolean }>`
	height: ${CSS_DIMENSIONS.px11_5};
	width: ${CSS_DIMENSIONS.px11_5};
	margin: ${CSS_DIMENSIONS.px1_5} 0 0 0;
	border-radius: 50%;
	background: ${(props) => (props.healthy ? props.theme.colors.indicator.active : props.theme.colors.warning.primary)};
`;

export const NodeBody = styled.div`
	width: 100%;
	display: flex;
	flex-wrap: wrap;
	gap: ${CSS_DIMENSIONS.px12_5};
	align-items: center;
	justify-content: space-between;
`;

export const NodeLine = styled.div`
	display: flex;
	gap: ${CSS_DIMENSIONS.px5};
	align-items: center;

	p {
		font-size: ${(props) => props.theme.typography.size.small};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}

	span {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const Subheader = styled.div`
	width: fit-content;
	padding: ${CSS_DIMENSIONS.px4_5} ${CSS_DIMENSIONS.px11_5};
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${(props) => props.theme.colors.container.alt8.background};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.alt2};
	border-radius: ${STYLING.dimensions.radius.alt2};
	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.light1};
		text-align: center;
		text-transform: uppercase;
	}
`;

export const Placeholder = styled.div`
	height: ${CSS_DIMENSIONS.px150};
	width: 100%;
`;
