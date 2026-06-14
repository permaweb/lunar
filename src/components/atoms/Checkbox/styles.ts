import styled from 'styled-components';

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
	border: 1px solid
		${(props) => (props.checked ? props.theme.colors.checkbox.active.background : props.theme.colors.border.alt1)};
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
