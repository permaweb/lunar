import styled, { DefaultTheme, keyframes } from 'styled-components';

import { PrimitiveButton } from 'components/atoms/PrimitiveButton';
import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

const tooltipFadeIn = keyframes`
	from {
		opacity: 0;
		transform: translateY(${CSS_DIMENSIONS.px3});
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
`;

const tooltipFadeInBelow = keyframes`
	from {
		opacity: 0;
		transform: translateY(-${CSS_DIMENSIONS.px3});
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
`;

export const Wrapper = styled.div<{ isFullscreen?: boolean }>`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px25};
	position: relative;

	&:fullscreen {
		background: ${(props) => props.theme.colors.container.primary.background};
		padding: ${CSS_DIMENSIONS.px25};
		overflow: auto;
	}
`;

export const HeaderWrapper = styled.form`
	width: 100%;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: ${CSS_DIMENSIONS.px20};

	@media (max-width: ${STYLING.cutoffs.initial}) {
		flex-direction: column;
		align-items: flex-start;
	}
`;

export const HeaderActionsWrapper = styled.div`
	display: flex;
	align-items: flex-start;
	flex-wrap: wrap;
	gap: ${CSS_DIMENSIONS.px20};
`;

export const BodyWrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	gap: ${CSS_DIMENSIONS.px25};
`;

export const ColumnFlexWrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px25};
`;

export const MessageHeaderWrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px25};
`;

export const InfoWrapper = styled.div`
	width: 100%;
	display: flex;
	justify-content: space-between;
	gap: ${CSS_DIMENSIONS.px25};

	@media (max-width: ${STYLING.cutoffs.initial}) {
		flex-direction: column-reverse;
	}
`;

export const TagsWrapper = styled.div`
	width: ${CSS_DIMENSIONS.px450};

	@media (max-width: ${STYLING.cutoffs.initial}) {
		width: 100%;
	}
`;

export const SectionWrapperFlex = styled.div`
	width: calc(50% - ${CSS_DIMENSIONS.px12_5});
	flex: 1;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		width: 100%;
	}
`;

export const ReadWrapper = styled.div<{ fullWidth: boolean }>`
	width: ${(props) => (props.fullWidth ? '100%' : `calc(100% - ${CSS_DIMENSIONS.px475})`)};
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px25};

	@media (max-width: ${STYLING.cutoffs.initial}) {
		width: 100%;
	}
`;

export const MessageInfo = styled.div`
	width: 100%;
`;

export const MessageInfoHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: ${CSS_DIMENSIONS.px15};
	background: ${(props) => props.theme.colors.container.alt1.background};
	border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-top-left-radius: ${STYLING.dimensions.radius.alt1};
	border-top-right-radius: ${STYLING.dimensions.radius.alt1};
	padding: ${CSS_DIMENSIONS.px12_5} ${CSS_DIMENSIONS.px15};

	p {
		display: flex;
		align-items: center;
		gap: ${CSS_DIMENSIONS.px7_5};

		font-size: ${(props) => props.theme.typography.size.lg};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};

		span {
			font-size: ${(props) => props.theme.typography.size.xxSmall};
			font-family: ${(props) => props.theme.typography.family.primary};
			font-weight: ${(props) => props.theme.typography.weight.bold};
			color: ${(props) => props.theme.colors.font.alt1};
		}
	}

	> div {
		padding: 0 !important;
		border-right: none !important;
	}
`;

function getDesktopLastRowBorderStyles(props: {
	$desktopItemCount?: number;
	$hideDesktopLastRowBorder?: boolean;
	theme: DefaultTheme;
}) {
	if (props.$desktopItemCount) {
		const lastRowStart = props.$desktopItemCount - ((props.$desktopItemCount - 1) % 3);
		const alignIncompleteLastItem =
			props.$desktopItemCount % 3 !== 0
				? `
					> *:last-child {
						justify-content: flex-start;
						text-align: left;
					}
				`
				: '';

		return `
			> * {
				border-bottom: ${CSS_DIMENSIONS.px1} solid ${props.theme.colors.border.primary};
			}

			> *:nth-child(n + ${lastRowStart}) {
				border-bottom: none;
			}

			${alignIncompleteLastItem}
		`;
	}

	if (!props.$hideDesktopLastRowBorder) return '';

	return `
		> *:nth-last-child(-n + 3) {
			border-bottom: none;
		}
	`;
}

