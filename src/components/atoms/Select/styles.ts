import styled from 'styled-components';

import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div`
	height: fit-content;
	width: 100%;
	position: relative;
	width: ${CSS_DIMENSIONS.px315};
	max-width: 90vw;
`;

export const Label = styled.div<{ disabled: boolean }>`
	margin: 0 0 ${CSS_DIMENSIONS.px5} 0;
	span {
		color: ${(props) =>
			props.disabled ? props.theme.colors.button.primary.disabled.color : props.theme.colors.font.primary};
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		line-height: 1.5;
	}
`;

export const Dropdown = styled.button<{ active: boolean }>`
	height: ${STYLING.dimensions.form.small};
	width: 100%;
	text-align: left;
	padding: 0 ${CSS_DIMENSIONS.px12_5};
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: ${(props) =>
		props.active ? props.theme.colors.button.primary.active.background : props.theme.colors.button.primary.background};
	border: ${CSS_DIMENSIONS.px1} solid
		${(props) => (props.active ? props.theme.colors.border.primary : props.theme.colors.border.primary)};
	border-radius: ${STYLING.dimensions.radius.alt2};
	transition: all 100ms;
	&:hover {
		background: ${(props) => props.theme.colors.button.primary.active.background};
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.button.primary.active.border};
		span {
			color: ${(props) => props.theme.colors.font.light1} !important;
		}
		svg {
			color: ${(props) => props.theme.colors.font.light1} !important;
		}
	}
	&:focus {
		background: ${(props) => props.theme.colors.button.primary.active.background};
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.button.primary.active.border};
		span {
			color: ${(props) => props.theme.colors.font.light1} !important;
		}
		svg {
			color: ${(props) => props.theme.colors.font.light1} !important;
		}
	}
	&:disabled {
		background: ${(props) => props.theme.colors.button.primary.disabled.background};
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.button.primary.disabled.border};
		span {
			color: ${(props) => props.theme.colors.button.primary.disabled.color} !important;
		}
		svg {
			color: ${(props) => props.theme.colors.button.primary.disabled.color} !important;
		}
	}

	span {
		width: fit-content;
		text-overflow: ellipsis;
		overflow: hidden;
		font-family: ${(props) => props.theme.typography.family.primary} !important;
		font-size: ${(props) => props.theme.typography.size.xxSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		color: ${(props) =>
			props.active ? props.theme.colors.font.light1 : props.theme.colors.button.primary.color} !important;
	}

	svg {
		height: ${CSS_DIMENSIONS.px15};
		width: ${CSS_DIMENSIONS.px15};
		margin: ${CSS_DIMENSIONS.px5} 0 0 0;
		transform: rotate(0deg);
		color: ${(props) =>
			props.active ? props.theme.colors.font.light1 : props.theme.colors.button.primary.color} !important;
	}
`;

export const Options = styled.ul`
	width: 100%;
	position: absolute;
	top: ${CSS_DIMENSIONS.px42_5};
	z-index: 4;
	overflow: hidden;
	background: ${(props) => props.theme.colors.container.alt8.background};
	border-radius: ${STYLING.dimensions.radius.alt2};
	box-shadow: ${(props) => props.theme.colors.container.alt11.background} ${CSS_DIMENSIONS.px0} ${CSS_DIMENSIONS.px1}
		${CSS_DIMENSIONS.px2} ${CSS_DIMENSIONS.px0_5};
`;

export const Option = styled.li<{ active: boolean }>`
	text-align: center;
	height: calc(${STYLING.dimensions.form.small} + ${CSS_DIMENSIONS.px2});
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: ${CSS_DIMENSIONS.px10};
	cursor: pointer;
	color: ${(props) => (props.active ? props.theme.colors.font.light1 : props.theme.colors.font.light1)};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	background: ${(props) =>
		props.active ? props.theme.colors.container.alt9.background : props.theme.colors.container.alt8.background};
	border: ${CSS_DIMENSIONS.px1} solid transparent;
	padding: 0 ${CSS_DIMENSIONS.px15};
	transition: all 100ms;
	&:hover {
		color: ${(props) => props.theme.colors.font.light1};
		background: ${(props) => props.theme.colors.container.alt9.background};
	}
`;

export const OptionLabel = styled.span`
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

export const RemoveOption = styled.button`
	height: ${CSS_DIMENSIONS.px24};
	width: ${CSS_DIMENSIONS.px24};
	min-width: ${CSS_DIMENSIONS.px24};
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	border-radius: ${STYLING.dimensions.radius.alt2};
	background: transparent;
	color: ${(props) => props.theme.colors.font.light1};
	transition: all 100ms;

	div {
		height: ${CSS_DIMENSIONS.px12};
		width: ${CSS_DIMENSIONS.px12};
	}

	svg {
		height: ${CSS_DIMENSIONS.px12};
		width: ${CSS_DIMENSIONS.px12};
		color: currentColor;
	}

	&:hover {
		cursor: pointer;
		background: ${(props) => props.theme.colors.container.alt8.background};
	}
`;
