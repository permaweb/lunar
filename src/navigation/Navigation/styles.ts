import styled from 'styled-components';

import { open, openRight, transition2 } from 'helpers/animations';
import { STYLING } from 'helpers/config';

export const Header = styled.header<{ navigationOpen: boolean }>`
	height: ${STYLING.dimensions.nav.height};
	width: 100%;
	position: sticky;
	top: 0;
	z-index: 4;
	background: ${(props) => props.theme.colors.view.background};

	&.tabs-view {
		background: ${(props) => props.theme.colors.container.alt1.background};
		position: relative;
		box-shadow: inset 0px 6px 6px -6px ${(props) => props.theme.colors.shadow.primary};
		border-top: 0.5px solid ${(props) => props.theme.colors.border.primary};
		border-bottom: none;
	}
`;

export const Content = styled.div`
	height: 100%;
	width: 100%;

	max-width: ${STYLING.cutoffs.max};
	padding: 0 25px;
	margin: 0 auto;

	display: flex;
	align-items: center;
	justify-content: space-between;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		padding: 0 15px;
	}
`;

export const PanelOverlay = styled.div<{ open: boolean }>`
	height: 100vh;
	width: 100%;
	position: fixed;
	z-index: 3;
	top: 0;
	left: 0;
	background: ${(props) => props.theme.colors.overlay.primary};
	animation: ${open} ${transition2};
	display: none;

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		display: ${(props) => (props.open ? 'block' : 'none')};
	}
`;

export const Panel = styled.nav<{ open: boolean }>`
	height: 100vh;
	width: ${STYLING.dimensions.nav.width};
	position: fixed;
	top: 0;
	left: 0;
	z-index: 5;
	transform: translateX(${(props) => (props.open ? '0' : '-100%')});
	transition: transform ${transition2};
	background: ${(props) => props.theme.colors.container.alt1.background};
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};
`;

export const PanelHeader = styled.div`
	height: ${STYLING.dimensions.nav.height};
	width: 100%;
	display: flex;
	align-items: center;
	padding: 0 15px;
`;

export const ToggleWrapper = styled.div`
	height: ${STYLING.dimensions.nav.height};
	display: flex;
	align-items: center;
	gap: 7.5px;
`;

export const PanelContent = styled.div<{ open: boolean }>`
	height: calc(100vh - (${STYLING.dimensions.nav.height} + 70px));
	padding: 0 15px 15px 15px;

	a {
		height: 40.5px;
		display: flex;
		align-items: center;
		cursor: pointer;
		color: ${(props) => props.theme.colors.font.primary};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		border: 1px solid transparent;
		border-radius: ${STYLING.dimensions.radius.primary};
		transition: all 100ms;
		padding: 0 10px;
		svg {
			height: 17.5px;
			width: 17.5px;
			margin: 6.5px 12.5px 0 0;
			color: ${(props) => props.theme.colors.font.primary};
			fill: ${(props) => props.theme.colors.font.primary};
		}
		&:hover {
			color: ${(props) => props.theme.colors.font.primary};
			background: ${(props) => props.theme.colors.container.alt2.background};

			svg {
				color: ${(props) => props.theme.colors.font.primary};
				fill: ${(props) => props.theme.colors.font.primary};
			}
		}
	}
`;

export const PanelFooter = styled.div<{ open: boolean }>`
	height: 70px;
	width: 100%;
	padding: 15px;

	a {
		height: 40.5px;
		display: flex;
		align-items: center;
		cursor: pointer;
		color: ${(props) => props.theme.colors.font.primary};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		border: 1px solid ${(props) => props.theme.colors.border.primary};
		border-radius: ${STYLING.dimensions.radius.primary};
		transition: all 100ms;
		padding: 0 10px;
		svg {
			height: 17.5px;
			width: 17.5px;
			margin: 6.5px 12.5px 0 0;
			color: ${(props) => props.theme.colors.font.primary};
			fill: ${(props) => props.theme.colors.font.primary};
		}
		&:hover {
			color: ${(props) => props.theme.colors.font.primary};
			background: ${(props) => props.theme.colors.container.alt2.background};
			border: 1px solid ${(props) => props.theme.colors.border.alt2};

			svg {
				color: ${(props) => props.theme.colors.font.primary};
				fill: ${(props) => props.theme.colors.font.primary};
			}
		}
	}
`;

export const SearchWrapper = styled.div`
	width: 510px;
	max-width: 100%;
	position: relative;
`;

export const SearchInputWrapper = styled.div`
	width: 100%;
	position: relative;

	input {
		background: transparent;
		padding: 10px 10px 10px 43.5px !important;
	}

	svg {
		height: 15px;
		width: 15px;
		color: ${(props) => props.theme.colors.font.alt1};
		fill: ${(props) => props.theme.colors.font.alt1};
		position: absolute;
		z-index: 1;
		top: 11.5px;
		left: 14.5px;
	}
`;

export const SearchOutputWrapper = styled.div`
	width: 100%;
	position: absolute;
	top: 45px;
	overflow: hidden;

	p {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xxSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		font-family: ${(props) => props.theme.typography.family.primary} !important;
	}

	@media (max-width: ${STYLING.cutoffs.initial}) {
		position: relative;
		top: auto;
		margin: 15px 0 0 0;
	}
`;