export const MessageInfoBody = styled.div<{ $desktopItemCount?: number; $hideDesktopLastRowBorder?: boolean }>`
	display: grid;
	grid-template-columns: repeat(3, 1fr);

	> *:last-child,
	> *:nth-child(3n) {
		justify-content: flex-end;
		text-align: right;
		border-right: none;
	}

	> *:first-child,
	> *:nth-child(2),
	> *:nth-child(3),
	> *:nth-child(4),
	> *:nth-child(5),
	> *:nth-child(6) {
		border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	}

	> *:nth-child(3n + 2) {
		padding: ${CSS_DIMENSIONS.px10} ${CSS_DIMENSIONS.px15};
	}

	@media (min-width: ${STYLING.cutoffs.desktop}) {
		${getDesktopLastRowBorderStyles}
	}

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		grid-template-columns: repeat(1, 1fr);

		> * {
			justify-content: flex-start;
			text-align: left;
			border-right: none;
			border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
		}

		> *:last-child {
			border-bottom: none;
		}
	}
`;

export const TxOverviewValue = styled.div`
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px7_5};

	p {
		line-height: 1.35;
	}

	small {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
		line-height: 1.35;
	}
`;

export const MessageInfoLine = styled.div`
	min-height: ${CSS_DIMENSIONS.px47_5};
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px7_5};
	padding: ${CSS_DIMENSIONS.px10} ${CSS_DIMENSIONS.px15};
	border-right: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};

	span {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}

	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		flex-direction: column;
		align-items: flex-start;
		border-right: none;
		padding: ${CSS_DIMENSIONS.px15};
	}
`;

export const Height = styled.div`
	a p {
		color: ${(props) => props.theme.colors.link.color};
	}

	a:hover p {
		color: ${(props) => props.theme.colors.link.active};
		text-decoration: underline;
		text-decoration-thickness: ${CSS_DIMENSIONS.px1_25};
	}
`;

export const HashLink = styled.div`
	max-width: 100%;

	p {
		color: ${(props) => props.theme.colors.link.color};
	}
`;

export const CopyableValue = styled(PrimitiveButton)`
	max-width: 100%;
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px6_5};
	padding: 0;
	background: transparent;
	border: none;

	p {
		color: ${(props) => props.theme.colors.link.color};
	}

	div {
		height: ${CSS_DIMENSIONS.px12_5};
		width: ${CSS_DIMENSIONS.px12_5};
	}

	svg {
		height: ${CSS_DIMENSIONS.px12_5};
		width: ${CSS_DIMENSIONS.px12_5};
		margin: ${CSS_DIMENSIONS.px2} 0 0 0;
		color: ${(props) => props.theme.colors.link.color};
		fill: ${(props) => props.theme.colors.link.color};
	}

	&:hover {
		cursor: pointer;

		p {
			color: ${(props) => props.theme.colors.link.active};
			text-decoration: underline;
			text-decoration-thickness: ${CSS_DIMENSIONS.px1_25};
		}

		svg {
			color: ${(props) => props.theme.colors.link.active};
			fill: ${(props) => props.theme.colors.link.active};
		}
	}
`;

export const LabeledAddress = styled.div`
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px12_5};
	min-width: 0;
`;

export const AddressLabel = styled.small`
	width: fit-content;
	padding: ${CSS_DIMENSIONS.px1} ${CSS_DIMENSIONS.px5};
	border-radius: ${STYLING.dimensions.radius.alt2};
	background: ${(props) => props.theme.colors.container.alt8.background};
	color: ${(props) => props.theme.colors.font.light1};
	font-size: ${(props) => props.theme.typography.size.xxxxSmall};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	white-space: nowrap;
`;

export const MessageInfoID = styled(MessageInfoLine)`
	min-height: ${CSS_DIMENSIONS.px35};
	align-items: center !important;

	span {
		display: flex;
		margin: ${CSS_DIMENSIONS.px1_5} 0 0 0;
	}

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		flex-direction: row;
		align-items: flex-start;
	}
`;

