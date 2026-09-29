import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.section`
	scroll-margin-top: 90px;
`;
export const Heading = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 20px;
	margin-bottom: 20px;
	h2 {
		font-size: ${(props) => props.theme.typography.size.lg};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}
	p {
		margin-top: 8px;
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		color: ${(props) => props.theme.colors.font.alt1};
		line-height: 1.6;
	}
	@media (max-width: ${STYLING.cutoffs.tablet}) {
		align-items: flex-start;
		flex-direction: column;
	}
`;
export const Filters = styled.div`
	display: flex;
	flex-shrink: 0;
`;
export const Status = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 15px;
	padding: 36px 20px;
	text-align: center;
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	color: ${(props) => props.theme.colors.font.alt1};
`;
