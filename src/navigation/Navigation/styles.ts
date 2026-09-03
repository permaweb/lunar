import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Header = styled.header<{ navigationOpen: boolean }>`
	height: ${STYLING.dimensions.nav.height};
	width: 100%;
	position: sticky;
	top: 0;
	z-index: 5;
	background: ${(props) => props.theme.colors.view.background};
	border-top: 0.5px solid transparent;
	border-bottom: 1px solid transparent;

	&.tabs-view {
		position: relative;
		background: ${(props) => props.theme.colors.container.alt1.background};
		border-top: 0.5px solid ${(props) => props.theme.colors.border.primary};
		box-shadow: inset 0px 6px 6px -6px ${(props) => props.theme.colors.shadow.primary};
		border-bottom: 1px solid transparent !important;
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

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		padding: 0 15px;
	}
`;

export const SearchWrapper = styled.div`
	width: 450px;
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
	position: relative;
	margin: 15px 0 0 0;
	overflow: hidden;

	p {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xxSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		font-family: ${(props) => props.theme.typography.family.primary} !important;
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
			height: 20.5px;
			width: 20.5px;
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

export const SearchResultInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 12.5px;

	svg {
		height: 19.5px !important;
		width: 19.5px !important;
		padding: 5.5px 0 0 0;
		color: ${(props) => props.theme.colors.link.color};
		fill: ${(props) => props.theme.colors.link.color};
	}
`;

export const C1Wrapper = styled.div`
	width: fit-content;
	display: flex;
	align-items: center;
	gap: 15px;

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		max-width: calc(100% - 60px);
	}
`;

export const LogoWrapper = styled.div`
	height: 25px;
	width: 25px;
	svg {
		height: 25px;
		width: 25px;
		padding: 2.5px 0 0 0;
		color: ${(props) => props.theme.colors.font.primary};
		fill: ${(props) => props.theme.colors.font.primary};
		opacity: 0.8;

		&:hover {
			color: ${(props) => props.theme.colors.font.alt1};
			fill: ${(props) => props.theme.colors.font.alt1};
			opacity: 0.8;
		}
	}
`;

export const InfoWrapper = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 5px 0 0 5px;
	background: ${(props) => props.theme.colors.container.alt2.background};
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	box-shadow: ${(props) => props.theme.colors.shadow.primary} 0px 1px 2px 0.5px;
	border-radius: ${STYLING.dimensions.radius.alt2};
	pointer-events: none;
	padding: 1px 7.5px 1.5px 7.5px !important;

	span {
		color: ${(props) => props.theme.colors.font.primary} !important;
		font-family: ${(props) => props.theme.typography.family.alt1} !important;
		font-size: ${(props) => props.theme.typography.size.xxxSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		text-transform: uppercase !important;
	}
`;

export const DNavWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 30px;
	margin: 0 0 0 12.5px;

	@media (max-width: ${STYLING.cutoffs.tablet}) {
		display: none;
	}
`;

export const DNavLink = styled.div<{ active: boolean }>`
	a {
		color: ${(props) => (props.active ? props.theme.colors.font.primary : props.theme.colors.font.alt1)};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		letter-spacing: 0;

		&:hover {
			color: ${(props) => props.theme.colors.font.primary};
		}
	}
`;

export const ActionsWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 15px;
	position: relative;
`;

export const PriceWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 35px;
	margin: 0 15px 0 0;

	a {
		&:hover {
			opacity: 0.75;
		}
	}

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		display: none;
	}
`;

export const PriceItem = styled.div`
	height: 36.5px;
	display: flex;
	align-items: center;
	gap: 8.5px;

	div {
		height: 18px;
		width: 18px;
	}

	.ar-icon {
		height: 12px;
		width: 12px;
	}

	svg {
		height: 17px;
		width: 17px;
		margin: 0 0 6px 0;

		path {
			color: ${(props) => props.theme.colors.font.primary};
			fill: ${(props) => props.theme.colors.font.primary};
		}
	}

	.ar-icon svg {
		height: 12px;
		width: 12px;
	}

	.ao-icon svg {
		margin: 0 0 3px 0;
	}

	p {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		white-space: nowrap;
	}
`;

export const SearchActionWrapper = styled.div`
	button {
		background: transparent !important;
		border-color: transparent !important;
		padding: 3.5px 0 0 0 !important;

		&:hover,
		&:focus-visible {
			background: ${(props) => props.theme.colors.container.alt3.background} !important;
			border-color: ${(props) => props.theme.colors.border.alt3} !important;
		}
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

export const MWrapper = styled.div`
	display: none;
	@media (max-width: ${STYLING.cutoffs.secondary}) {
		display: block;
	}
`;

export const MSearchPanelContent = styled.div`
	padding: 15px;
`;

export const MNavWrapper = styled.div`
	display: flex;
	flex-direction: column;
	a {
		color: ${(props) => props.theme.colors.font.primary};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-size: ${(props) => props.theme.typography.size.small};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		padding: 15px 20px;
		&:hover {
			color: ${(props) => props.theme.colors.font.primary};
			background: ${(props) => props.theme.colors.container.primary.active};
		}
	}
	> * {
		border-top: 1px solid ${(props) => props.theme.colors.border.primary};
	}

	> *:last-child {
		border-bottom: 1px solid ${(props) => props.theme.colors.border.primary} !important;
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
