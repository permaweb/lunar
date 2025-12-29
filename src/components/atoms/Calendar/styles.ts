import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const CalendarWrapper = styled.div`
	width: 100%;
	background: ${(props) => props.theme.colors.container.primary.background};
	user-select: none;
`;

export const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20px;
`;

export const NavButton = styled.button`
	background: none;
	border: none;
	font-size: 20px;
	cursor: pointer;
	color: ${(props) => props.theme.colors.font.primary};
	width: 30px;
	height: 30px;
	padding: 0 0 2.5px 0;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: ${STYLING.dimensions.radius.primary};
	border: 1px solid ${(props) => props.theme.colors.border.alt1};

	&:hover {
		background: ${(props) => props.theme.colors.container.primary.active};
	}
`;

export const MonthYear = styled.div`
	font-size: ${(props) => props.theme.typography.size.small};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	color: ${(props) => props.theme.colors.font.primary};
`;

export const DaysHeader = styled.div`
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 20px;
	margin-bottom: 7.5px;
`;

export const DayName = styled.div`
	text-align: center;
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-weight: ${(props) => props.theme.typography.weight.medium};
	color: ${(props) => props.theme.colors.font.alt1};
	padding: 8px 0;
`;

export const DaysGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 20px;
`;

export const EmptyDay = styled.div`
	aspect-ratio: 1;
	min-height: 20px;
`;

export const Day = styled.div<{ disabled?: boolean; selected?: boolean; isToday?: boolean }>`
	aspect-ratio: 1;
	min-height: 28px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	border: 1px solid ${(props) => props.theme.colors.border.alt1};
	border-radius: ${STYLING.dimensions.radius.primary};
	cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};

	${(props) =>
		props.disabled &&
		`
		color: ${props.theme.colors.button.primary.disabled.color} !important;
		background: ${props.theme.colors.button.primary.disabled.background} !important;
	`}

	${(props) =>
		props.selected &&
		`
		background: ${props.theme.colors.button.alt1.background};
		color: ${props.theme.colors.button.alt1.color};
		font-weight: ${props.theme.typography.weight.bold};
	`}

	${(props) =>
		props.isToday &&
		!props.selected &&
		!props.disabled &&
		`
		background: ${props.theme.colors.container.alt2.background};
	`}

	${(props) =>
		!props.disabled &&
		!props.selected &&
		`
		color: ${props.theme.colors.font.primary};

		&:hover {
			background: ${props.theme.colors.container.primary.active};
		}
	`}
`;
