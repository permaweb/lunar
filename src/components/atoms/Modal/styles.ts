import styled from 'styled-components';

import { open, transition2 } from 'helpers/animations';
import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div<{ $top: number; $noHeader: boolean }>`
	min-height: 100vh;
	height: 100%;
	width: 100%;
	position: fixed;
	z-index: 15;
	top: 0;
	left: 0;
	background: ${(props) => props.theme.colors.overlay.primary};
	animation: ${open} ${transition2};
`;

export const Container = styled.div<{
	$noHeader: boolean;
	width?: number;
}>`
	width: ${(props) => (props.width ? `${props.width}px` : `${CSS_DIMENSIONS.px650}`)};
	max-width: ${(props) => (props.$noHeader ? '100%' : '90vw')};
	background: ${(props) => (props.$noHeader ? 'transparent' : props.theme.colors.container.alt1.background)};
	border: ${CSS_DIMENSIONS.px1_25} solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.alt1};
	margin: ${CSS_DIMENSIONS.px20} auto;
`;

export const Panel = styled.div<{
	$noHeader: boolean;
	width?: number;
}>`
	height: 100vh;
	width: ${(props) => (props.width ? `${props.width}px` : `${CSS_DIMENSIONS.px650}`)};
	max-width: 90vw;
	position: fixed;
	top: 0;
	right: 0;
	background: ${(props) => (props.$noHeader ? 'transparent' : props.theme.colors.container.alt1.background)};
	border: none !important;
	border-left: ${CSS_DIMENSIONS.px1_25} solid ${(props) => props.theme.colors.border.primary} !important;
	border-radius: 0 !important;

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		width: 100%;
		max-width: 100%;
		border-left: none !important;
	}
`;

export const Header = styled.div`
	height: ${CSS_DIMENSIONS.px65};
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 ${CSS_DIMENSIONS.px20};
`;

export const LT = styled.div`
	max-width: 75%;
	display: flex;
	align-items: center;
`;

export const Title = styled.p`
	color: ${(props) => props.theme.colors.font.primary};
	font-size: ${(props) => props.theme.typography.size.lg};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	line-height: calc(${(props) => props.theme.typography.size.lg} + ${CSS_DIMENSIONS.px5});
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	margin: ${CSS_DIMENSIONS.px2_5} 0 0 0;
`;

export const Close = styled.div`
	padding: ${CSS_DIMENSIONS.px2_5} 0 0 0;
`;

export const Body = styled.div`
	max-height: calc(100dvh - ${CSS_DIMENSIONS.px110});
	width: 100%;
	scrollbar-color: transparent transparent;
`;

export const PanelBody = styled(Body)`
	height: calc(100dvh - ${CSS_DIMENSIONS.px65});
	max-height: calc(100dvh - ${CSS_DIMENSIONS.px65});
`;
