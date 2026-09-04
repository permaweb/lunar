import styled from 'styled-components';

import { PrimitiveButton } from 'components/atoms/PrimitiveButton';
import { STYLING } from 'helpers/config';

export * from '../styles';

export const GraphQLSourceOptions = styled.div`
	display: flex;
	gap: 10px;
`;

export const GraphQLSourceOption = styled(PrimitiveButton)`
	flex: 1;
	padding: 12px 15px;
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.alt2};
	background: ${(props) => props.theme.colors.container.primary.background};
	color: ${(props) => props.theme.colors.font.primary};
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	font-family: ${(props) => props.theme.typography.family.primary};
	transition: background 100ms, border-color 100ms;

	&[aria-pressed='true'] {
		background: ${(props) => props.theme.colors.container.alt1.background};
		border-color: ${(props) => props.theme.colors.border.alt3};
	}

	&:hover {
		background: ${(props) => props.theme.colors.container.primary.active};
		border-color: ${(props) => props.theme.colors.border.alt2};
	}

	&:focus-visible {
		outline: 2px solid ${(props) => props.theme.colors.border.alt3};
		outline-offset: 2px;
	}
`;

export const GraphQLSourceDescription = styled.p`
	color: ${(props) => props.theme.colors.font.alt1};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-family: ${(props) => props.theme.typography.family.primary};
	line-height: 1.45;
`;
