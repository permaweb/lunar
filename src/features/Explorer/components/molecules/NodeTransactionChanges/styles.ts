import styled from 'styled-components';

import { BlockListStyles } from 'components/molecules/BlockList';

export { Note } from '../../organisms/ArweaveNode/styles';

export const Container = styled.div`
	min-width: 0;
	align-self: start;
`;
export const Header = BlockListStyles.Header;
export const Title = styled.p`
	font-size: ${(props) => props.theme.typography.size.small};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	color: ${(props) => props.theme.colors.font.primary};
	span {
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;
export const Table = styled.table`
	width: 100%;
	table-layout: fixed;
	border-collapse: collapse;
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	th,
	td {
		height: 40px;
		padding: 10px 15px;
		text-align: left;
		border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	}
	th {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
		background: ${(props) => props.theme.colors.container.alt1.background};
	}
	td {
		font-size: ${(props) => props.theme.typography.size.xSmall};
	}
`;
export const EmptyRow = styled.tr`
	&&:hover {
		background: transparent;
		outline: none;
	}
`;
export const Footer = BlockListStyles.FooterWrapper;
