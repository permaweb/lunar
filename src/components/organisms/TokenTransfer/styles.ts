import styled from 'styled-components';

import { PrimitiveButton } from 'components/atoms/PrimitiveButton';

export const Amount = styled.div`
	display: flex;
	align-items: center;
	gap: 5px;

	p {
		font-size: ${(props) => props.theme.typography.size.small};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		text-align: left;
		text-transform: none;
	}

	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		text-align: center;
		text-transform: uppercase;
	}
`;

export const Logo = styled.div<{ $size: number; $margin: string }>`
	div {
		margin: 0 0 0 1.5px;
	}

	svg {
		height: ${(props) => `${props.$size}px`};
		width: ${(props) => `${props.$size}px`};
		color: ${(props) => props.theme.colors.font.primary};
		fill: ${(props) => props.theme.colors.font.primary};
		margin: ${(props) => props.$margin};

		path {
			color: ${(props) => props.theme.colors.font.primary};
			fill: ${(props) => props.theme.colors.font.primary};
		}
	}

	img {
		height: 15px;
		width: 15px;
		object-fit: contain;
		margin: 6.5px 2.5px 0px 0;
	}
`;

// The status text and its indicator stay on one line; the panel item supplies the label and text styles.
export const Status = styled.div`
	display: flex;
	align-items: center;
	gap: 7.5px;
`;

export const Results = styled(PrimitiveButton)`
	color: ${(props) => props.theme.colors.link.color};
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	max-width: 100%;

	&:hover:not(:disabled) {
		color: ${(props) => props.theme.colors.link.active};
		text-decoration: underline;
		text-decoration-thickness: 1.25px;
	}

	&:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 3px;
	}

	&:disabled {
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;
