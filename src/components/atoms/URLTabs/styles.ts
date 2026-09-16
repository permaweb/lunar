import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	height: 100%;
	width: 100%;
`;

export const TabsHeader = styled.div<{ useFixed: boolean }>`
	width: 100%;
	display: flex;
	gap: 20px;
	align-items: center;
	justify-content: space-between;
	overflow-x: auto;
	margin: 0 0 25px 0;

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		position: relative;
		top: auto;
	}
`;

export const Tabs = styled.div`
	width: 100%;
	display: flex;
	align-items: center;
	gap: 15px;
	/* border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	padding: 0 0 5px 0; */
`;

export const Content = styled.div``;

export const Tab = styled.div<{ active: boolean }>`
	display: flex;
	justify-content: center;
	align-items: center;
	position: relative;
	/* flex: 1; */

	button {
		/* border-radius: ${STYLING.dimensions.radius.primary} !important; */
		box-shadow: none !important;
		padding: 0 13.5px 0 12.5px !important;

		/* background: transparent !important;
		border: none !important; */
		/* padding: 0 !important; */

		background: ${(props) => (props.active ? props.theme.colors.button.primary.background : 'transparent')};
		border: 1px solid
			${(props) => (props.active ? props.theme.colors.button.primary.border : props.theme.colors.border.primary)};

		&:hover {
			background: ${(props) => props.theme.colors.button.primary.background};
			border: 1px solid ${(props) => props.theme.colors.button.primary.border};
		}
		&:focus {
			background: ${(props) => props.theme.colors.button.primary.background};
			border: 1px solid ${(props) => props.theme.colors.button.primary.border};
		}

		span {
			font-size: ${(props) => props.theme.typography.size.xxxSmall} !important;
		}

		svg {
			height: 13.5px !important;
			width: 13.5px !important;
		}

		/* flex: 1; */
	}
`;

export const ActiveIndicator = styled.div<{ $active: boolean }>`
	height: 2.25px;
	width: 100%;
	border-top: 2.25px solid ${(props) => props.theme.colors.border.alt5};
	position: absolute;
	bottom: -5px;
	pointer-events: none;
	transform: scaleX(${(props) => (props.$active ? 1 : 0)});
	transform-origin: center;
	transition: transform 0.15s ease;
	border-radius: ${STYLING.dimensions.radius.primary};

	button:not(:disabled):hover + &,
	button:not(:disabled):focus-visible + & {
		transform: scaleX(1);
	}

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`;

export const EndWrapper = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 15px;
	/* flex: 1; */

	button {
		min-width: 160px;
		border-radius: ${STYLING.dimensions.radius.primary} !important;
		/* flex: 1; */
	}
`;

export const View = styled.div`
	height: 100%;
	width: 100%;
	position: relative;
`;
