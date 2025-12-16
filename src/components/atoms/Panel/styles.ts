import styled from 'styled-components';

import { open, transition2 } from 'helpers/animations';
import { STYLING } from 'helpers/config';

export const PanelOverlay = styled.div<{ open: boolean }>`
	height: 100vh;
	width: 100%;
	position: fixed;
	z-index: 2147483646;
	top: 0;
	left: 0;
	background: ${(props) => props.theme.colors.overlay.primary};
	animation: ${open} ${transition2};
	display: ${(props) => (props.open ? 'block' : 'none')};
`;

export const Container = styled.div<{
	open: boolean;
	noHeader: boolean;
	width?: number;
}>`
	height: calc(100dvh - 20px);
	width: ${(props) => (props.width ? `${props.width.toString()}px` : 'fit-content')};
	max-width: calc(100vw - 20px);
	position: fixed;
	z-index: 2147483647;
	overflow: hidden;
	top: 10px;
	right: 10px;
	transform: translateX(${(props) => (props.open ? '0' : '105%')});
	transition: transform ${transition2};
	border-radius: ${STYLING.dimensions.radius.primary} !important;
	box-shadow: none !important;
	@media (max-width: ${STYLING.cutoffs.secondary}) {
		min-width: 82.5vw;
	}
`;

export const Header = styled.div`
	height: 65px;
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 20px;
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
	line-height: calc(${(props) => props.theme.typography.size.lg} + 5px);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	margin: 2.5px 0 0 0;
`;

export const Close = styled.div`
	padding: 2.5px 0 0 0;
`;

export const Body = styled.div<{ hasOverflow?: boolean }>`
	height: calc(100% - 85px);
	width: 100%;
	position: relative;
	transition: padding 100ms;
	padding: 2.5px ${(props) => (props.hasOverflow ? '20px' : '0')} 0 0;
`;

export const BodyContent = styled.div`
	height: 100%;
	width: 100%;
`;
