import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
`;
export const Content = styled.div`
	width: 100%;
	max-width: ${STYLING.cutoffs.max};
	padding: 0 25px;
	margin: 0 auto;
	@media (max-width: ${STYLING.cutoffs.initial}) {
		padding: 0 15px;
	}
`;
