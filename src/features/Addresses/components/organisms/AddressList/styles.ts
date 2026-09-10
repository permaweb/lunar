import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Container = styled.div`
	scroll-margin-top: 80px;
	display: flex;
	flex-direction: column;
`;

export const Header = styled.div`
	padding: 15px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 40px;
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-bottom: 0;
	border-top-right-radius: ${STYLING.dimensions.radius.alt1};
	border-top-left-radius: ${STYLING.dimensions.radius.alt1};

	@media (max-width: ${STYLING.cutoffs.tablet}) {
		align-items: flex-start;
		flex-direction: column;
		gap: 15px;
	}
`;

export const HeaderMain = styled.div`
	display: flex;
	align-items: center;
	gap: 20px;

	p {
		font-size: ${(props) => props.theme.typography.size.lg};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}

	.loader > div {
		height: fit-content;
		width: fit-content;
	}
`;

export const HeaderActions = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12.5px;
`;

export const Divider = styled.div`
	height: 20px;
	width: 1px;
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		display: none;
	}
`;

export const PageCounter = styled.div`
	display: flex;
	align-items: center;
	gap: 7.5px;

	p {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const Table = styled.div`
	width: 100%;
	overflow-x: auto;
	background: ${(props) => props.theme.colors.container.primary.background};
`;

export const TableHeader = styled.div`
	height: 40px;
	min-width: 960px;
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
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

export const TableBody = styled.div`
	width: 100%;
	min-width: 960px;

	> *:last-child {
		border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	}
`;

export const TableRow = styled.div`
	height: 40px;
	position: relative;
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	align-items: center;
	gap: 15px;
	padding: 0 15px;
	border-left: 1px solid ${(props) => props.theme.colors.border.primary};
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	background: ${(props) => props.theme.colors.container.primary.background};
	transition: all 75ms;

	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	&:hover {
		background: ${(props) => props.theme.colors.container.primary.active};
		border-color: ${(props) => props.theme.colors.border.alt4};
		box-shadow: inset 0 1px 0 ${(props) => props.theme.colors.border.alt4};
	}
`;

export const AddressColumn = styled.div`
	min-width: 0;
	width: 100%;
	display: flex;
	align-items: center;
`;

export const BalanceColumn = styled.div`
	min-width: 0;
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: flex-start;

	p {
		text-align: left;
	}
`;

export const ValueColumn = styled.div`
	min-width: 0;
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: flex-start;
`;

export const LastTransactionColumn = styled.div`
	min-width: 0;
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: flex-end;
`;

export const UpdateWrapper = styled.div`
	padding: 0 15px 15px;
	border-left: 1px solid ${(props) => props.theme.colors.border.primary};
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};
	background: ${(props) => props.theme.colors.container.primary.background};

	p {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		text-transform: uppercase;
	}
`;

export const ErrorStatus = styled.div`
	padding: 10px 15px;
	border-left: 1px solid ${(props) => props.theme.colors.border.primary};
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};
	background: ${(props) => props.theme.colors.container.primary.background};

	p {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.negative1};
	}
`;

export const Footer = styled.div<{ $borderTop: boolean }>`
	width: 100%;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	justify-content: space-between;
	gap: 15px;
	padding: 15px;
	background: ${(props) => props.theme.colors.container.alt1.background};
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-top: 1px solid ${(props) => (props.$borderTop ? props.theme.colors.border.primary : 'transparent')};
	border-bottom-left-radius: ${STYLING.dimensions.radius.alt1};
	border-bottom-right-radius: ${STYLING.dimensions.radius.alt1};
`;
