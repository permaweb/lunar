import styled from 'styled-components';

import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div`
	min-height: 100vh;
	width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px25};
	padding: ${CSS_DIMENSIONS.px20};
`;

export const Content = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
`;

export const Header = styled.h2`
	font-size: ${CSS_DIMENSIONS.px28};
	font-family: ${(props) => props.theme.typography.family.primary};
`;

export const Divider = styled.div`
	height: ${CSS_DIMENSIONS.px25};
	width: ${CSS_DIMENSIONS.px1};
	margin: 0 ${CSS_DIMENSIONS.px22_5};
	border-right: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.alt3};
`;

export const Message = styled.p`
	font-size: ${(props) => props.theme.typography.size.base};
`;
