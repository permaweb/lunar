import styled, { css } from 'styled-components';

import { OverviewStyles } from 'components/molecules/Overview';
import { STYLING } from 'helpers/config';

export const Wrapper = styled.section<{ $sectionHeader: boolean }>`
	box-sizing: border-box;
	height: 350px;
	max-height: 350px;
	min-width: 0;
	display: grid;
	grid-template-rows: auto minmax(0, 1fr);
	gap: 15px;
	padding: ${(props) => (props.$sectionHeader ? '0 0 15px' : '10px 0 15px')};
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
`;

export const Header = styled(OverviewStyles.MessageInfoHeader)<{ $sectionHeader: boolean }>`
	min-height: ${(props) => (props.$sectionHeader ? '61px' : '0')};

	> span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight[props.$sectionHeader ? 'bold' : 'medium']};
		color: ${(props) => props.theme.colors.font.alt1};
		text-align: right;
	}

	${(props) =>
		!props.$sectionHeader &&
		css`
			flex-wrap: nowrap;
			margin: 0 0 1.5px;
			padding: 0 15px 10.5px;
			border-bottom-style: dotted;
			border-radius: 0;
			background: transparent;

			p {
				font-size: ${props.theme.typography.size.small};
			}
		`}
`;

export const Columns = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	min-height: 0;
	margin: 0 15px;

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: repeat(2, minmax(0, 1fr));
	}
`;

export const Tags = styled.div`
	display: flex;
	flex-direction: column;
	gap: 7.5px;
	min-width: 0;
	min-height: 0;
	padding-right: 15px;
	overflow: auto;

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		padding: 0 0 15px;
	}
`;

export const Data = styled.div`
	width: 100%;
	min-width: 0;
	min-height: 0;
	padding-left: 15px;
	border-left: 1px solid ${(props) => props.theme.colors.border.primary};
	overflow: auto;

	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		padding: 15px 0 0;
		border-left: none;
		border-top: 1px solid ${(props) => props.theme.colors.border.primary};
	}
`;
