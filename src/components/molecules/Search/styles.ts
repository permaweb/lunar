import styled from 'styled-components';

import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const SearchWrapper = styled.div<{ compact?: boolean }>`
	position: relative;
	width: ${(props) => (props.compact ? `${CSS_DIMENSIONS.px450}` : '100%')};
	display: flex;
	flex-direction: column;
`;

export const SearchInputWrapper = styled.div`
	position: relative;
	height: ${CSS_DIMENSIONS.px36_5};
	width: 100%;
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px5};

	> svg:first-child {
		position: absolute;
		left: ${CSS_DIMENSIONS.px12};
		min-height: ${CSS_DIMENSIONS.px15};
		min-width: ${CSS_DIMENSIONS.px15};
		height: ${CSS_DIMENSIONS.px15};
		width: ${CSS_DIMENSIONS.px15};
		z-index: 1;
		pointer-events: none;

		path {
			fill: ${(props) => props.theme.colors.font.alt1};
		}
	}
`;

export const SearchOutputWrapper = styled.div`
	width: 100%;
	min-width: ${CSS_DIMENSIONS.px300};
	max-width: ${CSS_DIMENSIONS.px500};
	position: absolute;
	top: ${CSS_DIMENSIONS.px42};
	left: 0;
	z-index: 10;
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.alt3};
	background: ${(props) => props.theme.colors.container.primary.background};
	box-shadow: 0 ${CSS_DIMENSIONS.px5} ${CSS_DIMENSIONS.px15} 0 ${(props) => props.theme.colors.shadow.primary};
`;

export const SearchOutputPlaceholder = styled.div`
	padding: ${CSS_DIMENSIONS.px20};
	display: flex;
	align-items: center;
	justify-content: center;

	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		color: ${(props) => props.theme.colors.font.primary.alt1};
	}
`;

export const SearchResult = styled.div`
	width: 100%;
	padding: 0;

	&:hover {
		background: ${(props) => props.theme.colors.container.primary.hover};
	}

	&:first-child {
		border-radius: ${STYLING.dimensions.radius.alt3} ${STYLING.dimensions.radius.alt3} 0 0;
	}

	&:last-child {
		border-radius: 0 0 ${STYLING.dimensions.radius.alt3} ${STYLING.dimensions.radius.alt3};
	}

	&:only-child {
		border-radius: ${STYLING.dimensions.radius.alt3};
	}

	a {
		width: 100%;
		padding: ${CSS_DIMENSIONS.px12_5} ${CSS_DIMENSIONS.px15};
		display: flex;
		align-items: center;
		justify-content: space-between;
		text-decoration: none;

		&:hover {
			background: ${(props) => props.theme.colors.container.primary.hover};
		}

		> svg:last-child {
			height: ${CSS_DIMENSIONS.px15};
			width: ${CSS_DIMENSIONS.px15};
			flex-shrink: 0;
			path {
				fill: ${(props) => props.theme.colors.font.primary.alt1};
			}
		}
	}
`;

export const SearchResultInfo = styled.div`
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px10};
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-weight: ${(props) => props.theme.typography.weight.medium};
	color: ${(props) => props.theme.colors.font.primary.base};
	overflow: hidden;

	svg {
		height: ${CSS_DIMENSIONS.px17_5};
		width: ${CSS_DIMENSIONS.px17_5};
		flex-shrink: 0;
		path {
			fill: ${(props) => props.theme.colors.font.primary.base};
		}
	}
`;