export const TransferInfo = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px15};
	padding: ${CSS_DIMENSIONS.px12_5} ${CSS_DIMENSIONS.px15} ${CSS_DIMENSIONS.px17_5} ${CSS_DIMENSIONS.px15};
`;

export const TransferInfoHeader = styled(MessageInfoHeader)`
	padding: 0 0 ${CSS_DIMENSIONS.px12_5} 0;
	border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
`;

export const TransferInfoBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px15};

	> * {
		&:not(:last-child) {
			border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
			padding: 0 0 ${CSS_DIMENSIONS.px15} 0;
		}
	}

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		gap: 0;

		> * {
			&:not(:last-child) {
				border-bottom: none;
				padding: 0;
			}
		}
	}
`;

export const TransferInfoID = styled(MessageInfoID)``;

export const TransferInfoLine = styled(MessageInfoLine)`
	min-height: ${CSS_DIMENSIONS.px22_5};
	max-height: ${CSS_DIMENSIONS.px45};
	padding: 0;
	border-right: none;
	gap: ${CSS_DIMENSIONS.px15};

	> * {
		&:not(:last-child) {
			border-right: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
			padding: 0 ${CSS_DIMENSIONS.px15} 0 0;
		}
	}

	> *:last-child {
		justify-content: flex-end;
	}

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		width: 100%;
		max-height: none;
		align-items: stretch;
		gap: 0;

		> * {
			width: 100%;
			min-height: ${CSS_DIMENSIONS.px47_5};
			flex: none;
			justify-content: center;
			border-right: none;
			border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
			padding: ${CSS_DIMENSIONS.px15} 0;
		}

		> *:not(:last-child) {
			border-right: none;
			padding: ${CSS_DIMENSIONS.px15} 0;
		}

		> *:last-child {
			justify-content: center;
		}

		&:last-child > *:last-child {
			border-bottom: none;
		}
	}
`;

export const TransferInfoLineElement = styled.div`
	display: flex;
	flex: 1;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px7_5};

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		flex-direction: column;
		align-items: flex-start;
	}
`;

export const TransferInfoAmount = styled.div<{ isNumber: boolean }>`
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px5};

	p {
		font-size: ${(props) => props.theme.typography.size.small};
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

export const TransferLogoWrapper = styled.div``;

export const TransferLogo = styled.div<{ dimensions: number; margin?: string }>`
	div {
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

	img {
		height: ${CSS_DIMENSIONS.px15};
		width: ${CSS_DIMENSIONS.px15};
		object-fit: contain;
		margin: ${CSS_DIMENSIONS.px6_5} ${CSS_DIMENSIONS.px2_5} ${CSS_DIMENSIONS.px0} 0;
	}
`;

export const TransferInfoStatus = styled.div`
	display: flex;
	flex: 1;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px7_5};
	border-right: none !important;

	span {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}

	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		flex-wrap: wrap;
		justify-content: flex-start;

		span {
			flex-basis: 100%;
		}
	}
`;

export const TransferInfoResult = styled.div<{ disabled: boolean }>`
	p {
		color: ${(props) => (props.disabled ? props.theme.colors.font.alt1 : props.theme.colors.link.color)} !important;
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		max-width: 100% !important;
		transition: all 100ms;
	}

	&:hover {
		cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
		p {
			color: ${(props) => (props.disabled ? props.theme.colors.font.alt1 : props.theme.colors.link.active)} !important;
			text-decoration: ${(props) => (props.disabled ? 'none' : 'underline')};
			text-decoration-thickness: ${CSS_DIMENSIONS.px1_25};
		}
		svg {
			color: ${(props) => (props.disabled ? props.theme.colors.font.alt1 : props.theme.colors.link.active)} !important;
			fill: ${(props) => (props.disabled ? props.theme.colors.font.alt1 : props.theme.colors.link.active)} !important;
		}
	}
