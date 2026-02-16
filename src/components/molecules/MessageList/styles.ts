import styled, { css } from 'styled-components';

import { STYLING } from 'helpers/config';

export const Container = styled.div`
	scroll-margin-top: 80px;
`;

export const Header = styled.div`
	padding: 15px;
	margin: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 40px;
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};
	border-left: 1px solid ${(props) => props.theme.colors.border.primary};
	border-top-right-radius: ${STYLING.dimensions.radius.alt1};
	border-top-left-radius: ${STYLING.dimensions.radius.alt1};
`;

export const HeaderMain = styled.div`
	display: flex;
	align-items: center;
	gap: 20px;

	p {
		font-size: ${(props) => props.theme.typography.size.lg};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}

	.update-wrapper {
		padding: 2.5px 25px;
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
	gap: 12.5px;
`;

export const FilterWrapper = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	gap: 12.5px;
`;

export const FilterDropdown = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12.5px;
	padding: 0 20px;
`;

export const FilterDropdownHeader = styled.div`
	p {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xxSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.medium} !important;
		font-family: ${(props) => props.theme.typography.family.primary} !important;
		text-transform: uppercase;
	}
`;

export const FilterDivider = styled.div`
	height: 1px;
	width: 100%;
	margin: 15px 0 10px 0;
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};
`;

export const FilterDropdownActionSelect = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 15px;

	button {
		border-radius: ${STYLING.dimensions.radius.alt2} !important;
	}
`;

export const FilterApply = styled.div`
	margin: 15px 0 0 0;
`;

export const DateRangeWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
`;

export const DateRangeSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

export const DateRangeHeader = styled.div`
	display: flex;
	align-items: flex-end;
	flex-direction: column;
	gap: 15px;
	width: 100%;

	button {
		border-radius: ${STYLING.dimensions.radius.primary} !important;
	}
`;

export const DateLabel = styled.div`
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	color: ${(props) => props.theme.colors.font.primary};
`;

export const ClearDateButton = styled.button`
	background: ${(props) => props.theme.colors.button.alt1.background};
	color: ${(props) => props.theme.colors.button.alt1.color};
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.alt2};
	padding: 5px 10px;
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
	height: 20px;
	width: 1px;
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};

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
	height: 40px;
	min-width: 100%;
	width: fit-content;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 15px;
	padding: 0 15px;
	border: 1px solid ${(props) => props.theme.colors.border.primary};
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
		&:nth-child(3) {
			display: flex;
			justify-content: flex-end;
			text-align: right;
		}
	}
`;

export const BodyWrapper = styled.div<{
	childList?: boolean;
	isOverallLast?: boolean;
}>`
	width: 100%;

	> *:last-child {
		border-bottom: 1px solid
			${(props) =>
				props.childList && !props.isOverallLast
					? props.theme.colors.border.alt4
					: props.theme.colors.border.primary} !important;
	}

	.message-list-element {
		border-left: 1px solid
			${(props) => (props.childList ? props.theme.colors.border.alt4 : props.theme.colors.border.primary)};
		border-right: 1px solid
			${(props) => (props.childList ? props.theme.colors.border.alt4 : props.theme.colors.border.primary)};
		border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	}
`;
export const ElementWrapper = styled.div<{ open: boolean; lastChild?: boolean }>`
	height: 40px;
	min-width: 100%;
	width: fit-content;
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 15px;
	padding: 0 15px;
	cursor: pointer;
	background: ${(props) => props.theme.colors.container.primary.background};

	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	&:hover {
		background: ${(props) => props.theme.colors.container.primary.active};
		border-left: 1px solid ${(props) => props.theme.colors.border.alt4} !important;
		border-right: 1px solid ${(props) => props.theme.colors.border.alt4} !important;
		border-bottom: 1px solid ${(props) => props.theme.colors.border.alt4} !important;
	}

	&:hover::after {
		content: '';
		position: absolute;
		height: 1px;
		width: calc(100% + 2px);
		top: -1px;
		left: -1px;
		right: 0;
		bottom: 0;
		border-top: 1px solid ${(props) => props.theme.colors.border.alt4};
		transition: all 100ms;
	}

	${(props) =>
		props.open &&
		css`
			border-left: 1px solid ${props.theme.colors.border.alt4} !important;
			border-right: 1px solid ${props.theme.colors.border.alt4} !important;
			border-bottom: 1px solid ${props.theme.colors.border.alt4} !important;

			background: ${props.theme.colors.container.primary.active};

			&::after {
				content: '';
				position: absolute;
				height: 1px;
				width: calc(100% + 2px);
				top: -1px;
				left: -1px;
				right: 0;
				bottom: 0;
				border-top: 1px solid ${props.theme.colors.border.alt4};
				transition: all 100ms;
			}
		`}
`;

export const ElementItem = styled.div`
	display: flex;
`;

