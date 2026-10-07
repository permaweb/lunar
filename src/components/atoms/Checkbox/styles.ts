import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Option = styled.label<{ $active: boolean; $disabled: boolean }>`
	display: flex;
	align-items: flex-start;
	gap: 10px;
	padding: 10px 12px;
	background: ${(props) =>
		props.$disabled
			? props.theme.colors.form.disabled.background
			: props.$active
			? props.theme.colors.container.primary.active
			: props.theme.colors.container.primary.background};
	border: 1px solid
		${(props) =>
			props.$disabled
				? props.theme.colors.form.disabled.border
				: props.$active
				? props.theme.colors.border.alt1
				: props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.alt2};
	cursor: ${(props) => (props.$disabled ? 'default' : 'pointer')};
	transition: all 100ms;
	&:hover {
		background: ${(props) =>
			props.$disabled ? props.theme.colors.form.disabled.background : props.theme.colors.container.primary.active};
		border-color: ${(props) =>
			props.$disabled ? props.theme.colors.form.disabled.border : props.theme.colors.border.alt2};
	}
	> div:first-child {
		flex: none;
		margin-top: 3.5px;
	}
	&& span,
	&& p {
		${(props) => props.$disabled && `color: ${props.theme.colors.button.primary.disabled.color};`}
	}
`;

export const OptionText = styled.div`
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 3px;
	span {
		color: ${(props) => props.theme.colors.font.primary};
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		font-family: ${(props) => props.theme.typography.family.primary};
		line-height: 1.35;
	}
	p {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		font-family: ${(props) => props.theme.typography.family.primary};
		line-height: 1.45;
	}
`;

export const Wrapper = styled.div<{ disabled: boolean }>`
	position: relative;
	svg {
		height: 9.5px;
		width: 9.5px;
		margin: 1.5px 0 0 0;
		position: absolute;
		top: 0;
		left: 50%;
		transform: translate(-50%, 0px);
		pointer-events: none;
		color: ${(props) =>
			props.disabled ? props.theme.colors.button.primary.disabled.color : props.theme.colors.font.light1};
		fill: ${(props) =>
			props.disabled ? props.theme.colors.button.primary.disabled.color : props.theme.colors.font.light1};
	}
`;

export const Input = styled.input`
	appearance: none;
	margin: 0;
	padding: 0;
	background: ${(props) =>
		props.checked ? props.theme.colors.checkbox.active.background : props.theme.colors.checkbox.background};
	border: 1px solid ${(props) => (props.checked ? props.theme.colors.indicator.active : props.theme.colors.border.alt1)};
	border-radius: 1.5px;
	height: 12.5px;
	width: 12.5px;
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background: ${(props) =>
			props.checked
				? props.theme.colors.checkbox.active.background
				: props.disabled
				? props.theme.colors.checkbox.disabled
				: props.theme.colors.checkbox.hover};
		cursor: pointer;
	}

	&:focus {
		background: ${(props) =>
			props.checked
				? props.theme.colors.checkbox.active.background
				: props.disabled
				? props.theme.colors.checkbox.disabled
				: props.theme.colors.checkbox.hover};
		cursor: pointer;
	}

	&:disabled {
		background: ${(props) => props.theme.colors.checkbox.disabled};
		border: 1px solid ${(props) => props.theme.colors.checkbox.disabled};
		cursor: default;
	}
`;
