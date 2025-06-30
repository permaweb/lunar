import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	width: 100%;
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 25px;
	position: relative;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		grid-template-columns: repeat(1, 1fr);
	}
`;

export const SectionMain = styled.div`
	width: 100%;
	min-height: 500px;
	display: flex;
	flex-direction: row;
	gap: 20px;
	margin-bottom: 20px;
`;

export const Section = styled.div`
	display: flex;
	flex-direction: column;
	flex: 1;
	&.Small {
		flex: 0 0 320px;
	}
	&.Full {
		flex: 1 1 100%;
	}
	&.Fill {
		flex: 1;
	}
`;

export const Header = styled.div`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: ${(props) => props.theme.typography.size.small};
	font-weight: 600;
	color: ${(props) => props.theme.colors.font.primary};
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	padding: 10px 0px;
	background: ${(props) => props.theme.colors.container.alt1.background};
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};
	border-left: 1px solid ${(props) => props.theme.colors.border.primary};
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.primary} ${STYLING.dimensions.radius.primary} 0px 0px;
	&.Split {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: 10px 10px;
	}
	.Device {
		text-transform: uppercase;
		color: ${(props) => props.theme.colors.link.color} !important;
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}
`;

export const Content = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	border-left: 1px solid ${(props) => props.theme.colors.border.primary};
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: 0px 0px ${STYLING.dimensions.radius.primary} ${STYLING.dimensions.radius.primary};
`;

export const DeviceOptions = styled.div`
	width: 100%;
	display: flex;
	height: 100%;
	flex-direction: column;
`;

export const DeviceOption = styled.div`
	width: 100%;
	display: flex;
	height: 32.5px;
	align-items: center;
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	color: ${(props) => props.theme.colors.font.primary};
	padding: 0px 10px;
	&:last-child {
		border-bottom: none;
	}
	&:hover {
		background: ${(props) => props.theme.colors.container.primary.active};
		cursor: pointer;
	}
	&.active {
		background: ${(props) => props.theme.colors.container.alt9.background};
	}
`;

// Form styled components
export const ConfigurationFormContainer = styled.div`
	padding: 16px;
	display: flex;
	width: 100%;
	flex-direction: row;
	flex-wrap: wrap;
	gap: 16px;
`;

export const ConfigurationFormFieldWrapper = styled.div`
	&.full {
		flex: 1 1 100%;
	}
	&.half {
		flex: 1 1 45%;
	}
	&.third {
		flex: 1 1 29%;
	}
	&.quarter {
		flex: 1 1 22%;
	}
`;

export const FormFieldWrapper = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
`;

export const FormLabel = styled.label`
	display: block;
	font-weight: bold;
	text-transform: capitalize;
	color: ${(props) => props.theme.colors.font.primary};
	font-size: ${(props) => props.theme.typography.size.xSmall};
`;

export const FormDescription = styled.div`
	font-size: 12px;
	color: ${(props) => props.theme.colors.font.alt3};
	margin-bottom: 4px;
`;

export const ArrayContainer = styled.div`
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
`;

export const ArrayButtonContainer = styled.div``;

export const ArrayItem = styled.div`
	width: 100%;
	gap: 8px;
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.primary};
	padding: 12px;
	background: ${(props) => props.theme.colors.container.alt1.background};
`;

export const ArrayItemHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;

	strong {
		color: ${(props) => props.theme.colors.font.primary};
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}
`;

export const ArrayItemContent = styled.div`
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	gap: 8px;
	&.full {
		flex: 1 1 100%;
	}
	&.half {
		flex: 1 1 45%;
	}
	&.third {
		flex: 1 1 29%;
	}
	&.quarter {
		flex: 1 1 22%;
	}
`;

export const JSONWriterWrapper = styled.div`
	display: flex;
	width: 100%;
	height: 220px;
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.primary};
	> div > div {
		border-radius: ${STYLING.dimensions.radius.primary} !important;
	}
`;

