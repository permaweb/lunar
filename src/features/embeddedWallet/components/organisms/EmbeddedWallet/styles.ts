import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Error = styled.p<{ $visible: boolean }>`
	position: fixed;
	z-index: 30;
	top: ${STYLING.dimensions.embeddedWallet.viewportPadding};
	right: ${STYLING.dimensions.embeddedWallet.viewportPadding};
	width: min(390px, calc(100vw - ${STYLING.dimensions.embeddedWallet.viewportPaddingTotal}));
	box-sizing: border-box;
	padding: ${STYLING.dimensions.embeddedWallet.errorPadding};
	background: ${(props) => props.theme.colors.container.alt1.background};
	border: ${STYLING.dimensions.embeddedWallet.border} solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.primary};
	color: ${(props) => props.theme.colors.font.primary};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-size: ${(props) => props.theme.typography.size.small};
	opacity: ${(props) => (props.$visible ? 1 : 0)};
	visibility: ${(props) => (props.$visible ? 'visible' : 'hidden')};
	pointer-events: ${(props) => (props.$visible ? 'auto' : 'none')};
	transition: opacity 100ms ease;
`;