`;

export const TransferInfoStatusIndicator = styled.div<{ pending?: boolean; success?: boolean }>`
	height: ${CSS_DIMENSIONS.px17_5};
	width: ${CSS_DIMENSIONS.px17_5};
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: ${(props) =>
		props.pending
			? props.theme.colors.warning.caution
			: props.success
			? props.theme.colors.indicator.active
			: props.theme.colors.warning.primary};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	margin: ${CSS_DIMENSIONS.px0_5} 0 0 ${CSS_DIMENSIONS.px1_5};

	svg {
		height: ${CSS_DIMENSIONS.px9_5};
		width: ${CSS_DIMENSIONS.px9_5};
		margin: 0 0 ${CSS_DIMENSIONS.px1} 0;
		color: ${(props) => props.theme.colors.font.light1};
		fill: ${(props) => props.theme.colors.font.light1};
	}
`;

export const MessagesWrapper = styled.div`
	width: 100%;
`;

export const Section = styled.div<{ $fixedHeight?: number }>`
	height: ${(props) => (props.$fixedHeight ? `${props.$fixedHeight}px` : 'fit-content')};
	flex: 1;
	padding: ${CSS_DIMENSIONS.px15};
	overflow: hidden;

	img,
	video {
		max-height: calc(100vh - ${CSS_DIMENSIONS.px245});
		margin: 0 auto;
		border-radius: ${STYLING.dimensions.radius.primary};
	}

	@media (max-width: ${STYLING.cutoffs.initial}) {
		width: 100%;
	}
`;

export const DataSection = styled(Section)`
	display: flex;
	flex-direction: column;
	padding: 0;
`;

export const HTMLDataPreviewContainer = styled.div`
	position: relative;
	width: 100%;
`;

export const HTMLPreviewProbe = styled.div<{ $visible: boolean }>`
	width: 100%;

	${(props) =>
		!props.$visible &&
		`
			position: absolute;
			inset: 0;
			opacity: 0;
			visibility: hidden;
			pointer-events: none;
		`}
`;

export const UnsupportedContent = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: ${CSS_DIMENSIONS.px60} ${CSS_DIMENSIONS.px20};
	gap: ${CSS_DIMENSIONS.px10};
	text-align: center;
	min-height: ${CSS_DIMENSIONS.px200};

	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		margin: 0;
	}

	span {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		color: ${(props) => props.theme.colors.font.primary};
		margin: 0;
		padding: ${CSS_DIMENSIONS.px6} ${CSS_DIMENSIONS.px14};
		background: ${(props) => props.theme.colors.container.alt2.background};
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
		border-radius: ${STYLING.dimensions.radius.primary};
		font-family: monospace;
	}

	small {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.regular};
		color: ${(props) => props.theme.colors.font.secondary};
		margin: 0;
	}

	a {
		margin-top: ${CSS_DIMENSIONS.px10};
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		color: ${(props) => props.theme.colors.font.link};
		text-decoration: none;
		transition: all 100ms;

		&:hover {
			text-decoration: underline;
			text-decoration-thickness: ${CSS_DIMENSIONS.px1_25};
		}
	}
`;

export const MediaWrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: ${CSS_DIMENSIONS.px20};
	min-height: ${CSS_DIMENSIONS.px200};
	width: 100%;

	video {
		max-width: 100%;
		max-height: ${CSS_DIMENSIONS.px500};
		border-radius: ${STYLING.dimensions.radius.primary};
		background: ${(props) => props.theme.colors.container.primary.background};
	}

	audio {
		width: 100%;
		max-width: ${CSS_DIMENSIONS.px600};
	}
`;

export const MarkdownSection = styled.div`
	padding: ${CSS_DIMENSIONS.px10} 0 0 0;
`;

export const SectionFull = styled.div`
	width: 100%;
`;

export const SectionHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: 0 0 ${CSS_DIMENSIONS.px15} 0;

	p {
		font-size: ${(props) => props.theme.typography.size.lg};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}

	span {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt2};
	}
`;

export const SectionHeaderFull = styled(SectionHeader)`
	padding: ${CSS_DIMENSIONS.px15};
	margin: 0;
	border-top: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-right: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-left: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-top-right-radius: ${STYLING.dimensions.radius.alt1};
	border-top-left-radius: ${STYLING.dimensions.radius.alt1};
`;

export const SectionFullUpdateWrapper = styled.div`
	padding: 0 ${CSS_DIMENSIONS.px15} ${CSS_DIMENSIONS.px15} ${CSS_DIMENSIONS.px15};
`;

