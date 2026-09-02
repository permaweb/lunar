import styled, { css } from 'styled-components';

import { PrimitiveButton } from 'components/atoms/PrimitiveButton';
import { STYLING } from 'helpers/config';
import { colorWithOpacity, CSS_DIMENSIONS } from 'helpers/themes';

const NESTED_BORDER_OPACITY_STEP = 0.25;
const MIN_NESTED_BORDER_OPACITY = 0.25;

function getNestedBorderColor(color: string, nestingLevel: number = 1) {
	const opacity = Math.max(MIN_NESTED_BORDER_OPACITY, 1 - Math.max(nestingLevel - 1, 0) * NESTED_BORDER_OPACITY_STEP);
	const normalizedColor = color.replace('#', '');
	const hexColor =
		normalizedColor.length === 3
			? normalizedColor
					.split('')
					.map((character) => `${character}${character}`)
					.join('')
			: normalizedColor;

	if (!/^[0-9a-f]{6}$/i.test(hexColor)) return color;

	const red = parseInt(hexColor.slice(0, 2), 16);
	const green = parseInt(hexColor.slice(2, 4), 16);
	const blue = parseInt(hexColor.slice(4, 6), 16);

	return colorWithOpacity(red, green, blue, opacity);
}

export const Container = styled.div`
	scroll-margin-top: ${CSS_DIMENSIONS.px80};
`;

export const Header = styled.div`
	padding: ${CSS_DIMENSIONS.px15};
	margin: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: ${CSS_DIMENSIONS.px40};
	border-top: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-right: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-left: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-top-right-radius: ${STYLING.dimensions.radius.alt1};
	border-top-left-radius: ${STYLING.dimensions.radius.alt1};
`;

export const HeaderMain = styled.div`
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px20};

	p {
		font-size: ${(props) => props.theme.typography.size.lg};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}

	.update-wrapper {
		padding: ${CSS_DIMENSIONS.px2_5} ${CSS_DIMENSIONS.px25};
	}

	.loader {
		> div {
			height: fit-content;
			width: fit-content;
		}
	}
`;

export const HeaderActions = styled.div`
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px12_5};
`;

export const FilterWrapper = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: ${CSS_DIMENSIONS.px12_5};
`;

export const AppliedActionsWrapper = styled.div`
	max-width: 65%;
	position: relative;
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px12_5};
`;

export const FilterDropdown = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px12_5};
	padding: 0 ${CSS_DIMENSIONS.px20} ${CSS_DIMENSIONS.px20} ${CSS_DIMENSIONS.px20};
`;

export const FilterDropdownHeader = styled.div`
	p {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xxxSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.medium} !important;
		font-family: ${(props) => props.theme.typography.family.primary} !important;
		text-transform: uppercase;
	}
`;

export const FilterDivider = styled.div`
	height: ${CSS_DIMENSIONS.px1};
	width: 100%;
	margin: ${CSS_DIMENSIONS.px15} 0 ${CSS_DIMENSIONS.px10} 0;
	border-top: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
`;

export const FilterDropdownActionSelect = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px15};

	button {
		border-radius: ${STYLING.dimensions.radius.alt2} !important;
	}
`;

export const FilterApply = styled.div`
	margin: ${CSS_DIMENSIONS.px15} 0 0 0;
`;

export const FilterWarning = styled.div`
	margin: -${CSS_DIMENSIONS.px2_5} 0 0 0;

	p {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.warning.caution};
		line-height: 1.45;
	}
`;

export const DateRangeWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px20};
`;

export const DateRangeSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px10};
`;

export const DateRangeHeader = styled.div`
	display: flex;
	align-items: flex-end;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px15};
	width: 100%;
`;

export const DateLabel = styled.div`
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	color: ${(props) => props.theme.colors.font.primary};
`;

export const ClearDateButton = styled(PrimitiveButton)`
	background: ${(props) => props.theme.colors.button.primary.background};
	color: ${(props) => props.theme.colors.button.primary.color};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.button.primary.border};
	border-radius: ${STYLING.dimensions.radius.alt2};
	padding: ${CSS_DIMENSIONS.px5} ${CSS_DIMENSIONS.px10};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	cursor: pointer;
	width: fit-content;

	&:hover {
		background: ${(props) => props.theme.colors.button.alt1.active.background};
	}
