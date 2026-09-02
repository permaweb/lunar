import styled from 'styled-components';

import { open, transition3 } from 'helpers/animations';
import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div`
	background: ${(props) => props.theme.colors.accordion.background};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.primary};
	overflow: hidden;
`;

export const Action = styled.button`
	height: ${CSS_DIMENSIONS.px55_5};
	width: 100%;
	&:hover {
		background: ${(props) => props.theme.colors.accordion.hover};
	}
`;

export const Label = styled.div`
	height: 100%;
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: ${CSS_DIMENSIONS.px2_5} ${CSS_DIMENSIONS.px20} 0 ${CSS_DIMENSIONS.px20};
	span {
		font-size: ${(props) => props.theme.typography.size.base};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.accordion.color};
		padding: 0 0 ${CSS_DIMENSIONS.px2_5} 0;
	}
	svg {
		width: ${CSS_DIMENSIONS.px17_5} !important;
		fill: ${(props) => props.theme.colors.accordion.color};
	}
`;

export const Arrow = styled.div`
	margin: ${CSS_DIMENSIONS.px2_5} 0 0 0;
	svg {
		transform: rotate(90deg);
	}
`;

export const Title = styled.div`
	display: flex;
	align-items: center;
	svg {
		margin: 0 ${CSS_DIMENSIONS.px15} 0 0;
	}
`;

export const Content = styled.div`
	animation: ${open} ${transition3};
	border-top: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-bottom-left-radius: ${STYLING.dimensions.radius.primary};
	border-bottom-right-radius: ${STYLING.dimensions.radius.primary};
`;