export const SearchWrapper = styled.div`
	height: ${CSS_DIMENSIONS.px38_5};
	max-width: 100%;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: ${CSS_DIMENSIONS.px15};
	position: relative;
	padding: 0 0 0 ${CSS_DIMENSIONS.px0_5};

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		height: auto;
	}
`;

export const SearchInputWrapper = styled.div`
	width: ${CSS_DIMENSIONS.px510};
	max-width: 100%;
	position: relative;

	input {
		max-width: 100%;
		padding: ${CSS_DIMENSIONS.px10} ${CSS_DIMENSIONS.px10} ${CSS_DIMENSIONS.px10} ${CSS_DIMENSIONS.px42_5} !important;
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

export const BlockNavigationWrapper = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: ${CSS_DIMENSIONS.px15};
	padding: 0 0 0 ${CSS_DIMENSIONS.px15};
	border-left: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
`;

export const InputActions = styled.div`
	width: 100%;
	display: flex;
	gap: ${CSS_DIMENSIONS.px15};
	justify-content: flex-end;
	margin: ${CSS_DIMENSIONS.px15} 0 0 0;
`;

export const TxInfoWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px15};
	flex-wrap: wrap;
`;

export const UpdateWrapper = styled.div`
	min-height: ${CSS_DIMENSIONS.px30};
	width: fit-content;
	padding: ${CSS_DIMENSIONS.px5_5} ${CSS_DIMENSIONS.px15} ${CSS_DIMENSIONS.px4_5} ${CSS_DIMENSIONS.px15};
	display: flex;
	align-items: center;
	justify-content: center;
	gap: ${CSS_DIMENSIONS.px6_5};
	background: ${(props) => props.theme.colors.container.alt8.background};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.container.alt8.background};
	border-radius: ${STYLING.dimensions.radius.alt2};

	span {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.light1};
		text-align: center;
	}

	p {
		font-size: ${(props) => props.theme.typography.size.xxxxSmall};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.light1};
		text-align: center;
	}
`;

export const UpdateWrapperType = styled(UpdateWrapper)`
	padding: ${CSS_DIMENSIONS.px5_5} ${CSS_DIMENSIONS.px15} ${CSS_DIMENSIONS.px4_5} ${CSS_DIMENSIONS.px13_5};
	gap: ${CSS_DIMENSIONS.px9_5};

	div {
		height: ${CSS_DIMENSIONS.px12};
		width: ${CSS_DIMENSIONS.px12};
		display: flex;
		align-items: center;
		justify-content: center;
	}

	svg {
		height: ${CSS_DIMENSIONS.px12};
		width: ${CSS_DIMENSIONS.px12};
		color: ${(props) => props.theme.colors.font.light2};
		fill: ${(props) => props.theme.colors.font.light2};
	}
`;

export const BalanceWrapper = styled(UpdateWrapper)<{ isNumber: boolean }>`
	p {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) =>
			props.isNumber ? props.theme.typography.weight.bold : props.theme.typography.weight.bold};
		color: ${(props) => (props.isNumber ? props.theme.colors.font.light1 : props.theme.colors.font.light2)};
		text-align: center;
		text-transform: none;
	}
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
		color: ${(props) => props.theme.colors.font.light1};
		fill: ${(props) => props.theme.colors.font.light1};
		margin: ${(props) => props.margin ?? '0'};

		path {
			color: ${(props) => props.theme.colors.font.light1};
			fill: ${(props) => props.theme.colors.font.light1};
		}
	}
`;

export const Refresh = styled.div`
	margin: 0 -${CSS_DIMENSIONS.px4_5} 0 ${CSS_DIMENSIONS.px4_5};

	svg {
		color: ${(props) => props.theme.colors.font.light1} !important;
	}

	button {
		background: transparent !important;
		border: none !important;

		&:hover {
			opacity: 0.75 !important;

			svg {
				color: ${(props) => props.theme.colors.font.light2} !important;
			}
		}
	}
