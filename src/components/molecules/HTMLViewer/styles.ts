import styled from 'styled-components';

import { CSS_COLORS, CSS_DIMENSIONS } from 'helpers/themes';

export const Container = styled.div<{ $fixedHeight?: number; $fullScreenMode?: boolean }>`
	height: ${(props) => (props.$fullScreenMode ? '100vh' : `${props.$fixedHeight ?? 600}px`)};
	width: ${(props) => (props.$fullScreenMode ? '100vw' : '100%')};
	display: flex;
	flex-direction: column;
	overflow: hidden;
	z-index: ${(props) => (props.$fullScreenMode ? '999' : 'auto')};
`;

export const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: ${CSS_DIMENSIONS.px15};
	padding: ${CSS_DIMENSIONS.px15} ${CSS_DIMENSIONS.px15} ${CSS_DIMENSIONS.px12_5} ${CSS_DIMENSIONS.px15};

	p {
		color: ${(props) => props.theme.colors.font.primary};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		font-size: ${(props) => props.theme.typography.size.lg};
	}
`;

export const Frame = styled.iframe`
	min-height: 0;
	width: 100%;
	flex: 1;
	border: 0;
	background: ${CSS_COLORS.htmlCanvas};
`;
