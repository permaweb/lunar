import styled from 'styled-components';

import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Header = styled.header<{ navigationOpen: boolean }>`
	height: ${STYLING.dimensions.nav.height};
	width: 100%;
	position: sticky;
	top: 0;
	z-index: 5;
	background: ${(props) => props.theme.colors.view.background};
	border-top: ${CSS_DIMENSIONS.px0_5} solid transparent;
	border-bottom: ${CSS_DIMENSIONS.px1} solid transparent;

	&.tabs-view {
		position: relative;
		background: ${(props) => props.theme.colors.container.alt1.background};
		border-top: ${CSS_DIMENSIONS.px0_5} solid ${(props) => props.theme.colors.border.primary};
		box-shadow: inset ${CSS_DIMENSIONS.px0} ${CSS_DIMENSIONS.px6} ${CSS_DIMENSIONS.px6} -${CSS_DIMENSIONS.px6} ${(props) => props.theme.colors.shadow.primary};
		border-bottom: ${CSS_DIMENSIONS.px1} solid transparent !important;
	}
`;

export const Content = styled.div`
	height: 100%;
	width: 100%;

	max-width: ${STYLING.cutoffs.max};
	padding: 0 ${CSS_DIMENSIONS.px25};
	margin: 0 auto;

	display: flex;
	align-items: center;
	justify-content: space-between;

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		padding: 0 ${CSS_DIMENSIONS.px15};
	}
`;

export const SearchWrapper = styled.div`
	width: ${CSS_DIMENSIONS.px510};
	max-width: 100%;
	position: relative;
`;

export const SearchInputWrapper = styled.div`
	width: 100%;
	position: relative;

	input {
		background: transparent;
		padding: ${CSS_DIMENSIONS.px10} ${CSS_DIMENSIONS.px10} ${CSS_DIMENSIONS.px10} ${CSS_DIMENSIONS.px43_5} !important;
	}

	svg {
		height: ${CSS_DIMENSIONS.px15};
		width: ${CSS_DIMENSIONS.px15};
		color: ${(props) => props.theme.colors.font.alt1};
		fill: ${(props) => props.theme.colors.font.alt1};
		position: absolute;
		z-index: 1;
		top: ${CSS_DIMENSIONS.px11_5};
		left: ${CSS_DIMENSIONS.px14_5};
	}
`;

export const SearchOutputWrapper = styled.div`
	width: 100%;
	position: absolute;
	top: ${CSS_DIMENSIONS.px45};
	overflow: hidden;

	p {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xxSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		font-family: ${(props) => props.theme.typography.family.primary} !important;
	}

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		position: relative;
		top: auto;
		margin: ${CSS_DIMENSIONS.px15} 0 0 0;
	}
`;

export const SearchOutputPlaceholder = styled.div`
	padding: ${CSS_DIMENSIONS.px20} ${CSS_DIMENSIONS.px15};
	background: ${(props) => props.theme.colors.container.alt1.background};
	border-radius: ${STYLING.dimensions.radius.primary};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
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
		padding: ${CSS_DIMENSIONS.px15};
		background: ${(props) => props.theme.colors.container.alt1.background};
		border-radius: ${STYLING.dimensions.radius.primary};
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};

		font-size: ${(props) => props.theme.typography.size.xSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		font-family: ${(props) => props.theme.typography.family.primary} !important;

		svg {
			height: ${CSS_DIMENSIONS.px20_5};
			width: ${CSS_DIMENSIONS.px20_5};
			padding: ${CSS_DIMENSIONS.px5_5} 0 0 0;
			color: ${(props) => props.theme.colors.link.color};
			fill: ${(props) => props.theme.colors.link.color};
		}

		&:hover {
			background: ${(props) => props.theme.colors.container.alt3.background};
			border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.alt4};

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
	gap: ${CSS_DIMENSIONS.px12_5};

	svg {
		height: ${CSS_DIMENSIONS.px19_5} !important;
		width: ${CSS_DIMENSIONS.px19_5} !important;
		padding: ${CSS_DIMENSIONS.px5_5} 0 0 0;
		color: ${(props) => props.theme.colors.link.color};
		fill: ${(props) => props.theme.colors.link.color};
	}
`;

export const C1Wrapper = styled.div`
	width: fit-content;
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px15};

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		max-width: calc(100% - ${CSS_DIMENSIONS.px60});
	}
`;

