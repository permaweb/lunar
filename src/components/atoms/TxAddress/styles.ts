import styled from 'styled-components';

export const Wrapper = styled.div<{ disabled: boolean }>`
	display: flex;
	align-items: center;
	gap: 7.5px;
	p {
		color: ${(props) => (props.disabled ? props.theme.colors.font.alt1 : props.theme.colors.link.color)} !important;
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		max-width: 100% !important;
		transition: all 100ms;
	}

	svg {
		height: 12.5px;
		width: 12.5px;
		color: ${(props) => (props.disabled ? props.theme.colors.font.alt1 : props.theme.colors.link.color)} !important;
		fill: ${(props) => (props.disabled ? props.theme.colors.font.alt1 : props.theme.colors.link.color)} !important;
	}

	&:hover {
		cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
		p {
			color: ${(props) => (props.disabled ? props.theme.colors.font.alt1 : props.theme.colors.link.active)} !important;
		}
		svg {
			color: ${(props) => (props.disabled ? props.theme.colors.font.alt1 : props.theme.colors.link.active)} !important;
			fill: ${(props) => (props.disabled ? props.theme.colors.font.alt1 : props.theme.colors.link.active)} !important;
		}
	}
`;

export const Details = styled.div``;