export const ID = styled(ElementItem)`
	min-width: 250px;
	width: 250px;
	display: flex;
	align-items: center;
	gap: 5px;
`;

export const TxAddress = styled.div`
	min-width: 165px;
	width: 165px;
`;

export const Variant = styled.div`
	min-width: 52.5px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${(props) => props.theme.colors.container.primary.active};
	border: 1px solid ${(props) => props.theme.colors.border.primary};

	span {
		color: ${(props) => props.theme.colors.font.primary} !important;
		text-transform: uppercase;
	}
`;

export const Action = styled(ElementItem)`
	min-width: 215px;
	width: 215px;
`;

export const ActionTooltip = styled.div`
	position: absolute;
	z-index: 2;
	top: 2.5px;
	left: calc(100% + 10px);
	display: none;
	white-space: nowrap;

	span {
		display: none; /* Removed */
		line-height: 1.65;
	}
`;

export const ActionValue = styled(Action)<{ background?: string; useMaxWidth: boolean }>`
	min-width: 215px;
	width: 215px;
	position: relative;

	.action-indicator {
		position: relative;
		width: ${(props) => (props.useMaxWidth ? '215px' : 'fit-content')};
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2.15px 7.5px;
		background: ${(props) => (props.background ? props.background : props.theme.colors.container.alt8.background)};
		border-radius: ${STYLING.dimensions.radius.alt2};

		&:hover {
			${ActionTooltip} {
				display: none; /* Removed */
			}
		}
	}

	p {
		max-width: 100%;
		color: ${(props) => props.theme.colors.font.light1} !important;
		font-size: ${(props) => props.theme.typography.size.xxSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
`;

export const To = styled(ElementItem)`
	min-width: 150px;
	width: 150px;
	justify-content: flex-end;
	p {
		text-align: right;
	}
`;

export const From = styled(ElementItem)`
	min-width: 150px;
	width: 150px;
	justify-content: flex-end;
	p {
		text-align: right;
	}
`;

export const Input = styled(ElementItem)`
	min-width: 75px;
	width: 75px;
	justify-content: center;
	p {
		text-align: right;
	}

	button {
		padding: 4.5px 12.5px !important
;
	}
`;

export const Output = styled(ElementItem)`
	min-width: 75px;
	width: 75px;
	justify-content: center;
	p {
		text-align: right;
	}

	button {
		padding: 4.5px 12.5px !important
;
	}
`;

export const Time = styled(ElementItem)`
	min-width: 115px;
	width: 115px;
	justify-content: flex-end;
	p {
		text-align: right;
	}
`;

export const Results = styled(ElementItem)<{ open?: boolean }>`
	min-width: 65px;
	width: 65px;
	justify-content: flex-end;
	svg {
		height: 15px;
		width: 15px;
		margin: 3.5px 0 0 0;
		transform: rotate(${(props) => (props.open ? '180deg' : '0deg')});
		transition: transform 0.15s ease-in-out;
	}
`;

export const OverlayWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 15px;
	padding: 0 20px;
`;

export const OverlayTagsWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 7.5px;
	margin: 2.5px 0 0 0;
`;

export const OverlayTagsHeader = styled.div`
	margin: 0 0 2.5px 0;
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
		gap: 5px;

		p {
			text-align: left;
		}
	}
`;

export const OverlayInfo = styled.div`
	display: flex;
	flex-direction: column;
	gap: 15px;
`;

export const OverlayInfoLine = styled.div`
	display: flex;
	gap: 7.5px;
`;

export const OverlayInfoLineValue = styled.div`
	p {
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
	gap: 15px;
	margin: 5px 0 0 auto;
`;

export const Editor = styled.div`
	height: 600px;
	width: 100%;
`;

export const FooterWrapper = styled.div`
	width: 100%;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	justify-content: space-between;
	gap: 15px;
	padding: 15px;
	background: ${(props) => props.theme.colors.container.alt1.background};
	border-left: 1px solid ${(props) => props.theme.colors.border.primary};
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary} !important;
	border-bottom-left-radius: ${STYLING.dimensions.radius.alt1};
	border-bottom-right-radius: ${STYLING.dimensions.radius.alt1};
`;

export const PageCounter = styled.div`
	display: flex;
	align-items: center;
	gap: 7.5px;

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
	padding: ${(props) => (props.childList ? '15px' : '0 15px 15px 15px')};
	border-left: 1px solid
		${(props) => (props.childList ? props.theme.colors.border.alt4 : props.theme.colors.border.primary)};
	border-right: 1px solid
		${(props) => (props.childList ? props.theme.colors.border.alt4 : props.theme.colors.border.primary)};
	border-bottom: 1px solid
		${(props) => (props.childList ? props.theme.colors.border.alt4 : props.theme.colors.border.primary)} !important;
	background: ${(props) =>
		props.childList ? props.theme.colors.container.alt2.background : props.theme.colors.container.primary.background};

	p {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		text-transform: uppercase;
	}
`;
