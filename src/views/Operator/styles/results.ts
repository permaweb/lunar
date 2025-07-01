import styled from 'styled-components';

import { STYLING } from 'helpers/config';

// Results display styles
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
