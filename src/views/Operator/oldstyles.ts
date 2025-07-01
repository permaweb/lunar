import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
`;

// Layout grid wrapper (was missing!)
export const LayoutWrapper = styled.div`
	width: 100%;
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 25px;
	position: relative;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		grid-template-columns: repeat(1, 1fr);
	}
`;

// Toolbar styles
export const HeaderArea = styled.div`
	width: 100%;
	background: ${(props) => props.theme.colors.container.alt1.background};
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
`;

export const ToolbarWrapper = styled.div`
	width: 100%;
	position: relative;
	padding: 0px 25px;
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	justify-content: space-between;
	gap: 10px;
`;

export const UnifiedHeaderRow = styled.div`
	width: 100%;
	position: relative;
	padding: 0px 25px;
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
`;

export const TabsSection = styled.div`
	width: 100%;
	padding: 0px 25px;
	display: flex;
	justify-content: center;
`;

export const TabsCenter = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	flex: 1;
`;

export const ToolbarLeft = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: flex-start;
	gap: 10px;
	flex: 0 1 66px;
`;

export const ToolbarRight = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: flex-end;
	flex: 0 0 196px;
	gap: 10px;
`;

export const TabsWrapper = styled.div`
	display: flex;
	position: relative;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	gap: 10px;
`;

export const Tab = styled.div<{ active: boolean }>`
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	font-family: ${(props) => props.theme.typography.family.primary};
	color: ${(props) => (props.active ? props.theme.colors.font.primary : props.theme.colors.font.alt3)};
	cursor: pointer;
	position: relative;
	z-index: 1;
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 12.5px;
	padding: 12.5px 25.5px 10.5px 21.5px;
	margin: 0 0 -1.5px 0;
	background: ${(props) => (props.active ? props.theme.colors.view.background : 'transparent')};
	border-top: 2px solid ${(props) => (props.active ? props.theme.colors.border.alt5 : 'transparent')};
	white-space: nowrap;
	transition: all 100ms;

	.icon-wrapper {
		position: relative;
		width: 12.5px;
		height: 12.5px;
	}

	.normal-icon,
	.delete-icon {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		transition: all 100ms;
	}

	.normal-icon {
		svg {
			margin: 0 0 2.5px 0;
		}
	}

	.delete-icon {
		display: none;
		margin: 1.5px 0 0 0;
	}

	&:hover .normal-icon {
		display: none;
	}

	&:hover .delete-icon {
		display: block;

		button {
			background: transparent !important;

			&:hover {
				svg {
					color: ${(props) => props.theme.colors.warning.primary} !important;
					fill: ${(props) => props.theme.colors.warning.primary} !important;
				}
			}
		}
	}

	svg {
		height: 12.5px;
		width: 12.5px;
		color: ${(props) => (props.active ? props.theme.colors.font.primary : props.theme.colors.font.alt3)};
		fill: ${(props) => (props.active ? props.theme.colors.font.primary : props.theme.colors.font.alt3)};
	}

	&:hover {
		color: ${(props) => props.theme.colors.font.primary};

		svg {
			color: ${(props) => props.theme.colors.font.primary};
			fill: ${(props) => props.theme.colors.font.primary};
		}
	}

	&:before {
		display: block;
		content: '';
		position: absolute;
		z-index: 1;
		left: 0;
		transform: translate(-50%, 0);
		top: 0;
		background: ${(props) => (props.active ? props.theme.colors.border.primary : 'transparent')};
		height: 100%;
		width: 1px;
		pointer-events: none;
	}

	&:after {
		display: block;
		content: '';
		position: absolute;
		z-index: 1;
		right: -1px;
		transform: translate(-50%, 0);
		top: 0;
		background: ${(props) => (props.active ? props.theme.colors.border.primary : 'transparent')};
		height: 100%;
		width: 1px;
		pointer-events: none;
	}
`;

export const Menu = styled.div`
	display: flex;
	flex-direction: column;
	min-height: 500px;
`;

export const HeaderWrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 20px;
`;

export const Content = styled.div`
	display: flex;
	padding: 16px;
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
`;

// Layout Content component (separate from Toolbar Content)
export const LayoutContent = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	border-left: 1px solid ${(props) => props.theme.colors.border.primary};
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: 0px 0px ${STYLING.dimensions.radius.primary} ${STYLING.dimensions.radius.primary};
`;

// Server management styles
export const ServerListContainer = styled.div`
	margin-bottom: 20px;
`;

export const ServerListHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	padding-bottom: 10px;
	
	h3 {
		margin: 0;
		font-size: 14px;
		font-weight: bold;
		color: ${(props) => props.theme.colors.font.primary};
	}
