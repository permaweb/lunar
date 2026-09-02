import styled from 'styled-components';

import { PrimitiveButton } from 'components/atoms/PrimitiveButton';
import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Container = styled.div`
	width: 100%;
	display: flex;
	justify-content: space-between;
	gap: ${CSS_DIMENSIONS.px40};
	position: relative;
`;

export const TableOfContents = styled.aside`
	height: fit-content;
	width: ${CSS_DIMENSIONS.px240};
	position: sticky;
	top: ${CSS_DIMENSIONS.px100};
	align-self: flex-start;
	max-height: calc(100vh - ${CSS_DIMENSIONS.px120});
	overflow-y: auto;
	order: 2;
	padding: 0 0 0 ${CSS_DIMENSIONS.px15};
	overflow-y: auto;

	@media (max-width: ${CSS_DIMENSIONS.px1024}) {
		display: none;
	}
`;

export const TOCTitle = styled.h4`
	font-size: ${(props) => props.theme.typography.size.xxSmall} !important;
	font-weight: ${(props) => props.theme.typography.weight.bold} !important;
	font-family: ${(props) => props.theme.typography.family.primary} !important;
	color: ${(props) => props.theme.colors.font.alt1} !important;
	margin: 0 0 ${CSS_DIMENSIONS.px15} 0 !important;
	color: ${(props) => props.theme.colors.font.primary} !important;
`;

export const TOCList = styled.ul`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px10};
	margin: 0 !important;
	padding: 0 0 0 ${CSS_DIMENSIONS.px15} !important;
	border-left: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
`;

export const TOCItem = styled.li<{ $active?: boolean }>`
	width: 100%;
	list-style: none !important;
	padding: 0 !important;
	margin: 0 !important;

	&::before {
		content: none !important;
	}

	a {
		width: 100%;
		display: flex;
		cursor: pointer;
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		color: ${(props) => (props.$active ? props.theme.colors.font.primary : props.theme.colors.font.alt1)};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		line-height: 1.75;
		text-align: left;
		transition: all 100ms;

		&:hover {
			color: ${(props) => props.theme.colors.font.primary};
		}
	}
`;

export const CodeBlock = styled.div`
	display: flex;
	justify-content: space-between;
	position: relative;
	margin: 0 !important;

	pre,
	code {
		padding: 0 !important;
		margin: 0 !important;
		background: ${(props) => props.theme.colors.transparent} !important;
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.transparent} !important;
		color: ${(props) => props.theme.colors.font.primary.alt1} !important;
		font-weight: ${(props) => props.theme.typography.weight.regular} !important;
		font-size: ${(props) => props.theme.typography.size.small} !important;
		border-radius: 0 !important;
		line-height: 1.5 !important;
	}

	div {
		margin: 0 !important;
	}

	button {
		margin: ${CSS_DIMENSIONS.px1_5} 0 0 ${CSS_DIMENSIONS.px10} !important;
	}
`;

export const CopyIcon = styled(PrimitiveButton)<{
	dimensions: { wrapper: number; icon: number } | undefined;
}>`
	height: ${(props) => (props.dimensions ? `${props.dimensions.wrapper.toString()}px` : `${CSS_DIMENSIONS.px32_5}`)};
	min-width: ${(props) => (props.dimensions ? `${props.dimensions.wrapper.toString()}px` : `${CSS_DIMENSIONS.px32_5}`)};
	display: flex;
	justify-content: center;
	align-items: center;
	padding: ${CSS_DIMENSIONS.px2_5} 0 0 0;
	background: ${(props) => props.theme.colors.button.alt1.background};
	border-radius: ${STYLING.dimensions.radius.primary};
	position: relative;

	border: none;
	padding: 0;
	font: inherit;

	&:focus {
		outline: none;
		svg {
			opacity: ${(props) => (props.disabled ? '1' : '0.75')};
		}
	}

	&:hover {
		background: ${(props) => props.theme.colors.button.alt1.hover};
	}

	svg {
		height: ${(props) => (props.dimensions ? `${props.dimensions.icon.toString()}px` : `${CSS_DIMENSIONS.px17_5}`)};
		width: ${(props) => (props.dimensions ? `${props.dimensions.icon.toString()}px` : `${CSS_DIMENSIONS.px17_5}`)};
		fill: ${(props) => props.theme.colors.button.alt1.label};
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);

		&:hover {
			cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
			opacity: 1;
		}
	}

	&:disabled {
		background: ${(props) => props.theme.colors.button.alt1.disabled.background};
		color: ${(props) => props.theme.colors.button.alt1.disabled.label};
		svg {
			fill: ${(props) => props.theme.colors.button.alt1.disabled.label};
		}
	}
`;
