import styled from 'styled-components';

import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div`
	height: 100%;
	width: 100%;
	padding: 0 ${CSS_DIMENSIONS.px25};

	@media (max-width: ${STYLING.cutoffs.initial}) {
		padding: 0 ${CSS_DIMENSIONS.px15};
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
	padding: ${CSS_DIMENSIONS.px25} 0 ${CSS_DIMENSIONS.px25} ${CSS_DIMENSIONS.px45};
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px25};
	position: relative;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		width: 100%;
		left: 0;
		padding: calc(${STYLING.dimensions.nav.height} + ${CSS_DIMENSIONS.px20}) 0;
	}
`;