`;

export const Divider = styled.div`
	height: ${CSS_DIMENSIONS.px20};
	width: ${CSS_DIMENSIONS.px1};
	border-right: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};

	@media (max-width: ${STYLING.cutoffs.initial}) {
		display: none;
	}
`;

export const Wrapper = styled.div<{ childList?: boolean }>`
	width: 100%;
	overflow: auto;
	background: ${(props) =>
		props.childList ? props.theme.colors.container.alt2.background : props.theme.colors.container.primary.background};
`;

export const HeaderWrapper = styled.div`
	height: ${CSS_DIMENSIONS.px40};
	min-width: 100%;
	width: fit-content;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: ${CSS_DIMENSIONS.px15};
	padding: 0 ${CSS_DIMENSIONS.px15};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	background: ${(props) => props.theme.colors.container.alt1.background};

	div,
	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}

	> {
		&:last-child,
		&:nth-child(4) {
			display: flex;
			justify-content: flex-end;
			text-align: right;
		}
	}
`;

export const BodyWrapper = styled.div<{
	childList?: boolean;
	isOverallLast?: boolean;
	$nestingLevel?: number;
}>`
	width: 100%;

	> *:last-child {
		border-bottom: ${CSS_DIMENSIONS.px1} solid
			${(props) =>
				props.childList && !props.isOverallLast
					? getNestedBorderColor(props.theme.colors.border.alt4, props.$nestingLevel)
					: props.theme.colors.border.primary} !important;
	}

	.message-list-element {
		border-top: ${CSS_DIMENSIONS.px0_5} solid transparent;
		border-left: ${CSS_DIMENSIONS.px1} solid
			${(props) =>
				props.childList
					? getNestedBorderColor(props.theme.colors.border.alt4, props.$nestingLevel)
					: props.theme.colors.border.primary};
		border-right: ${CSS_DIMENSIONS.px1} solid
			${(props) =>
				props.childList
					? getNestedBorderColor(props.theme.colors.border.alt4, props.$nestingLevel)
					: props.theme.colors.border.primary};
		border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	}
`;
export const ElementWrapper = styled.div<{
	open: boolean;
	disabled: boolean;
	lastChild?: boolean;
	childList?: boolean;
	clickable?: boolean;
	$nestingLevel?: number;
	$spam?: boolean;
}>`
	height: ${CSS_DIMENSIONS.px40};
	min-width: 100%;
	width: fit-content;
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: ${CSS_DIMENSIONS.px15};
	padding: 0 ${CSS_DIMENSIONS.px15};

	cursor: ${(props) => (props.clickable ? 'pointer' : 'default')};
	background: ${(props) =>
		props.$spam ? props.theme.colors.container.alt1.background : props.theme.colors.container.primary.background};

	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	transition: all 75ms;

	&:hover {
		background: ${(props) =>
			props.$spam ? props.theme.colors.container.alt1.background : props.theme.colors.container.primary.active};
	}

	${(props) =>
		props.clickable &&
		css`
			&:hover {
				background: ${props.$spam
					? props.theme.colors.container.alt1.background
					: props.theme.colors.container.primary.active};
				border-top: ${CSS_DIMENSIONS.px0_5} solid
					${getNestedBorderColor(props.theme.colors.border.alt4, props.$nestingLevel)} !important;
				border-left: ${CSS_DIMENSIONS.px1} solid
					${getNestedBorderColor(props.theme.colors.border.alt4, props.$nestingLevel)} !important;
				border-right: ${CSS_DIMENSIONS.px1} solid
					${getNestedBorderColor(props.theme.colors.border.alt4, props.$nestingLevel)} !important;
				border-bottom: ${CSS_DIMENSIONS.px1} solid
					${getNestedBorderColor(props.theme.colors.border.alt4, props.$nestingLevel)} !important;
			}

			&:hover::after {
				content: '';
				position: absolute;
				height: ${CSS_DIMENSIONS.px1};
				width: calc(100% + ${CSS_DIMENSIONS.px2});
				top: -${CSS_DIMENSIONS.px1};
				left: -${CSS_DIMENSIONS.px1};
				right: 0;
				bottom: 0;
				border-top: ${CSS_DIMENSIONS.px1} solid
					${getNestedBorderColor(props.theme.colors.border.alt4, props.$nestingLevel)};
				transition: all 100ms;
			}
		`}

	${(props) =>
		props.open &&
		css`
			border-left: ${CSS_DIMENSIONS.px1} solid
				${getNestedBorderColor(props.theme.colors.border.alt4, props.$nestingLevel)} !important;
			border-right: ${CSS_DIMENSIONS.px1} solid
				${getNestedBorderColor(props.theme.colors.border.alt4, props.$nestingLevel)} !important;
			border-bottom: ${CSS_DIMENSIONS.px1} solid ${props.theme.colors.border.primary} !important;

			background: ${props.theme.colors.container.alt1.background};

			&::after {
				content: '';
				position: absolute;
				height: ${CSS_DIMENSIONS.px1};
				width: calc(100% + ${CSS_DIMENSIONS.px2});
				top: -${CSS_DIMENSIONS.px1};
				left: -${CSS_DIMENSIONS.px1};
				right: 0;
				bottom: 0;
				border-top: ${CSS_DIMENSIONS.px1} solid
					${getNestedBorderColor(props.theme.colors.border.alt4, props.$nestingLevel)};
				transition: all 100ms;
			}
		`}