`;

export const NodeConnectionWrapper = styled.div``;

export const OverviewWrapper = styled.div<{ $fixedHeight?: number; $hasOverflow?: boolean }>`
	height: ${(props) => (props.$fixedHeight ? `calc(${props.$fixedHeight}px - ${CSS_DIMENSIONS.px80})` : 'fit-content')};
	max-height: ${CSS_DIMENSIONS.px526_5};
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px10};
	padding-right: ${(props) => (props.$hasOverflow ? `${CSS_DIMENSIONS.px12_5}` : '0')};

	> * {
		&:not(:last-child) {
			padding: 0 0 ${CSS_DIMENSIONS.px10} 0;
			border-bottom: ${CSS_DIMENSIONS.px1} dotted ${(props) => props.theme.colors.border.primary};
		}
	}

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		gap: ${CSS_DIMENSIONS.px20};
	}
`;

export const OverviewLine = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	max-height: ${CSS_DIMENSIONS.px30};

	p,
	span {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		white-space: nowrap;
		line-height: 1.05;
	}

	p {
		color: ${(props) => props.theme.colors.font.primary};
		text-align: right;
		text-align: right;
		max-width: 45%;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	span {
		color: ${(props) => props.theme.colors.font.alt1};
		max-width: 45%;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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

export const TagValue = styled(PrimitiveButton)<{ $tooltipVisible?: boolean }>`
	position: relative;
	max-width: 45%;
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
		transform: ${(props) => (props.$tooltipVisible ? 'translateY(0)' : `translateY(${CSS_DIMENSIONS.px3})`)};
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

export const TagValueTooltip = styled.div<{
	$placement?: 'top' | 'bottom';
	$position?: {
		top?: number;
		bottom?: number;
		left?: number;
		right?: number;
		maxWidth: number;
	} | null;
}>`
	position: fixed;
	z-index: 1000;
	top: ${(props) => (props.$position?.top !== undefined ? `${props.$position.top}px` : 'auto')};
	bottom: ${(props) => (props.$position?.bottom !== undefined ? `${props.$position.bottom}px` : 'auto')};
	left: ${(props) => (props.$position?.left !== undefined ? `${props.$position.left}px` : 'auto')};
	right: ${(props) => (props.$position?.right !== undefined ? `${props.$position.right}px` : 'auto')};
	opacity: 1;
	visibility: visible;
	transform: translateY(0);
	width: max-content;
	max-width: ${(props) => (props.$position ? `${props.$position.maxWidth}px` : `${CSS_DIMENSIONS.px400}`)};
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
	animation: ${(props) => (props.$placement === 'bottom' ? tooltipFadeInBelow : tooltipFadeIn)} 140ms ease;
	transition: opacity 140ms ease, transform 140ms ease, visibility 0s linear 140ms;
`;

export const OverviewDivider = styled.div`
	height: ${CSS_DIMENSIONS.px1};
	width: 100%;
	margin: ${CSS_DIMENSIONS.px5} 0 0 0;
	border-top: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
`;

export const MessagesSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px10};
`;

export const MessagesPlaceholder = styled.div`
	padding: 0 ${CSS_DIMENSIONS.px15} ${CSS_DIMENSIONS.px15} ${CSS_DIMENSIONS.px15};
	border-left: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-right: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-bottom-left-radius: ${STYLING.dimensions.radius.alt1};
	border-bottom-right-radius: ${STYLING.dimensions.radius.alt1};

	span {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}
`;

export const Placeholder = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: ${CSS_DIMENSIONS.px20};
	padding: ${CSS_DIMENSIONS.px80} 0;
`;

export const PlaceholderIcon = styled.div`
	height: ${CSS_DIMENSIONS.px150};
	width: ${CSS_DIMENSIONS.px150};
	display: flex;
	justify-content: center;
	align-items: center;
	background: ${(props) => props.theme.colors.container.alt1.background};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-radius: 50%;

	svg {
		height: ${CSS_DIMENSIONS.px85};
		width: ${CSS_DIMENSIONS.px85};
		color: ${(props) => props.theme.colors.icon.primary.fill};
		fill: ${(props) => props.theme.colors.icon.primary.fill};
		margin: ${CSS_DIMENSIONS.px7_5} 0 0 0;
	}
`;

export const PlaceholderDescription = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px10};

	p,
	span {
		text-align: center;
	}

	p {
		font-size: ${(props) => props.theme.typography.size.small};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}

	span {
		display: block;
		max-width: ${CSS_DIMENSIONS.px350};
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;
