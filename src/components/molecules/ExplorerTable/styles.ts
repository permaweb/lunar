import styled from 'styled-components';

import { STYLING } from 'helpers/config';

type TableSizing = { $columns: number; $minWidth?: number; $columnLayout?: string };

export const Table = styled.div<{ $roundedBottom?: boolean }>`
	width: 100%;
	overflow-x: auto;
	border-radius: 0 0 ${(props) => (props.$roundedBottom ? STYLING.dimensions.radius.alt1 : '0')}
		${(props) => (props.$roundedBottom ? STYLING.dimensions.radius.alt1 : '0')};
	background: ${(props) => props.theme.colors.container.primary.background};
`;

export const TableHeader = styled.div<TableSizing>`
	height: 40px;
	min-width: ${(props) => props.$minWidth ?? Math.max(960, props.$columns * 180)}px;
	display: grid;
	grid-template-columns: ${(props) => props.$columnLayout ?? `repeat(${props.$columns}, minmax(0, 1fr))`};
	align-items: center;
	gap: 15px;
	padding: 0 15px;
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	background: ${(props) => props.theme.colors.container.alt1.background};

	div,
	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const TableBody = styled.div<TableSizing & { $roundedBottom?: boolean }>`
	width: 100%;
	min-width: ${(props) => props.$minWidth ?? Math.max(960, props.$columns * 180)}px;

	> :last-child {
		border-bottom-left-radius: ${(props) => (props.$roundedBottom ? STYLING.dimensions.radius.alt1 : '0')};
		border-bottom-right-radius: ${(props) => (props.$roundedBottom ? STYLING.dimensions.radius.alt1 : '0')};
	}
`;

export const TableRow = styled.div<TableSizing & { $expanded?: boolean; $interactive?: boolean }>`
	cursor: ${(props) => (props.$interactive ? 'pointer' : 'default')};
	height: 40px;
	position: relative;
	display: grid;
	grid-template-columns: ${(props) => props.$columnLayout ?? `repeat(${props.$columns}, minmax(0, 1fr))`};
	align-items: center;
	gap: 15px;
	padding: 0 15px;
	border-left: 1px solid ${(props) => props.theme.colors.border.primary};
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	background: ${(props) => props.theme.colors.container.primary.background};
	transition: all 75ms;
	${(props) =>
		props.$expanded &&
		`
		background: ${props.theme.colors.container.alt1.background};
		border-left-color: ${props.theme.colors.border.alt4};
		border-right-color: ${props.theme.colors.border.alt4};
		box-shadow: inset 0 1px 0 ${props.theme.colors.border.alt4};
	`}

	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	&:hover,
	&:focus-visible {
		background: ${(props) => props.theme.colors.container.primary.active};
		border-color: ${(props) => props.theme.colors.border.alt4};
		box-shadow: inset 0 1px 0 ${(props) => props.theme.colors.border.alt4};
	}
`;

export const DetailsRow = styled.div`
	border-left: 1px solid ${(props) => props.theme.colors.border.alt4};
	border-right: 1px solid ${(props) => props.theme.colors.border.alt4};
	border-bottom: 1px solid ${(props) => props.theme.colors.border.alt4};
	background: ${(props) => props.theme.colors.container.alt1.background};
`;

export const DetailsCell = styled.div`
	min-width: 0;
	padding: 5px;
	border-bottom-left-radius: inherit;
	border-bottom-right-radius: inherit;
	background: ${(props) => props.theme.colors.container.alt2.background};
`;

export const Cell = styled.div<{ $align?: 'start' | 'end' }>`
	min-width: 0;
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: ${(props) => (props.$align === 'end' ? 'flex-end' : 'flex-start')};
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	color: ${(props) => props.theme.colors.font.primary};
`;

export const HeaderCell = styled(Cell)`
	gap: 7.5px;
`;

export const HeaderAction = styled.span`
	display: inline-flex;
	align-items: center;
	flex-shrink: 0;
`;
