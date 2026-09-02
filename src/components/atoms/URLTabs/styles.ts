import styled from 'styled-components';

import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div`
	height: 100%;
	width: 100%;
`;

export const TabsHeader = styled.div<{ useFixed: boolean }>`
	width: 100%;
	display: flex;
	gap: ${CSS_DIMENSIONS.px20};
	align-items: center;
	justify-content: space-between;
	overflow-x: auto;
	margin: 0 0 ${CSS_DIMENSIONS.px25} 0;

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		position: relative;
		top: auto;
	}
`;

export const Tabs = styled.div`
	width: 100%;
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px20};
`;

export const Content = styled.div``;

export const Tab = styled.div<{ active: boolean }>`
	display: flex;
	justify-content: center;
	align-items: center;
	position: relative;
	flex: 1;

	button {
		border-radius: ${STYLING.dimensions.radius.primary} !important;
		box-shadow: none !important;
		flex: 1;
	}
`;

export const EndWrapper = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px15};
	flex: 1;

	button {
		min-width: ${CSS_DIMENSIONS.px160};
		border-radius: ${STYLING.dimensions.radius.primary} !important;
		flex: 1;
	}
`;

export const View = styled.div`
	height: 100%;
	width: 100%;
	position: relative;
`;
