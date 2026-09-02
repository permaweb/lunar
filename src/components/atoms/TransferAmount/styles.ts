import styled from 'styled-components';

import { CSS_DIMENSIONS } from 'helpers/themes';

export const Tooltip = styled.span`
	position: absolute;
	z-index: 2;
	display: none;
	left: 100%;
	top: 50%;
	transform: translateY(-50%);
	margin-left: ${CSS_DIMENSIONS.px5};
	white-space: nowrap;

	span {
		display: block;
		line-height: 1.1;
	}
`;

export const Wrapper = styled.span`
	position: relative;
	min-width: 0;
	max-width: 100%;
	display: inline-flex;
	align-items: center;
	color: ${(props) => props.theme.colors.font.alt2};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-family: ${(props) => props.theme.typography.family.alt1};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	white-space: nowrap;

	&:hover {
		${Tooltip} {
			display: block;
		}
	}

	.info {
		padding: ${CSS_DIMENSIONS.px2} ${CSS_DIMENSIONS.px5} !important;
	}
`;

export const Quantity = styled.span`
	min-width: 0;
	max-width: ${CSS_DIMENSIONS.px80};
	overflow: hidden;
	text-overflow: ellipsis;
`;

export const Ticker = styled.span`
	flex: 0 0 auto;
	margin: 0 0 0 ${CSS_DIMENSIONS.px3_5};
	text-transform: uppercase;
	max-width: ${CSS_DIMENSIONS.px40};
	overflow: hidden;
	text-overflow: ellipsis;
`;
