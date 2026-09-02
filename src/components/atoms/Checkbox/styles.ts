import styled from 'styled-components';

import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div<{ disabled: boolean }>`
	position: relative;
	svg {
		height: ${CSS_DIMENSIONS.px9_5};
		width: ${CSS_DIMENSIONS.px9_5};
		margin: ${CSS_DIMENSIONS.px1_5} 0 0 0;
		position: absolute;
		top: 0;
		left: 50%;
		transform: translate(-50%, ${CSS_DIMENSIONS.px0});
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
	border: ${CSS_DIMENSIONS.px1} solid
		${(props) => (props.checked ? props.theme.colors.border.alt2 : props.theme.colors.border.alt1)};
	border-radius: ${CSS_DIMENSIONS.px1_5};
	height: ${CSS_DIMENSIONS.px12_5};
	width: ${CSS_DIMENSIONS.px12_5};
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
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.checkbox.disabled};
		cursor: default;
	}
`;