// Actions styled components
export const ActionDeviceGroup = styled.div``;

export const ActionDeviceHeader = styled.div`
	padding: 8px 10px;
	background-color: ${(props) => props.theme.colors.container.alt8.background};
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	font-weight: bold;
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	color: ${(props) => props.theme.colors.font.primary};
	display: flex;
	justify-content: space-between;
	align-items: center;
	cursor: pointer;
	user-select: none;

	&:hover {
		background-color: ${(props) => props.theme.colors.container.primary.active};
	}
`;

export const ExpandIcon = styled.span`
	font-size: 10px;
	color: ${(props) => props.theme.colors.font.alt3};
	transition: transform 0.2s ease;

	&.expanded {
		transform: rotate(0deg);
	}

	&.collapsed {
		transform: rotate(-90deg);
	}
`;

export const ActionItem = styled(DeviceOption)`
	display: flex;
	justify-content: space-between;
	align-items: center;
	height: 40px;
	cursor: pointer;

	&:hover {
		background: ${(props) => props.theme.colors.container.primary.active};
	}
	&:last-child {
		margin-bottom: 10px;
	}
`;

export const ActionContent = styled.div`
	flex: 1;
`;

export const ActionName = styled.div`
	font-weight: bold;
	color: ${(props) => props.theme.colors.font.primary};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
`;

export const ActionDescription = styled.div`
	font-size: ${(props) => props.theme.typography.size.xxxSmall};
	color: ${(props) => props.theme.colors.font.alt3};

	&.inline {
		font-style: italic;
		opacity: 0.8;
	}
`;

export const MethodBadge = styled.div<{ method: string }>`
	padding: 2px 6px;
	background-color: ${(props) => (props.method === 'GET' ? '#e8f5e8' : '#fff3e0')};
	color: ${(props) => (props.method === 'GET' ? '#2e7d32' : '#ef6c00')};
	border-radius: 3px;
	font-size: 10px;
	font-weight: bold;
`;

export const PipelinePlaceholder = styled.div`
	padding: 16px;
	text-align: center;
	color: ${(props) => props.theme.colors.font.alt3};
	font-size: ${(props) => props.theme.typography.size.small};
`;

// Pipeline styled components
export const PipelineContainer = styled.div`
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 8px;
	height: 100%;
	overflow-y: auto;
`;

export const DropIndicator = styled.div`
	height: 2px;
	background-color: ${(props) => props.theme.colors.link.color};
	margin: 4px 0;
	border-radius: 1px;
	opacity: 0.8;
`;

export const PipelineItem = styled.div`
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.primary};
	background: ${(props) => props.theme.colors.container.primary.background};
	cursor: grab;

	&:hover {
		border-color: ${(props) => props.theme.colors.link.color};
	}

	&.dragging {
		opacity: 0.7;
		background: ${(props) => props.theme.colors.container.alt8.background};
		border: 2px dashed ${(props) => props.theme.colors.link.color};
		transform: scale(0.98);
	}

	&:active {
		cursor: grabbing;
	}
`;

export const PipelineItemHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 8px;
	margin-top: 8px;
	padding: 0px 12px;
	&.clickable {
		cursor: pointer;
		user-select: none;

		&:hover {
			border-radius: ${STYLING.dimensions.radius.primary};
		}
	}
`;

export const DragHandle = styled.span`
	color: ${(props) => props.theme.colors.font.alt3};
	font-size: 12px;
	cursor: grab;
	user-select: none;
	line-height: 1;

	&:active {
		cursor: grabbing;
	}
`;

export const PipelineItemTitle = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 0px;

	.device {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		color: ${(props) => props.theme.colors.link.color};
		font-weight: bold;
		text-transform: uppercase;
	}

	.action-row {
		display: flex;
		align-items: flex-end;
		gap: 8px;
	}

	.action {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		color: ${(props) => props.theme.colors.font.primary};
		font-weight: bold;
	}
`;