`;

export const ElementItem = styled.div`
	display: flex;
`;

export const ID = styled(ElementItem)`
	min-width: ${CSS_DIMENSIONS.px155};
	width: ${CSS_DIMENSIONS.px155};
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px5};
`;

export const TxAddress = styled.div`
	min-width: ${CSS_DIMENSIONS.px165};
	width: ${CSS_DIMENSIONS.px165};
`;

export const ResultMessage = styled.div`
	min-width: ${CSS_DIMENSIONS.px165};
	width: ${CSS_DIMENSIONS.px165};

	> span {
		color: ${(props) => props.theme.colors.font.alt1} !important;
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		max-width: 100% !important;
		transition: all 100ms;
		display: block;
		width: fit-content;
	}
`;

export const Type = styled(ElementItem)`
	min-width: ${CSS_DIMENSIONS.px155};
	width: ${CSS_DIMENSIONS.px155};
`;

export const TypeValue = styled(Type)`
	display: flex;
	align-items: center;
	justify-content: flex-start;

	p {
		max-width: 100%;
		color: ${(props) => props.theme.colors.font.primary} !important;
		font-size: ${(props) => props.theme.typography.size.xSmall} !important;
		font-family: ${(props) => props.theme.typography.family.primary} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
`;

export const Action = styled(ElementItem)`
	min-width: ${CSS_DIMENSIONS.px195};
	width: ${CSS_DIMENSIONS.px195};
`;

export const ActionTooltip = styled.div`
	position: absolute;
	z-index: 2;
	top: ${CSS_DIMENSIONS.px2_5};
	left: calc(100% + ${CSS_DIMENSIONS.px10});
	display: none;
	white-space: nowrap;

	span {
		display: none; /* Removed */
		line-height: 1.65;
	}
`;

export const ActionValue = styled(Action)<{ background?: string; useMaxWidth: boolean }>`
	position: relative;
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px7_5};

	.action-indicator {
		min-height: ${CSS_DIMENSIONS.px8};
		min-width: ${CSS_DIMENSIONS.px8};
		height: ${CSS_DIMENSIONS.px8};
		width: ${CSS_DIMENSIONS.px8};
		border-radius: 50%;
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		background: ${(props) => (props.background ? props.background : props.theme.colors.container.alt8.background)};

		&:hover {
			${ActionTooltip} {
				display: none; /* Removed */
			}
		}
	}

	p {
		min-width: 0;
		flex: 0 1 auto;
		max-width: 100%;
		color: ${(props) => props.theme.colors.font.primary} !important;
		font-size: ${(props) => props.theme.typography.size.xSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
`;

export const To = styled(ElementItem)`
	min-width: ${CSS_DIMENSIONS.px150};
	width: ${CSS_DIMENSIONS.px150};
	justify-content: flex-end;
	p {
		text-align: right;
	}
`;

export const From = styled(ElementItem)`
	min-width: ${CSS_DIMENSIONS.px150};
	width: ${CSS_DIMENSIONS.px150};
	justify-content: flex-end;
	p {
		text-align: right;
	}
`;

export const Input = styled(ElementItem)`
	min-width: ${CSS_DIMENSIONS.px75};
	width: ${CSS_DIMENSIONS.px75};
	justify-content: center;
	p {
		text-align: right;
	}

	button {
		padding: ${CSS_DIMENSIONS.px4_5} ${CSS_DIMENSIONS.px12_5} !important
;
	}
`;

export const Output = styled(ElementItem)`
	min-width: ${CSS_DIMENSIONS.px75};
	width: ${CSS_DIMENSIONS.px75};
	justify-content: center;
	p {
		text-align: right;
	}

	button {
		padding: ${CSS_DIMENSIONS.px4_5} ${CSS_DIMENSIONS.px12_5} !important
;
	}
`;

export const Time = styled(ElementItem)`
	min-width: ${CSS_DIMENSIONS.px115};
	width: ${CSS_DIMENSIONS.px115};
	justify-content: flex-end;
	p {
		text-align: right;
	}
`;

export const Results = styled(ElementItem)<{ open?: boolean }>`
	min-width: ${CSS_DIMENSIONS.px65};
	width: ${CSS_DIMENSIONS.px65};
	justify-content: flex-end;
	svg {
		height: ${CSS_DIMENSIONS.px15};
		width: ${CSS_DIMENSIONS.px15};
		margin: 0 0 -${CSS_DIMENSIONS.px2_5} 0;
		transform: rotate(${(props) => (props.open ? '180deg' : '0deg')});
		transition: transform 0.15s ease-in-out;
	}
`;

export const OverlayWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px15};
	padding: 0 ${CSS_DIMENSIONS.px20} ${CSS_DIMENSIONS.px20} ${CSS_DIMENSIONS.px20};
`;

export const OverlayTagsWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px7_5};
	margin: ${CSS_DIMENSIONS.px2_5} 0 0 0;
`;

export const OverlayTagsHeader = styled.div`
	margin: 0 0 ${CSS_DIMENSIONS.px1_5} 0;
	padding: 0 0 ${CSS_DIMENSIONS.px10_5} 0;
	border-bottom: ${CSS_DIMENSIONS.px1} dotted ${(props) => props.theme.colors.border.primary};
	p {
		font-size: ${(props) => props.theme.typography.size.small};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}
`;

export const OverlayLine = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;

	p,
	span {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}

	p {
		color: ${(props) => props.theme.colors.font.primary};
		text-align: right;
		text-align: right;
		max-width: 65%;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	span {
		color: ${(props) => props.theme.colors.font.alt1};
	}

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		flex-direction: column;
		align-items: flex-start;
		justify-content: flex-start;
		gap: ${CSS_DIMENSIONS.px5};

		p {
			text-align: left;
		}
	}
`;

export const OverlayTagValue = styled(PrimitiveButton)<{ $tooltipVisible?: boolean }>`
	position: relative;
	max-width: 65%;
	display: flex;
	justify-content: flex-end;
	padding: 0;
	background: transparent;
	border: none;
	cursor: pointer;

	p {
		max-width: 100%;
		text-align: right;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	> div {
		opacity: ${(props) => (props.$tooltipVisible ? 1 : 0)};
		visibility: ${(props) => (props.$tooltipVisible ? 'visible' : 'hidden')};
		transform: ${(props) => (props.$tooltipVisible ? 'translateY(0)' : `translateY(-${CSS_DIMENSIONS.px3})`)};
		transition-delay: ${(props) => (props.$tooltipVisible ? '0s' : '0s, 0s, 140ms')};
	}

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		max-width: 100%;
		justify-content: flex-start;

		p {
			text-align: left;
		}
	}
`;

export const OverlayTagValueTooltip = styled.div`
	position: absolute;
	z-index: 5;
	top: calc(100% + ${CSS_DIMENSIONS.px3_5});
	right: 0;
	opacity: 0;
	visibility: hidden;
	transform: translateY(-${CSS_DIMENSIONS.px3});
	width: max-content;
	max-width: min(${CSS_DIMENSIONS.px720}, calc(100vw - ${CSS_DIMENSIONS.px40}));
	padding: ${CSS_DIMENSIONS.px2_5} ${CSS_DIMENSIONS.px5};
	background: ${(props) => props.theme.colors.container.alt8.background};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.alt2};
	box-shadow: ${(props) => props.theme.colors.shadow.primary} ${CSS_DIMENSIONS.px0} ${CSS_DIMENSIONS.px1}
		${CSS_DIMENSIONS.px2} ${CSS_DIMENSIONS.px0_5};
	color: ${(props) => props.theme.colors.font.light1};
	font-size: ${(props) => props.theme.typography.size.xxxSmall};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	line-height: 1.2;
	text-align: left;
	white-space: normal;
	overflow-wrap: anywhere;
	pointer-events: none;
	transition: opacity 140ms ease, transform 140ms ease, visibility 0s linear 140ms;

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		right: auto;
		left: 0;
	}
`;

export const OverlayInfo = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px15};
`;

export const OverlayInfoLine = styled.div`
	display: flex;
	gap: ${CSS_DIMENSIONS.px7_5};
