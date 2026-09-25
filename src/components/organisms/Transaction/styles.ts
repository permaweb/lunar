import styled from 'styled-components';

import { PrimitiveButton } from 'components/atoms/PrimitiveButton';
import { ExplorerControlStyles } from 'components/molecules/ExplorerControls';
import { STYLING } from 'helpers/config';

export const ColumnFlexWrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 25px;
`;

export const MessageHeaderWrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 25px;
`;

export const InfoWrapper = styled.div`
	width: 100%;
	display: flex;
	justify-content: space-between;
	gap: 25px;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		flex-direction: column-reverse;
	}
`;

export const TagsWrapper = styled.div`
	width: 450px;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		width: 100%;
	}
`;

export const SectionWrapperFlex = styled.div`
	width: calc(50% - 12.5px);
	flex: 1;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		width: 100%;
	}
`;

export const ReadWrapper = styled.div<{ fullWidth: boolean }>`
	width: ${(props) => (props.fullWidth ? '100%' : `calc(100% - 475px)`)};
	display: flex;
	flex-direction: column;
	gap: 25px;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		width: 100%;
	}
`;

export const Height = styled.div`
	a p {
		color: ${(props) => props.theme.colors.link.color};
	}

	a:hover p {
		color: ${(props) => props.theme.colors.link.active};
		text-decoration: underline;
		text-decoration-thickness: 1.25px;
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
	gap: 6.5px;
	padding: 0;
	background: transparent;
	border: none;

	p {
		color: ${(props) => props.theme.colors.link.color};
	}

	div {
		height: 12.5px;
		width: 12.5px;
	}

	svg {
		height: 12.5px;
		width: 12.5px;
		margin: 2px 0 0 0;
		color: ${(props) => props.theme.colors.link.color};
		fill: ${(props) => props.theme.colors.link.color};
	}

	&:hover {
		cursor: pointer;

		p {
			color: ${(props) => props.theme.colors.link.active};
			text-decoration: underline;
			text-decoration-thickness: 1.25px;
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
	gap: 12.5px;
	min-width: 0;
`;

export const AddressLabel = styled.small`
	width: fit-content;
	padding: 1px 5px;
	border-radius: ${STYLING.dimensions.radius.alt2};
	background: ${(props) => props.theme.colors.container.alt8.background};
	color: ${(props) => props.theme.colors.font.light1};
	font-size: ${(props) => props.theme.typography.size.xxxxSmall};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	white-space: nowrap;
`;

export const MessagesWrapper = styled.div`
	width: 100%;
`;

export const Section = styled.div<{ $fixedHeight?: number }>`
	height: ${(props) => (props.$fixedHeight ? `${props.$fixedHeight}px` : 'fit-content')};
	flex: 1;
	padding: 15px;
	overflow: hidden;

	img,
	video {
		max-height: calc(100vh - 245px);
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
	padding: 60px 20px;
	gap: 10px;
	text-align: center;
	min-height: 200px;

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
		padding: 6px 14px;
		background: ${(props) => props.theme.colors.container.alt2.background};
		border: 1px solid ${(props) => props.theme.colors.border.primary};
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
		margin-top: 10px;
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		color: ${(props) => props.theme.colors.font.link};
		text-decoration: none;
		transition: all 100ms;

		&:hover {
			text-decoration: underline;
			text-decoration-thickness: 1.25px;
		}
	}
`;

export const MediaWrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 20px;
	min-height: 200px;
	width: 100%;

	video {
		max-width: 100%;
		max-height: 500px;
		border-radius: ${STYLING.dimensions.radius.primary};
		background: ${(props) => props.theme.colors.container.primary.background};
	}

	audio {
		width: 100%;
		max-width: 600px;
	}
`;

export const MarkdownSection = styled.div`
	padding: 10px 0 0 0;
`;

export const SectionFull = styled.div`
	width: 100%;
`;

export const SectionHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: 0 0 15px 0;

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
	padding: 15px;
	margin: 0;
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};
	border-left: 1px solid ${(props) => props.theme.colors.border.primary};
	border-top-right-radius: ${STYLING.dimensions.radius.alt1};
	border-top-left-radius: ${STYLING.dimensions.radius.alt1};
`;

export const SectionFullUpdateWrapper = styled.div`
	padding: 0 15px 15px 15px;
`;

export const InputActions = styled.div`
	width: 100%;
	display: flex;
	gap: 15px;
	justify-content: flex-end;
	margin: 15px 0 0 0;
`;

export const BalanceWrapper = styled(ExplorerControlStyles.UpdateWrapper)<{ isNumber: boolean }>`
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
		margin: 0 0 0 1.5px;
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
	margin: 0 -4.5px 0 4.5px;

	svg {
		color: ${(props) => props.theme.colors.font.light1} !important;
	}

	button {
		background: transparent !important;
		border: none !important;
		padding: 2.5px 0 0 0 !important;

		&:hover {
			opacity: 0.75 !important;

			svg {
				color: ${(props) => props.theme.colors.font.light2} !important;
			}
		}
	}
`;

export const NodeConnectionWrapper = styled.div``;

export const OverviewDivider = styled.div`
	height: 1px;
	width: 100%;
	margin: 5px 0 0 0;
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};
`;

export const MessagesSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

export const MessagesPlaceholder = styled.div`
	padding: 0 15px 15px 15px;
	border-left: 1px solid ${(props) => props.theme.colors.border.primary};
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
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
	gap: 20px;
	padding: 80px 0;
`;

export const PlaceholderIcon = styled.div`
	height: 125px;
	width: 125px;
	display: flex;
	justify-content: center;
	align-items: center;
	border-radius: 50% !important;

	svg {
		height: 55px;
		width: 55px;
		color: ${(props) => props.theme.colors.icon.primary.fill};
		fill: ${(props) => props.theme.colors.icon.primary.fill};
		margin: 8.5px 0 0 0;
	}
`;

export const PlaceholderDescription = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	gap: 10px;

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
		max-width: 350px;
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;
