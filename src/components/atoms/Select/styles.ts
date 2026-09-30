import styled, { css } from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div<{ $plain?: boolean }>`
	height: fit-content;
	width: 100%;
	position: relative;
	width: ${(props) => (props.$plain ? 'fit-content' : '315px')};
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

export const Dropdown = styled.button<{ active: boolean; $plain?: boolean }>`
	height: ${STYLING.dimensions.form.small};
	width: 100%;
	text-align: left;
	padding: 0 12.5px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	background: ${(props) =>
		props.active ? props.theme.colors.button.primary.active.background : props.theme.colors.button.primary.background};
	border: 1px solid
		${(props) =>
			props.active ? props.theme.colors.button.primary.active.border : props.theme.colors.button.primary.border};
	border-radius: ${STYLING.dimensions.radius.primary};
	transition: all 100ms;
	&:hover,
	&:focus {
		background: ${(props) => props.theme.colors.button.primary.active.background};
		border: 1px solid ${(props) => props.theme.colors.button.primary.active.border};
		span,
		svg {
			color: ${(props) => props.theme.colors.button.primary.active.color} !important;
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
		white-space: nowrap;
		font-family: ${(props) => props.theme.typography.family.primary} !important;
		font-size: ${(props) => props.theme.typography.size.xxSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		letter-spacing: 0.5px;
		color: ${(props) =>
			props.active
				? props.theme.colors.button.primary.active.color
				: props.theme.colors.button.primary.color} !important;
	}

	svg {
		height: 17px;
		width: 17px;
		color: ${(props) =>
			props.active
				? props.theme.colors.button.primary.active.color
				: props.theme.colors.button.primary.color} !important;
	}

	/* Chromeless trigger for headers: the label alone carries the control, so only its color reacts. */
	${(props) =>
		props.$plain &&
		`
		height: fit-content;
		width: fit-content;
		gap: 5px;
		padding: 0;
		justify-content: flex-start;
		background: transparent !important;
		border: none !important;

		span,
		svg {
			color: ${props.active ? props.theme.colors.font.primary : props.theme.colors.font.alt1} !important;
		}

		svg {
			height: 15px;
			width: 15px;
		}

		&:hover,
		&:focus {
			background: transparent !important;
			border: none !important;

			span,
			svg {
				color: ${props.theme.colors.font.primary} !important;
			}
		}
	`}
`;

export const dropdownSurfaceStyles = css`
	min-width: 100%;
	max-width: 90vw;
	max-height: 248px;
	position: absolute;
	z-index: 4;
	display: flex;
	flex-direction: column;
	gap: 5px;
	padding: 4px;
	overflow-y: auto;
	list-style: none;
	background: ${(props) => props.theme.colors.view.background};
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.primary};
	box-shadow: 0 10px 30px ${(props) => props.theme.colors.shadow.primary};
`;

export const Options = styled.ul<{ $top?: number; $plain?: boolean }>`
	${dropdownSurfaceStyles}
	width: ${(props) => (props.$plain ? 'max-content' : '100%')};
	${(props) => props.$plain && 'right: 0;'}
	top: ${(props) => (props.$top ? `${props.$top.toString()}px` : 'calc(100% + 5px)')};
`;

export const dropdownItemStyles = css<{ $active?: boolean }>`
	min-height: 34px;
	display: flex;
	flex: none;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	padding: 0 4px 0 10px;
	text-align: left;
	cursor: pointer;
	color: ${(props) => (props.$active ? props.theme.colors.font.primary : props.theme.colors.font.alt1)};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	background: ${(props) => (props.$active ? props.theme.colors.container.primary.active : 'transparent')};
	border: none;
	border-radius: ${STYLING.dimensions.radius.alt2};
	transition: background 100ms;

	&:not(:disabled):hover,
	&:focus-visible {
		background: ${(props) => props.theme.colors.container.primary.active};
	}
`;

export const Option = styled.li<{ $active: boolean }>`
	${dropdownItemStyles}
`;

export const OptionLabel = styled.span`
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

export const RemoveOption = styled.button`
	height: 24px;
	width: 24px;
	min-width: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	border-radius: ${STYLING.dimensions.radius.alt2};
	background: transparent;
	color: ${(props) => props.theme.colors.font.alt1};
	transition: all 100ms;

	div {
		height: 12px;
		width: 12px;
	}

	svg {
		height: 12px;
		width: 12px;
		color: currentColor;
	}

	&:hover {
		cursor: pointer;
		color: ${(props) => props.theme.colors.font.primary};
		background: ${(props) => props.theme.colors.button.primary.active.background};
	}
`;
