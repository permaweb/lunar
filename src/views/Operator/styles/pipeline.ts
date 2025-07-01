import styled from 'styled-components';

import { STYLING } from 'helpers/config';

// Pipeline styles
export const PipelineActions = styled.div`
	display: flex;
	gap: 8px;
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
	padding: 6px 12px;

	&.clickable {
		cursor: pointer;
		user-select: none;

		&:hover {
			background: ${(props) => props.theme.colors.container.primary.active};
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
	padding: 8px;
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
