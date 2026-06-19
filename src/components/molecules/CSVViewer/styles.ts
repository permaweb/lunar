import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Container = styled.div<{ $fixedHeight?: number; $fullScreenMode?: boolean }>`
	height: ${(props) => (props.$fullScreenMode ? '100vh' : `${props.$fixedHeight ?? 600}px`)};
	width: ${(props) => (props.$fullScreenMode ? '100vw' : '100%')};
	display: flex;
	flex-direction: column;
	overflow: hidden;
	z-index: ${(props) => (props.$fullScreenMode ? '999' : 'auto')};
	padding: ${(props) => (props.$fullScreenMode ? '15px' : '0')};
	background: ${(props) => (props.$fullScreenMode ? props.theme.colors.container.primary.background : 'transparent')};
`;

export const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 15px;
	padding: 0 0 12.5px 0;

	p {
		color: ${(props) => props.theme.colors.font.primary};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		font-size: ${(props) => props.theme.typography.size.lg};
	}
`;

export const ActionsWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 7.5px;
`;

export const TableWrapper = styled.div`
	min-height: 0;
	flex: 1;
	overflow: auto;
`;

export const Table = styled.table`
	width: max-content;
	min-width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.primary};
	background: ${(props) => props.theme.colors.container.primary.background};
	overflow: hidden;

	th,
	td {
		max-width: 100%;
		padding: 8px 10px;
		border-right: 1px solid ${(props) => props.theme.colors.border.primary};
		border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
		color: ${(props) => props.theme.colors.font.primary};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		line-height: 1.5;
		text-align: left;
		white-space: nowrap;

		&:last-child {
			border-right: none;
		}
	}

	th {
		position: sticky;
		top: 0;
		z-index: 1;
		background: ${(props) => props.theme.colors.container.alt1.background};
		color: ${(props) => props.theme.colors.font.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}

	tbody tr:last-child td {
		border-bottom: none;
	}
`;

export const LoadMoreWrapper = styled.div`
	display: flex;
	justify-content: center;
	padding: 15px 0 0 0;
`;

export const Placeholder = styled.p`
	color: ${(props) => props.theme.colors.font.alt1};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-size: ${(props) => props.theme.typography.size.xxxSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	text-transform: uppercase;
`;
