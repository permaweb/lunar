import styled from 'styled-components';

export const Group = styled.div`
	display: inline-flex;
	align-items: center;
	min-height: 30.5px;
	padding: 2px;
	gap: 1px;
	border-radius: 36px;
	background: ${(props) => props.theme.colors.button.primary.background};
	border: 1px solid ${(props) => props.theme.colors.button.primary.border};
`;
export const Option = styled.label<{ $disabled?: boolean }>`
	position: relative;
	cursor: ${(props) => (props.$disabled ? 'default' : 'pointer')};
`;
export const Label = styled.span`
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	height: 25px;
	padding: 0 10px;
	border-radius: 20px;
	font-family: ${(props) => props.theme.typography.family.primary};
	font-size: ${(props) => props.theme.typography.size.xxxSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	color: ${(props) => props.theme.colors.button.primary.color};
	white-space: nowrap;
	transition: all 100ms;
`;
export const Input = styled.input`
	position: absolute;
	width: 1px;
	height: 1px;
	opacity: 0;
	&:checked + ${Label}, &:not(:disabled) + ${Label}:hover {
		background: ${(props) => props.theme.colors.button.primary.active.background};
		border-color: ${(props) => props.theme.colors.button.primary.active.border};
		color: ${(props) => props.theme.colors.button.primary.active.color};
	}
	&:disabled + ${Label} {
		background: ${(props) => props.theme.colors.button.primary.disabled.background};
		border-color: ${(props) => props.theme.colors.button.primary.disabled.border};
		color: ${(props) => props.theme.colors.button.primary.disabled.color};
	}
	&:focus-visible + ${Label} {
		outline: 2px solid ${(props) => props.theme.colors.border.alt4};
		outline-offset: 2px;
	}
`;
