import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 44px;
	padding-bottom: 25px;
	@media (max-width: ${STYLING.cutoffs.secondary}) {
		gap: 32px;
	}
`;
export const Section = styled.section`
	display: flex;
	flex-direction: column;
	gap: 24px;
`;
export const NetworkSection = styled.section`
	display: flex;
	flex-direction: column;
	gap: 20px;
	& + & {
		margin-top: 16px;
	}
`;
export const Status = styled.div`
	display: flex;
	align-items: center;
	gap: 15px;
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	color: ${(props) => props.theme.colors.font.alt1};
`;

export const TablesWrapper = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 20px;
	@media (max-width: ${STYLING.cutoffs.tablet}) {
		grid-template-columns: minmax(0, 1fr);
	}
`;
