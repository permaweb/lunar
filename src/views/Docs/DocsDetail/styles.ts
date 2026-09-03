import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	height: 100%;
	width: 100%;
	padding: 0 25px;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		padding: 0 15px;
	}
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
	flex: 1;
	padding: 25px 0 25px 45px;
	display: flex;
	flex-direction: column;
	gap: 25px;
	position: relative;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		width: 100%;
		left: 0;
		padding: calc(${STYLING.dimensions.nav.height} + 20px) 0;
	}
`;
