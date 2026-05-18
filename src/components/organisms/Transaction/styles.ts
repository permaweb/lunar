import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div<{ isFullscreen?: boolean }>`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	gap: 25px;
	position: relative;

	&:fullscreen {
		background: ${(props) => props.theme.colors.container.primary.background};
		padding: 25px;
		overflow: auto;
	}
`;

export const HeaderWrapper = styled.form`
	width: 100%;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 20px;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		flex-direction: column;
		align-items: flex-start;
	}
`;

export const HeaderActionsWrapper = styled.div`
	display: flex;
	align-items: flex-start;
	flex-wrap: wrap;
	gap: 20px;
`;

export const BodyWrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	gap: 25px;
`;

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

export const ReadWrapper = styled.div<{ fullWidth: boolean }>`
	width: ${(props) => (props.fullWidth ? '100%' : 'calc(100% - 475px)')};
	display: flex;
	flex-direction: column;
	gap: 25px;

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
	gap: 15px;
	background: ${(props) => props.theme.colors.container.alt1.background};
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	border-top-left-radius: ${STYLING.dimensions.radius.alt1};
	border-top-right-radius: ${STYLING.dimensions.radius.alt1};
	padding: 12.5px 15px;
	p {
		font-size: ${(props) => props.theme.typography.size.lg};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}

	> div {
		padding: 0 !important;
		border-right: none !important;
	}
`;

export const MessageInfoBody = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);

	> {
		&:last-child,
		&:nth-child(3),
		&:nth-child(6) {
			justify-content: flex-end;
			text-align: right;
			border-right: none;
		}

		&:first-child,
		&:nth-child(2),
		&:nth-child(3),
		&:nth-child(4),
		&:nth-child(5),
		&:nth-child(6) {
			border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
		}

		&:nth-child(2),
		&:nth-child(5),
		&:nth-child(8) {
			padding: 10px 15px;
		}
	}

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		grid-template-columns: repeat(1, 1fr);

		> {
			&:nth-child(7),
			&:nth-child(8) {
				border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
			}

			&:last-child {
				border-bottom: none;
			}
		}
	}
`;

export const MessageInfoLine = styled.div`
	min-height: 47.5px;
	display: flex;
	align-items: center;
	gap: 7.5px;
	padding: 10px 15px;
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};

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
		padding: 15px;
	}
`;

export const MessageInfoID = styled(MessageInfoLine)`
	min-height: 35px;
	align-items: center !important;

	span {
		display: flex;
		margin: 1.5px 0 0 0;
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
	gap: 15px;
	padding: 12.5px 15px 17.5px 15px;
`;

export const TransferInfoHeader = styled(MessageInfoHeader)`
	padding: 0 0 12.5px 0;
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
`;

export const TransferInfoBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 15px;

	> * {
		&:not(:last-child) {
			border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
			padding: 0 0 15px 0;
		}
	}
`;

export const TransferInfoID = styled(MessageInfoID)``;

export const TransferInfoLine = styled(MessageInfoLine)`
	min-height: 22.5px;
	max-height: 45px;
	padding: 0;
	border-right: none;
	gap: 15px;

	> * {
		&:not(:last-child) {
			border-right: 1px solid ${(props) => props.theme.colors.border.primary};
			padding: 0 15px 0 0;
		}
	}

	> *:last-child {
		justify-content: flex-end;
	}
`;

export const TransferInfoLineElement = styled.div`
	display: flex;
	flex: 1;
	align-items: center;
	gap: 7.5px;
`;

export const TransferInfoAmount = styled.div<{ isNumber: boolean }>`
	display: flex;
	align-items: center;
	gap: 5px;

	p {
		font-size: ${(props) => props.theme.typography.size.small};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) =>
			props.isNumber ? props.theme.typography.weight.xBold : props.theme.typography.weight.bold};
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
		margin: 0 0 0 1.5px;
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
		height: 15px;
		width: 15px;
		object-fit: contain;
		margin: 6.5px 2.5px 0px 0;
	}
