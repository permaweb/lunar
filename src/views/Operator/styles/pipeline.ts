import styled from 'styled-components';

import { STYLING } from 'helpers/config';

// Pipeline styles
export const PipelineActions = styled.div`
	display: flex;
	gap: 10px;
`;

export const PipelinePlaceholder = styled.div`
	padding: 10px;
	text-align: center;
	color: ${(props) => props.theme.colors.font.alt3};
	font-size: ${(props) => props.theme.typography.size.small};
`;

export const PipelineContainer = styled.div`
	padding: 10px;
	display: flex;
	flex-direction: column;
	gap: 10px;
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
	gap: 10px;
	padding: 5px 10px;

	&.clickable {
		cursor: pointer;
		user-select: none;

		&:hover {
			border-radius: ${STYLING.dimensions.radius.primary} ${STYLING.dimensions.radius.primary} 0 0;
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
	gap: 10px;
`;

export const PipelineItemContent = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 10px;
	padding-left: 10px;
`;

export const ServerBadge = styled.div`
	padding: 2px 5px;
	background-color: ${(props) => props.theme.colors.container.alt4.background};
	color: ${(props) => props.theme.colors.font.primary};
	border-radius: 3px;
	font-size: 10px;
	font-weight: bold;
`;

export const ParametersContainer = styled.div`
	padding: 10px;
	background-color: ${(props) => props.theme.colors.container.alt1.background};
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: 0 0 ${STYLING.dimensions.radius.primary} ${STYLING.dimensions.radius.primary};
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

export const DropIndicator = styled.div`
	height: 2px;
	background-color: ${(props) => props.theme.colors.link.color};
	margin: 5px 0;
	border-radius: 1px;
	opacity: 0.8;
`;

// Progress container for better organization
export const ProgressContainer = styled.div`
	padding: 0px 10px;
`;

// Progress bar styles
export const ProgressBarContainer = styled.div`
	width: 100%;
	height: 6px;
	background-color: ${(props) => props.theme.colors.container.alt2.background};
	border-radius: 3px;
	margin: 10px 0;
	overflow: hidden;
`;

export const ProgressBar = styled.div<{ progress: number }>`
	height: 100%;
	width: ${(props) => props.progress}%;
	background-color: ${(props) => props.theme.colors.link.color};
	border-radius: 3px;
	transition: width 0.3s ease;
`;

export const ProgressStatus = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 4px;
	font-size: ${(props) => props.theme.typography.size.xxxSmall};
	color: ${(props) => props.theme.colors.font.alt1};
`;

// Enhanced pipeline item for execution state
export const ExecutingPipelineItem = styled(PipelineItem)<{ isCurrentlyExecuting: boolean; isCompleted: boolean }>`
	${(props) =>
		props.isCurrentlyExecuting &&
		`
		border-color: ${props.theme.colors.link.color};
		background: ${props.theme.colors.container.alt8.background};
		box-shadow: 0 0 8px ${props.theme.colors.link.color}40;
		animation: pulse 2s ease-in-out infinite;
		
		@keyframes pulse {
			0%, 100% {
				box-shadow: 0 0 8px ${props.theme.colors.link.color}40;
			}
			50% {
				box-shadow: 0 0 12px ${props.theme.colors.link.color}60;
			}
		}
	`}

	${(props) =>
		props.isCompleted &&
		`
		border-color: ${props.theme.colors.border.alt5};
		background: ${props.theme.colors.container.alt3.background};
	`}
`;
