import styled from 'styled-components';

import { PrimitiveButton } from 'components/atoms/PrimitiveButton';
import { open, transition3 } from 'helpers/animations';
import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div`
	height: 100%;
	display: flex;
	position: relative;
	animation: ${open} ${transition3};
`;

export const PWrapper = styled.div`
	display: flex;
	align-items: center;

	svg {
		padding: ${CSS_DIMENSIONS.px2_5} 0 0 0;
		margin: ${CSS_DIMENSIONS.px2_5} 0 0 0;
	}
`;

export const CAction = styled.div`
	margin: 0 ${CSS_DIMENSIONS.px15} 0 0;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		display: none;
	}
`;

export const LAction = styled(PrimitiveButton)`
	height: ${CSS_DIMENSIONS.px35};
	padding: 0 ${CSS_DIMENSIONS.px17_5};
	margin: 0 ${CSS_DIMENSIONS.px15} 0 0;
	display: none;
	span {
		color: ${(props) => props.theme.colors.font.primary};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-size: ${(props) => props.theme.typography.size.base};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		display: block;
	}
	&:hover {
		background: ${(props) => props.theme.colors.container.primary.active};
	}
	@media (max-width: ${STYLING.cutoffs.initial}) {
		display: none;
	}
`;

export const FlexAction = styled.div`
	display: flex;
	align-items: center;
	svg {
		height: ${CSS_DIMENSIONS.px25};
		width: ${CSS_DIMENSIONS.px20};
		margin: 0 -${CSS_DIMENSIONS.px2_5} 0 ${CSS_DIMENSIONS.px11_5};
	}
`;

export const Dropdown = styled.div`
	max-height: 65vh;
	width: ${CSS_DIMENSIONS.px290};
	max-width: 75vw;
	padding: ${CSS_DIMENSIONS.px11_5} ${CSS_DIMENSIONS.px10};
	position: absolute;
	z-index: 1;
	top: ${CSS_DIMENSIONS.px42_5};
	right: -${CSS_DIMENSIONS.px1_5};
	overscroll-behavior: none;
`;

export const DHeaderWrapper = styled.div`
	width: 100%;
`;

export const PDropdownHeader = styled.div`
	padding: 0 ${CSS_DIMENSIONS.px7_5};
	p {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.medium} !important;
		font-family: ${(props) => props.theme.typography.family.primary} !important;
		text-transform: uppercase;
	}
`;

export const DHeaderFlex = styled.div`
	width: 100%;
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px12_5};
	padding: ${CSS_DIMENSIONS.px5} ${CSS_DIMENSIONS.px5} ${CSS_DIMENSIONS.px15} ${CSS_DIMENSIONS.px5};
	border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};

	svg {
		padding: ${CSS_DIMENSIONS.px2_5} 0 0 0;
		margin: ${CSS_DIMENSIONS.px2_5} 0 0 0;
	}
`;

export const DHeader = styled.div`
	p {
		color: ${(props) => props.theme.colors.font.primary};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-size: ${(props) => props.theme.typography.size.small};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}
`;

export const DBalanceWrapper = styled.div`
	width: 100%;
	padding: ${CSS_DIMENSIONS.px12_5} 0;
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px15};
	border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};

	> * {
		&:not(:last-child) {
			padding: 0 ${CSS_DIMENSIONS.px7_5} ${CSS_DIMENSIONS.px12_5} ${CSS_DIMENSIONS.px7_5};
			border-bottom: ${CSS_DIMENSIONS.px1} dotted ${(props) => props.theme.colors.border.primary};
		}
	}
`;

export const BalanceWrapper = styled.div<{ isNumber: boolean }>`
	width: 100%;
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px0_5};
	padding: 0 ${CSS_DIMENSIONS.px7_5};

	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) =>
			props.isNumber ? props.theme.typography.weight.bold : props.theme.typography.weight.bold};
		color: ${(props) => (props.isNumber ? props.theme.colors.font.primary : props.theme.colors.font.primary)};
		text-align: left;
		text-transform: none;
	}

	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		text-align: center;
		text-transform: uppercase;
	}
`;

export const LogoWrapper = styled.div`
	width: ${CSS_DIMENSIONS.px30};
`;

export const Logo = styled.div<{ dimensions: number; margin?: string }>`
	height: ${(props) => `${props.dimensions.toString()}px`};
	width: ${(props) => `${props.dimensions.toString()}px`};

	div {
		height: ${(props) => `${props.dimensions.toString()}px`};
		width: ${(props) => `${props.dimensions.toString()}px`};
		margin: 0 0 0 ${CSS_DIMENSIONS.px1_5};
	}

	svg {
		height: ${(props) => `${props.dimensions.toString()}px`};
		width: ${(props) => `${props.dimensions.toString()}px`};
		color: ${(props) => props.theme.colors.font.primary};
		fill: ${(props) => props.theme.colors.font.primary};
		margin: ${(props) => props.margin ?? '0'};

		path {
			color: ${(props) => props.theme.colors.font.primary};
			fill: ${(props) => props.theme.colors.font.primary};
		}
	}
`;

export const Refresh = styled.div`
	margin: 0 0 0 auto;

	svg {
		color: ${(props) => props.theme.colors.font.primary} !important;
		fill: ${(props) => props.theme.colors.font.primary} !important;
	}

	button {
		background: transparent !important;
		border: none !important;

		&:hover {
			svg {
				color: ${(props) => props.theme.colors.font.alt1} !important;
				fill: ${(props) => props.theme.colors.font.alt1} !important;
			}

			opacity: 0.75 !important;
		}
	}
`;

