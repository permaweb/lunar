import styled from 'styled-components';

export const Link = styled.a<{ $small: boolean; $muted: boolean }>`
	display: inline-flex;
	align-items: center;
	vertical-align: middle;
	gap: 6.5px;
	color: ${(props) => (props.$muted ? props.theme.colors.font.alt1 : props.theme.colors.link.color)};
	font-size: ${(props) => (props.$small ? props.theme.typography.size.xxSmall : props.theme.typography.size.xSmall)};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	text-decoration: none;
	white-space: nowrap;
	&& > span {
		color: inherit;
	}
	&:hover {
		color: ${(props) => (props.$muted ? props.theme.colors.font.primary : props.theme.colors.link.active)};
		> span {
			text-decoration: underline;
			text-decoration-thickness: 1.25px;
		}
	}
	&:focus-visible {
		outline: 2px solid ${(props) => props.theme.colors.link.color};
		outline-offset: 3px;
	}
`;
