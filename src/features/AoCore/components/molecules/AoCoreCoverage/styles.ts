import styled from 'styled-components';

import { PrimitiveButton } from 'components/atoms/PrimitiveButton';
import { BlockListStyles } from 'components/molecules/BlockList';

export const Header = styled(BlockListStyles.Header)`
	border-radius: 0;
	padding: 15px 15px 7.5px 15px;
	background: ${(props) => props.theme.colors.container.primary.background};
	h4 {
		margin: 0;
		overflow-wrap: anywhere;
	}
`;

export const Actions = BlockListStyles.HeaderActions;

export const Page = styled.span`
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	color: ${(props) => props.theme.colors.font.alt1};
`;

export const Description = styled.p`
	padding: 0 15px 15px 15px;
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	color: ${(props) => props.theme.colors.font.alt1};
	background: ${(props) => props.theme.colors.container.primary.background};
`;

export const SelectCommitment = styled(PrimitiveButton)`
	max-width: 100%;
	min-width: 0;
	padding: 0;
	border: 0;
	background: transparent;
	color: ${(props) => props.theme.colors.link.color};
	font: inherit;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	&:hover,
	&[aria-pressed='true'] {
		text-decoration: underline;
	}
	&:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}
`;