`;

export const TransferInfoStatus = styled.div`
	display: flex;
	flex: 1;
	align-items: center;
	gap: 7.5px;
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
			text-decoration-thickness: 1.25px;
		}
		svg {
			color: ${(props) => (props.disabled ? props.theme.colors.font.alt1 : props.theme.colors.link.active)} !important;
			fill: ${(props) => (props.disabled ? props.theme.colors.font.alt1 : props.theme.colors.link.active)} !important;
		}
	}
`;

export const TransferInfoStatusIndicator = styled.div<{ pending?: boolean; success?: boolean }>`
	height: 17.5px;
	width: 17.5px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: ${(props) =>
		props.pending
			? props.theme.colors.container.alt2.background
			: props.success
			? props.theme.colors.indicator.active
			: props.theme.colors.warning.primary};
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	margin: 0.5px 0 0 1.5px;

	svg {
		height: 9.5px;
		width: 9.5px;
		margin: 0 0 1px 0;
		color: ${(props) => props.theme.colors.font.light1};
		fill: ${(props) => props.theme.colors.font.light1};
	}
`;

export const MessagesWrapper = styled.div`
	width: 100%;
`;

export const Section = styled.div`
	height: fit-content;
	flex: 1;
	padding: 15px;

	img,
	video {
		max-height: calc(100vh - 275px);
		margin: 0 auto;
		border: 1px solid ${(props) => props.theme.colors.border.primary};
		border-radius: ${STYLING.dimensions.radius.primary};
		box-shadow: ${(props) => props.theme.colors.shadow.primary} 0px 1px 2px 0.5px;
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

export const SearchWrapper = styled.div`
	height: 38.5px;
	max-width: 100%;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 15px;
	position: relative;
	padding: 0 0 0 0.5px;

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		height: auto;
	}
`;

export const SearchInputWrapper = styled.div`
	width: 510px;
	max-width: 100%;
	position: relative;

	input {
		max-width: 100%;
		padding: 10px 10px 10px 42.5px !important;
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

export const InputActions = styled.div`
	width: 100%;
	display: flex;
	gap: 15px;
	justify-content: flex-end;
	margin: 15px 0 0 0;
`;

export const TxInfoWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 15px;
	flex-wrap: wrap;
`;

export const UpdateWrapper = styled.div`
	width: fit-content;
	padding: 4.5px 15px;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6.5px;
	background: ${(props) => props.theme.colors.container.alt8.background};
	border: 1px solid ${(props) => props.theme.colors.container.alt8.background};
	border-radius: ${STYLING.dimensions.radius.alt2};

	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.light1};
		text-align: center;
		text-transform: uppercase;
	}

	p {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.xBold};
		color: ${(props) => props.theme.colors.font.light1};
		text-align: center;
		text-transform: uppercase;
	}
`;

export const BalanceWrapper = styled(UpdateWrapper)<{ isNumber: boolean }>`
	p {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) =>
			props.isNumber ? props.theme.typography.weight.xBold : props.theme.typography.weight.bold};
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
		color: ${(props) => props.theme.colors.font.light1};
		fill: ${(props) => props.theme.colors.font.light1};
	}

	button {
		background: transparent !important;
		border: none !important;

		&:hover {
			opacity: 0.75 !important;
		}
	}
`;

export const NodeConnectionWrapper = styled.div``;

export const OverviewWrapper = styled.div`
	height: fit-content;
	display: flex;
	flex-direction: column;
	gap: 10px;

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		gap: 20px;
	}
`;

export const OverviewLine = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;

	p,
	span {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		white-space: nowrap;
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
		gap: 5px;

		p {
			text-align: left;
		}
	}
`;

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
	height: 150px;
	width: 150px;
	display: flex;
	justify-content: center;
	align-items: center;
	background: ${(props) => props.theme.colors.container.alt1.background};
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: 50%;

	svg {
		height: 85px;
		width: 85px;
		color: ${(props) => props.theme.colors.icon.primary.fill};
		fill: ${(props) => props.theme.colors.icon.primary.fill};
		margin: 7.5px 0 0 0;
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