export const DBodyWrapper = styled.ul`
	width: 100%;
	padding: ${CSS_DIMENSIONS.px10} 0;
	border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	li {
		text-align: center;
		height: ${CSS_DIMENSIONS.px40};
		display: flex;
		align-items: center;
		cursor: pointer;
		color: ${(props) => props.theme.colors.font.primary} !important;
		font-size: ${(props) => props.theme.typography.size.xxSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		font-family: ${(props) => props.theme.typography.family.primary} !important;
		border: ${CSS_DIMENSIONS.px1} solid transparent;
		border-radius: ${STYLING.dimensions.radius.alt2};
		transition: all 100ms;
		padding: 0 ${CSS_DIMENSIONS.px7_5};

		svg {
			height: ${CSS_DIMENSIONS.px14};
			width: ${CSS_DIMENSIONS.px14};
			margin: ${CSS_DIMENSIONS.px5_5} ${CSS_DIMENSIONS.px9_5} 0 0;
			color: ${(props) => props.theme.colors.font.alt2};
			fill: ${(props) => props.theme.colors.font.alt2};
		}

		&:hover {
			color: ${(props) => props.theme.colors.font.primary};
			background: ${(props) => props.theme.colors.container.primary.active};
		}

		a {
			height: 100%;
			width: 100%;
			display: flex;
			align-items: center;
			border-radius: ${STYLING.dimensions.radius.primary};
			&:hover {
				color: ${(props) => props.theme.colors.font.primary};
				background: ${(props) => props.theme.colors.container.primary.active};
			}
		}
	}
`;

export const DFooterWrapper = styled(DBodyWrapper)`
	border-bottom: none;
	padding: ${CSS_DIMENSIONS.px10} 0 0 0;
`;

export const MWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px20};
	padding: 0 ${CSS_DIMENSIONS.px20} ${CSS_DIMENSIONS.px20} ${CSS_DIMENSIONS.px20} !important;
`;

export const SyncToggle = styled(PrimitiveButton)<{ active: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: ${CSS_DIMENSIONS.px15};
	border-radius: ${STYLING.dimensions.radius.primary};
	background: ${(props) =>
		props.active ? props.theme.colors.container.primary.active : props.theme.colors.container.primary.background};
	border: ${CSS_DIMENSIONS.px1} solid
		${(props) => (props.active ? props.theme.colors.border.alt2 : props.theme.colors.border.primary)};
	cursor: pointer;
	transition: all 150ms;

	&:hover {
		background: ${(props) => props.theme.colors.container.primary.active};
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.alt2};
	}
`;

export const SyncToggleLabel = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px5};

	p {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		text-transform: uppercase;
		text-align: left;
	}

	span {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		font-family: ${(props) => props.theme.typography.family.primary};
		text-align: left;
	}
`;

export const ThemeSection = styled.div`
	width: 100%;
`;

export const ThemeSectionHeader = styled.div`
	display: flex;
	margin: 0 0 ${CSS_DIMENSIONS.px10} 0;
	svg {
		height: ${CSS_DIMENSIONS.px13_5};
		width: ${CSS_DIMENSIONS.px13_5};
		margin: 0 ${CSS_DIMENSIONS.px9_5} ${CSS_DIMENSIONS.px1_5} 0;
		color: ${(props) => props.theme.colors.font.alt1};
		fill: ${(props) => props.theme.colors.font.alt1};
	}

	p {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xxxSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.medium} !important;
		font-family: ${(props) => props.theme.typography.family.primary} !important;
		text-transform: uppercase;
	}
`;

export const ThemeSectionBody = styled.div`
	width: 100%;
	display: flex;
	flex-wrap: wrap;
	gap: ${CSS_DIMENSIONS.px30} ${CSS_DIMENSIONS.px20};
	justify-content: space-between;
`;

export const Indicator = styled.div<{ active: boolean }>`
	height: ${CSS_DIMENSIONS.px12_5};
	width: ${CSS_DIMENSIONS.px12_5};
	border-radius: 50%;
	background: ${(props) => (props.active ? props.theme.colors.indicator.active : 'transparent')};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	transition: all 150ms;
`;

export const ThemeSectionBodyElement = styled(PrimitiveButton)`
	min-width: calc(50% - ${CSS_DIMENSIONS.px40});
	flex: 1;

	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px10};

	border-radius: ${STYLING.dimensions.radius.alt3} !important;

	&:hover {
		${Indicator} {
			background: ${(props) => props.theme.colors.indicator.active} !important;
		}
	}

	div {
		display: flex;
		align-items: center;
		gap: ${CSS_DIMENSIONS.px10};
		p {
			color: ${(props) => props.theme.colors.font.primary};
			font-size: ${(props) => props.theme.typography.size.xSmall} !important;
			font-weight: ${(props) => props.theme.typography.weight.bold} !important;
			font-family: ${(props) => props.theme.typography.family.primary} !important;
		}
	}
`;

export const Preview = styled.div<{ background: string; accent: string }>`
	position: relative;
	height: ${CSS_DIMENSIONS.px100};
	width: 100%;
	border-radius: ${STYLING.dimensions.radius.primary};
	background: ${(props) => props.background};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};

	#preview-accent-1 {
		height: ${CSS_DIMENSIONS.px32_5};
		width: ${CSS_DIMENSIONS.px32_5};
		position: absolute;
		top: ${CSS_DIMENSIONS.px10};
		right: ${CSS_DIMENSIONS.px10};
		border-radius: ${STYLING.dimensions.radius.alt2};
		background: ${(props) => props.accent};
	}
`;
