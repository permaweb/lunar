import styled from 'styled-components';

export const Link = styled.a`
	display: inline-flex;
	align-items: center;
	vertical-align: middle;
	gap: 6.5px;
	color: ${(props) => props.theme.colors.link.color};
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	text-decoration: none;
	white-space: nowrap;
	&& > span {
		color: inherit;
	}
	&:hover {
		color: ${(props) => props.theme.colors.link.active};
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
