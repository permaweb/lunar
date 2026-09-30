import styled from 'styled-components';

import { STYLING } from 'helpers/config';

import { Placeholder } from '../Metrics/styles';

export const TotalsWrapper = styled.div`
	width: 100%;
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 16px;

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		grid-template-columns: 1fr;
	}
`;

export const TotalCard = styled.article`
	min-width: 0;
	min-height: 120px;
	padding: 14px;
	display: flex;
	flex-direction: column;
	justify-content: center;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		padding: 20px;
	}

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		padding: 16px;
	}
`;

export const TotalIcon = styled.div`
	width: 30px;
	height: 30px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 17px;
	color: ${(props) => props.theme.colors.font.alt1};
	background: ${(props) => props.theme.colors.container.alt2.background};
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.alt2};
`;

export const TotalLabel = styled.div`
	min-height: 20px;
	display: flex;
	align-items: center;

	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const TotalValue = styled.div`
	margin-top: 7.5px;
	display: flex;
	align-items: center;

	strong {
		font-size: ${(props) => props.theme.typography.size.lg};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		line-height: 1.05;
		color: ${(props) => props.theme.colors.font.primary};
		overflow-wrap: anywhere;
	}
`;

export const TotalPlaceholder = styled(Placeholder)`
	height: 120px;
`;
