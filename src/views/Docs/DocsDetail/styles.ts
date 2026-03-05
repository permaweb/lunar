import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	height: 100%;
	width: 100%;
`;

export const BodyWrapper = styled.div`
	width: 100%;
	display: flex;
	position: relative;
	@media (max-width: ${STYLING.cutoffs.initial}) {
		flex-direction: column;
	}
`;

export const ContentWrapper = styled.div`
	width: calc(100% - ${STYLING.dimensions.nav.width});
	max-width: 1200px;
	padding: 45px 80px 25px 80px;
	display: flex;
	flex-direction: column;
	left: calc(${STYLING.dimensions.nav.width} - 120px);
	gap: 25px;
	position: relative;
	margin: 0 auto;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		width: 100%;
		left: 0;
		padding: calc(${STYLING.dimensions.nav.height} + 20px) 20px;
	}
`;
