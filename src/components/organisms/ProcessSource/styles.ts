import styled from 'styled-components';

import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div`
	height: calc(100vh - ${CSS_DIMENSIONS.px190});
	width: 100%;
	scroll-margin-top: ${CSS_DIMENSIONS.px120};
`;
