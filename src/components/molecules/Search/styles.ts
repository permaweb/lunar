import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const SearchWrapper = styled.div<{ compact?: boolean }>`
	position: relative;
	width: ${(props) => (props.compact ? '450px' : '100%')};
	display: flex;
	flex-direction: column;
`;

export const SearchInputWrapper = styled.div`
	position: relative;
	height: 36.5px;
	width: 100%;
	display: flex;
	align-items: center;
	gap: 5px;

	> svg:first-child {
		position: absolute;
		left: 12px;
		min-height: 15px;
		min-width: 15px;
		height: 15px;
		width: 15px;
		z-index: 1;
		pointer-events: none;

		path {
			fill: ${(props) => props.theme.colors.font.alt1};
		}
	}
`;

export const SearchOutputWrapper = styled.div`
	width: 100%;
	min-width: 300px;
	max-width: 500px;
	position: absolute;
	top: 42px;
	left: 0;
	z-index: 10;
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.alt3};
	background: ${(props) => props.theme.colors.container.primary.background};
	box-shadow: 0 5px 15px 0 ${(props) => props.theme.colors.shadow.primary};
`;

export const SearchOutputPlaceholder = styled.div`
	padding: 20px;
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
		padding: 12.5px 15px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		text-decoration: none;

		&:hover {
			background: ${(props) => props.theme.colors.container.primary.hover};
		}

		> svg:last-child {
			height: 15px;
			width: 15px;
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
	gap: 10px;
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-weight: ${(props) => props.theme.typography.weight.medium};
	color: ${(props) => props.theme.colors.font.primary.base};
	overflow: hidden;

	svg {
		height: 17.5px;
		width: 17.5px;
		flex-shrink: 0;
		path {
			fill: ${(props) => props.theme.colors.font.primary.base};
		}
	}
`;
