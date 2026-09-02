import styled from 'styled-components';

import { open, transition3 } from 'helpers/animations';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	margin: ${CSS_DIMENSIONS.px40} auto 0 auto;
	padding: ${CSS_DIMENSIONS.px20};
	animation: ${open} ${transition3};
	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		text-align: center;
	}
	button {
		margin: ${CSS_DIMENSIONS.px25} 0 0 0;
	}
`;

export const Icon = styled.div`
	height: ${CSS_DIMENSIONS.px125};
	width: ${CSS_DIMENSIONS.px125};
	display: flex;
	justify-content: center;
	align-items: center;
	background: ${(props) => props.theme.colors.container.alt1.background};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.alt1};
	border-radius: 50%;
	margin: 0 0 ${CSS_DIMENSIONS.px20} 0;
	svg {
		height: ${CSS_DIMENSIONS.px75};
		width: ${CSS_DIMENSIONS.px75};
		color: ${(props) => props.theme.colors.icon.primary.fill};
		fill: ${(props) => props.theme.colors.icon.primary.fill};
		margin: ${CSS_DIMENSIONS.px13_5} 0 0 0;
	}
`;

export const WCWrapper = styled.div`
	height: auto;
`;