export const SearchOutputPlaceholder = styled.div`
	padding: 20px 15px;
	background: ${(props) => props.theme.colors.container.alt1.background};
	border-radius: ${STYLING.dimensions.radius.primary};
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	p {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xxSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		font-family: ${(props) => props.theme.typography.family.primary} !important;
	}
`;

export const SearchResult = styled.div`
	a {
		height: 100%;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 15px;
		background: ${(props) => props.theme.colors.container.alt1.background};
		border-radius: ${STYLING.dimensions.radius.primary};
		border: 1px solid ${(props) => props.theme.colors.border.primary};

		font-size: ${(props) => props.theme.typography.size.xSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		font-family: ${(props) => props.theme.typography.family.primary} !important;

		svg {
			height: 23.5px;
			width: 23.5px;
			padding: 5.5px 0 0 0;
			color: ${(props) => props.theme.colors.link.color};
			fill: ${(props) => props.theme.colors.link.color};
		}

		&:hover {
			background: ${(props) => props.theme.colors.container.alt3.background};
			border: 1px solid ${(props) => props.theme.colors.border.alt4};

			svg {
				color: ${(props) => props.theme.colors.link.active};
				fill: ${(props) => props.theme.colors.link.active};
			}
		}
	}
`;

export const C1Wrapper = styled.div`
	width: fit-content;
	display: flex;
	align-items: center;
	gap: 25px;

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		max-width: calc(100% - 60px);
	}
`;

export const LogoWrapper = styled.div`
	height: 30px;
	width: 30px;
	svg {
		height: 30px;
		width: 30px;
		padding: 2.5px 0 0 0;
		color: ${(props) => props.theme.colors.icon.alt2.fill};
		fill: ${(props) => props.theme.colors.icon.alt2.fill};
		&:hover {
			color: ${(props) => props.theme.colors.icon.alt2.active};
			fill: ${(props) => props.theme.colors.icon.alt2.active};
		}
	}
`;

export const DNavWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 30px;

	@media (max-width: ${STYLING.cutoffs.tablet}) {
		display: none;
	}
`;

export const DNavLink = styled.div<{ active: boolean }>`
	a {
		color: ${(props) => (props.active ? props.theme.colors.font.primary : props.theme.colors.font.alt1)};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-size: ${(props) => props.theme.typography.size.small};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		text-transform: uppercase;
		letter-spacing: 0.35px;

		padding: 0 0 2.5px 0;
		border-bottom: 2.5px solid ${(props) => (props.active ? props.theme.colors.border.alt5 : 'transparent')};

		&:hover {
			color: ${(props) => props.theme.colors.font.primary};
			border-bottom: 2.5px solid ${(props) => props.theme.colors.border.alt5};
		}
	}
`;

export const ActionsWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 15px;
	position: relative;
`;

export const DSearchWrapper = styled.div`
	@media (max-width: ${STYLING.cutoffs.initial}) {
		display: none;
	}
`;

export const MSearchWrapper = styled.div`
	display: none;

	button {
		padding: 3.5px 0 0 0 !important;
	}

	@media (max-width: ${STYLING.cutoffs.initial}) {
		display: block;
	}
`;

export const MMenuWrapper = styled.div`
	display: none;

	button {
		padding: 3.5px 0 0 0 !important;
	}

	@media (max-width: ${STYLING.cutoffs.tablet}) {
		display: block;
	}
`;

export const MSearchContainer = styled.div`
	max-width: calc(100vw - 50px);
	position: absolute;
	top: 45px;
	right: 0;
	padding: 15px 15px 15px 15px;
	border-radius: ${STYLING.dimensions.radius.alt2} !important;
`;

export const MSearchHeader = styled.div`
	margin: 0 0 10px 0;
	p {
		color: ${(props) => props.theme.colors.font.alt1};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-size: ${(props) => props.theme.typography.size.small};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		text-transform: uppercase;
	}
`;

export const MWrapper = styled.div`
	display: none;
	@media (max-width: ${STYLING.cutoffs.secondary}) {
		display: block;
	}
`;

export const PWrapper = styled.div`
	height: calc(100dvh - 15px);
	width: 400px;
	max-width: 85vw;
	position: fixed;
	top: 10px;
	right: 10px;
	transition: width 50ms ease-out;
	animation: ${openRight} 200ms;
`;

export const PMenu = styled.div``;

export const PHeader = styled.div`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 15px;
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	svg {
		fill: ${(props) => props.theme.colors.icon.primary.fill};
	}
	h4 {
		font-size: ${(props) => props.theme.typography.size.lg};
	}
`;

export const MNavWrapper = styled.div`
	display: flex;
	flex-direction: column;
	a {
		color: ${(props) => props.theme.colors.font.primary};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-size: ${(props) => props.theme.typography.size.small};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		padding: 15px;
		&:hover {
			color: ${(props) => props.theme.colors.font.primary};
			background: ${(props) => props.theme.colors.container.primary.active};
		}
	}
	> * {
		border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	}
`;

export const LoadingWrapper = styled.div`
	padding: 7.5px 16.5px;

	span {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.lg} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		font-family: ${(props) => props.theme.typography.family.primary} !important;
		display: block;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
	}
`;
