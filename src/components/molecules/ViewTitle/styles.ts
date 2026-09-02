import styled from 'styled-components';

import { CSS_DIMENSIONS } from 'helpers/themes';

export const HeaderWrapper = styled.div`
	width: 100%;
	margin: ${CSS_DIMENSIONS.px13_5} 0 ${CSS_DIMENSIONS.px35_5} 0;
`;

export const HeaderContent = styled.div`
	width: 100%;
	display: flex;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: ${CSS_DIMENSIONS.px30} ${CSS_DIMENSIONS.px40};

	h4 {
		line-height: 1;
		font-size: ${(props) => props.theme.typography.size.xxLg};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		letter-spacing: ${CSS_DIMENSIONS.px0_5};
	}
`;

export const HeaderActions = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: ${CSS_DIMENSIONS.px20};
`;