export const PipelineItemActions = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;

export const PipelineItemContent = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 8px;
	padding-left: 10px;
`;

// Parameter configuration styled components
export const ParameterField = styled.div`
	margin-bottom: 8px;
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

export const ParameterLabel = styled.label`
	font-size: ${(props) => props.theme.typography.size.xxxSmall};
	font-weight: bold;
	color: ${(props) => props.theme.colors.font.primary};
	text-transform: capitalize;
`;

export const ParameterInput = styled.input`
	padding: 6px 8px;
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.primary};
	background: ${(props) => props.theme.colors.container.primary.background};
	color: ${(props) => props.theme.colors.font.primary};
	font-size: ${(props) => props.theme.typography.size.xxxSmall};

	&:focus {
		outline: none;
		border-color: ${(props) => props.theme.colors.link.color};
	}

	&::placeholder {
		color: ${(props) => props.theme.colors.font.alt3};
	}
`;

export const JSONParameterWrapper = styled.div`
	display: flex;
	width: 100%;
	height: 120px;
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.primary};
	> div > div {
		border-radius: ${STYLING.dimensions.radius.primary} !important;
	}
`;

export const ParametersContainer = styled.div`
	margin-top: 8px;
	padding: 12px 20px 8px 20px;
	background-color: ${(props) => props.theme.colors.container.alt1.background};
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: 0 0 ${STYLING.dimensions.radius.primary} ${STYLING.dimensions.radius.primary};
`;

export const PipelineActions = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;

export const ServerBadge = styled.div`
	padding: 2px 6px;
	background-color: ${(props) => props.theme.colors.container.alt4.background};
	color: ${(props) => props.theme.colors.font.primary};
	border-radius: 3px;
	font-size: 10px;
	font-weight: bold;
`;

export const ResultsContainer = styled.div`
	width: 100%;
	height: 100%;
	overflow-y: auto;
	padding: 10px;
	max-height: 500px;
`;

export const ResultItem = styled.div`
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.primary};
	overflow: hidden;
	&:not(:last-child) {
		margin-bottom: 10px;
	}
	&:hover {
		border-color: ${(props) => props.theme.colors.link.color};
	}
`;

export const ResultHeader = styled.div<{ success: boolean }>`
	padding: 6px 10px;

	border-bottom: ${(props) => (props.success ? 'none' : '1px solid ' + props.theme.colors.border.primary)};
	display: flex;
	justify-content: space-between;
	align-items: center;
	cursor: pointer;
	user-select: none;
`;

export const ResultInfo = styled.div`
	display: flex;
	flex-direction: column;
`;

export const ResultTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-weight: bold;
	color: ${(props) => props.theme.colors.font.primary};
`;

export const ResultSubtitle = styled.div`
	font-size: ${(props) => props.theme.typography.size.xxxSmall};
	color: ${(props) => props.theme.colors.font.alt3};
`;

export const ResultStatus = styled.div<{ success: boolean }>`
	padding: 2px 6px;
	background-color: ${(props) => (props.success ? '#e8f5e8' : '#ffebee')};
	color: ${(props) => (props.success ? '#2e7d32' : '#c62828')};
	border-radius: 3px;
	font-size: 10px;
	font-weight: bold;
	text-transform: uppercase;
`;

export const ResultContent = styled.div`
	max-height: 200px;
	overflow-y: auto;
	padding: 16px;
	background-color: ${(props) => props.theme.colors.container.alt1.background};
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};

	pre {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		color: ${(props) => props.theme.colors.font.primary};
		font-family: ${(props) => props.theme.typography.family.primary};
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
	}
`;

export const ErrorContent = styled.div`
	padding: 16px;
	background-color: ${(props) => props.theme.colors.container.alt2.background};
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};
	color: ${(props) => props.theme.colors.font.primary};
	font-size: ${(props) => props.theme.typography.size.xxxSmall};
	font-family: ${(props) => props.theme.typography.family.primary};
`;