`;

export const OverlayInfoLineValue = styled.div`
	p {
		display: flex;
		margin: ${CSS_DIMENSIONS.px2_5} 0 0 0;
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}
`;

export const OverlayOutput = styled.div`
	width: 100%;

	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}
`;

export const OverlayActions = styled.div`
	width: fit-content;
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px15};
	margin: ${CSS_DIMENSIONS.px5} 0 0 auto;
`;

export const Editor = styled.div`
	height: ${CSS_DIMENSIONS.px600};
	width: 100%;
`;

export const FooterWrapper = styled.div`
	width: 100%;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	justify-content: space-between;
	gap: ${CSS_DIMENSIONS.px15};
	padding: ${CSS_DIMENSIONS.px15};
	background: ${(props) => props.theme.colors.container.alt1.background};
	border-left: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-right: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary} !important;
	border-bottom-left-radius: ${STYLING.dimensions.radius.alt1};
	border-bottom-right-radius: ${STYLING.dimensions.radius.alt1};
`;

export const PageCounter = styled.div`
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px7_5};

	p,
	label,
	input {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const DPageCounter = styled(PageCounter)`
	display: flex;

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		display: none;
	}
`;

export const MPageCounter = styled(PageCounter)`
	display: none;

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		display: flex;
	}
`;

export const UpdateWrapper = styled.div<{ childList?: boolean }>`
	padding: ${(props) =>
		props.childList
			? `${CSS_DIMENSIONS.px15}`
			: `0 ${CSS_DIMENSIONS.px15} ${CSS_DIMENSIONS.px15} ${CSS_DIMENSIONS.px15}`};
	border-top: ${CSS_DIMENSIONS.px0_15} solid
		${(props) => (props.childList ? props.theme.colors.border.alt4 : 'transparent')};
	border-left: ${CSS_DIMENSIONS.px1} solid
		${(props) => (props.childList ? props.theme.colors.border.alt4 : props.theme.colors.border.primary)};
	border-right: ${CSS_DIMENSIONS.px1} solid
		${(props) => (props.childList ? props.theme.colors.border.alt4 : props.theme.colors.border.primary)};
	border-bottom: ${CSS_DIMENSIONS.px1} solid
		${(props) => (props.childList ? props.theme.colors.border.alt4 : props.theme.colors.border.primary)} !important;
	background: ${(props) =>
		props.childList ? props.theme.colors.container.alt2.background : props.theme.colors.container.primary.background};

	p {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		text-transform: uppercase;
		line-height: 1;
	}
`;