`;

export const AddServerForm = styled.div`
	padding: 16px;
	background: ${(props) => props.theme.colors.container.alt1.background};
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.primary};
	margin-bottom: 16px;
	display: flex;
	flex-direction: column;
	gap: 16px;
	
	h4 {
		margin: 0 0 16px 0;
		font-size: 14px;
		color: ${(props) => props.theme.colors.font.primary};
	}
`;

export const FormFieldContainer = styled.div`
	margin-bottom: 16px;
`;

export const FormButtonContainer = styled.div`
	display: flex;
	gap: 8px;
	justify-content: flex-end;
`;

export const ServerItemsContainer = styled.div`
	margin-bottom: 16px;
`;

export const ServerItem = styled.div<{ isActive?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px;
	margin-bottom: 8px;
	background: ${(props) => (props.isActive ? props.theme.colors.container.primary.background : props.theme.colors.container.alt1.background)};
	border: ${(props) => (props.isActive ? `2px solid ${props.theme.colors.link.color}` : `2px solid ${props.theme.colors.border.primary}`)};
	border-radius: ${STYLING.dimensions.radius.primary};
	cursor: pointer;
	
	&:hover {
		background: ${(props) => props.theme.colors.container.primary.active};
	}
`;

export const ServerItemContent = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

export const ServerName = styled.div<{ isActive?: boolean }>`
	font-weight: bold;
	font-size: 14px;
	color: ${(props) => props.theme.colors.font.primary};

	.current-label {
		margin-left: 8px;
		font-size: 12px;
		color: ${(props) => props.theme.colors.link.color};
		font-weight: normal;
	}
`;

export const ServerUrl = styled.div`
	font-size: 12px;
	color: ${(props) => props.theme.colors.font.alt3};
	margin-top: 4px;
`;

// Layout styles  
export const SectionMain = styled.div`
	width: 100%;
	min-height: 500px;
	display: flex;
	flex-direction: row;
	gap: 20px;
	margin-bottom: 20px;
	padding: 20px;
`;

export const Section = styled.div<{ className?: string }>`
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

export const Header = styled.div<{ className?: string }>`
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

export const PipelineActions = styled.div`
	display: flex;
	gap: 8px;
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

export const ActionDeviceGroup = styled.div``;

export const ActionDeviceHeader = styled.div<{ className?: string }>`
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
	
	&.expanded {
		border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	}
	
	&.collapsed {
		border-bottom: none;
	}
`;

export const ExpandIcon = styled.span<{ className?: string }>`
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
		margin-left: 8px;
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

export const PipelineContainer = styled.div`
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 8px;
	height: 100%;
	overflow-y: auto;
`;

export const PipelineItem = styled.div<{ className?: string }>`
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.primary};
	background: ${(props) => props.theme.colors.container.primary.background};
	cursor: grab;
	transition: all 0.2s ease;

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

export const PipelineItemHeader = styled.div<{ className?: string }>`
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
			background: ${(props) => props.theme.colors.container.primary.active};
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

export const ServerBadge = styled.div`
	padding: 2px 6px;
	background-color: ${(props) => props.theme.colors.container.alt4.background};
	color: ${(props) => props.theme.colors.font.primary};
	border-radius: 3px;
	font-size: 10px;
	font-weight: bold;
`;

export const ParametersContainer = styled.div`
	margin-top: 8px;
	padding: 12px 20px 8px 20px;
	background-color: ${(props) => props.theme.colors.container.alt1.background};
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: 0 0 ${STYLING.dimensions.radius.primary} ${STYLING.dimensions.radius.primary};
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

export const DropIndicator = styled.div`
	height: 2px;
	background-color: ${(props) => props.theme.colors.link.color};
	margin: 4px 0;
	border-radius: 1px;
	opacity: 0.8;
`;

export const ResultsContainer = styled.div`
	width: 100%;
	height: 100%;
	overflow-y: auto;
	padding: 10px;
	max-height: 500px;
	display: flex;
	flex-direction: column;
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
	
	&:last-child {
		border-bottom: none;
	}
`;

export const ResultHeader = styled.div<{ success?: boolean }>`
	padding: 6px 10px;
	border-bottom: ${(props) => (props.success ? 'none' : '1px solid ' + props.theme.colors.border.primary)};
	display: flex;
	justify-content: space-between;
	align-items: center;
	cursor: pointer;
	user-select: none;
	background: ${(props) => (props.success ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)')};
	
	&:hover {
		background: ${(props) => (props.success ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)')};
	}
`;

export const ResultInfo = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
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
	
	strong {
		color: #d32f2f;
	}
`;

// Form styles from Layout
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
