import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	height: fit-content;
	width: 100%;
	position: relative;
	width: 315px;
	max-width: 90vw;
`;

export const Label = styled.div<{ disabled: boolean }>`
	margin: 0 0 5px 0;
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
	padding: 0 12.5px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: ${(props) =>
		props.active ? props.theme.colors.button.primary.active.background : props.theme.colors.button.primary.background};
	border: 1px solid ${(props) => (props.active ? props.theme.colors.border.primary : props.theme.colors.border.primary)};
	border-radius: ${STYLING.dimensions.radius.alt2};
	transition: all 100ms;
	&:hover {
		background: ${(props) => props.theme.colors.button.primary.active.background};
		border: 1px solid ${(props) => props.theme.colors.button.primary.active.border};
		span {
			color: ${(props) => props.theme.colors.font.light1} !important;
		}
		svg {
			color: ${(props) => props.theme.colors.font.light1} !important;
		}
	}
	&:focus {
		background: ${(props) => props.theme.colors.button.primary.active.background};
		border: 1px solid ${(props) => props.theme.colors.button.primary.active.border};
		span {
			color: ${(props) => props.theme.colors.font.light1} !important;
		}
		svg {
			color: ${(props) => props.theme.colors.font.light1} !important;
		}
	}
	&:disabled {
		background: ${(props) => props.theme.colors.button.primary.disabled.background};
		border: 1px solid ${(props) => props.theme.colors.button.primary.disabled.border};
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
		height: 15px;
		width: 15px;
		margin: 5px 0 0 0;
		transform: rotate(0deg);
		color: ${(props) =>
			props.active ? props.theme.colors.font.light1 : props.theme.colors.button.primary.color} !important;
	}
`;

export const Options = styled.ul`
	width: 100%;
	position: absolute;
	top: 42.5px;
	z-index: 4;
	overflow: hidden;
	background: ${(props) => props.theme.colors.container.alt8.background};
	border-radius: ${STYLING.dimensions.radius.alt2};
	box-shadow: ${(props) => props.theme.colors.container.alt11.background} 0px 1px 2px 0.5px;
`;

export const Option = styled.li<{ active: boolean }>`
	text-align: center;
	height: calc(${STYLING.dimensions.form.small} + 2px);
	display: flex;
	align-items: center;
	cursor: ${(props) => (props.active ? 'default' : 'pointer')};
	pointer-events: ${(props) => (props.active ? 'none' : 'all')};
	color: ${(props) => (props.active ? props.theme.colors.font.light1 : props.theme.colors.font.light1)};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	background: ${(props) =>
		props.active ? props.theme.colors.container.alt9.background : props.theme.colors.container.alt8.background};
	border: 1px solid transparent;
	padding: 0 15px;
	transition: all 100ms;
	&:hover {
		color: ${(props) => props.theme.colors.font.light1};
		background: ${(props) => props.theme.colors.container.alt9.background};
	}
`;