export const LogoWrapper = styled.div`
	height: ${CSS_DIMENSIONS.px25};
	width: ${CSS_DIMENSIONS.px25};
	svg {
		height: ${CSS_DIMENSIONS.px25};
		width: ${CSS_DIMENSIONS.px25};
		padding: ${CSS_DIMENSIONS.px2_5} 0 0 0;
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
	margin: ${CSS_DIMENSIONS.px5} 0 0 ${CSS_DIMENSIONS.px5};
	background: ${(props) => props.theme.colors.container.alt2.background};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	box-shadow: ${(props) => props.theme.colors.shadow.primary} ${CSS_DIMENSIONS.px0} ${CSS_DIMENSIONS.px1}
		${CSS_DIMENSIONS.px2} ${CSS_DIMENSIONS.px0_5};
	border-radius: ${STYLING.dimensions.radius.alt2};
	pointer-events: none;
	padding: ${CSS_DIMENSIONS.px1} ${CSS_DIMENSIONS.px7_5} ${CSS_DIMENSIONS.px1_5} ${CSS_DIMENSIONS.px7_5} !important;

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
	gap: ${CSS_DIMENSIONS.px25};
	margin: 0 0 0 ${CSS_DIMENSIONS.px12_5};

	@media (max-width: ${STYLING.cutoffs.tablet}) {
		display: none;
	}
`;

export const DNavLink = styled.div<{ active: boolean }>`
	a {
		color: ${(props) => (props.active ? props.theme.colors.font.primary : props.theme.colors.font.alt1)};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		text-transform: uppercase;
		letter-spacing: 0;

		padding: 0 0 ${CSS_DIMENSIONS.px3} 0;
		border-bottom: ${CSS_DIMENSIONS.px2} solid
			${(props) => (props.active ? props.theme.colors.border.alt5 : 'transparent')};

		&:hover {
			color: ${(props) => props.theme.colors.font.primary};
			border-bottom: ${CSS_DIMENSIONS.px2} solid ${(props) => props.theme.colors.border.alt5};
		}
	}
`;

export const ActionsWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px15};
	position: relative;
`;

export const PriceWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px25};
	margin: 0 ${CSS_DIMENSIONS.px15} 0 0;

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		display: none;
	}
`;

export const PriceItem = styled.div`
	height: ${CSS_DIMENSIONS.px36_5};
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px8_5};

	div {
		height: ${CSS_DIMENSIONS.px18};
		width: ${CSS_DIMENSIONS.px18};
	}

	.ar-icon {
		height: ${CSS_DIMENSIONS.px14};
		width: ${CSS_DIMENSIONS.px14};
	}

	svg {
		height: ${CSS_DIMENSIONS.px18};
		width: ${CSS_DIMENSIONS.px18};
		margin: 0 0 ${CSS_DIMENSIONS.px3} 0;

		path {
			color: ${(props) => props.theme.colors.font.primary};
			fill: ${(props) => props.theme.colors.font.primary};
		}
	}

	.ar-icon svg {
		height: ${CSS_DIMENSIONS.px14};
		width: ${CSS_DIMENSIONS.px14};
	}

	.ao-icon svg {
		margin: 0 0 -${CSS_DIMENSIONS.px1} 0;
	}

	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		white-space: nowrap;
	}
`;

export const DSearchWrapper = styled.div`
	@media (max-width: ${STYLING.cutoffs.desktop}) {
		display: none;
	}
`;

export const MSearchWrapper = styled.div`
	display: none;

	button {
		padding: ${CSS_DIMENSIONS.px3_5} 0 0 0 !important;
	}

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		display: block;
	}
`;

export const MMenuWrapper = styled.div`
	display: none;

	button {
		padding: ${CSS_DIMENSIONS.px3_5} 0 0 0 !important;
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
	padding: ${CSS_DIMENSIONS.px15};
`;

export const MNavWrapper = styled.div`
	display: flex;
	flex-direction: column;
	a {
		color: ${(props) => props.theme.colors.font.primary};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-size: ${(props) => props.theme.typography.size.small};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		padding: ${CSS_DIMENSIONS.px15} ${CSS_DIMENSIONS.px20};
		&:hover {
			color: ${(props) => props.theme.colors.font.primary};
			background: ${(props) => props.theme.colors.container.primary.active};
		}
	}
	> * {
		border-top: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	}

	> *:last-child {
		border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary} !important;
	}
`;

export const LoadingWrapper = styled.div`
	padding: ${CSS_DIMENSIONS.px7_5} ${CSS_DIMENSIONS.px16_5};

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
