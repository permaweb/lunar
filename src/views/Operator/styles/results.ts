import styled from 'styled-components';

import { STYLING } from 'helpers/config';

// Results display styles
export const ResultsContainer = styled.div`
	width: 100%;
	height: 100%;
	overflow-y: auto;
	padding: 10px;
	gap: 10px;
	display: flex;
	flex-direction: column;
`;

export const ResultItem = styled.div`
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.primary};
	overflow: hidden;

	&:hover {
		border-color: ${(props) => props.theme.colors.link.color};
	}
`;

export const ResultHeader = styled.div<{ success?: boolean }>`
	padding: 5px 10px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	cursor: pointer;
	user-select: none;

	&:hover {
	}
`;

export const ResultInfo = styled.div`
	display: flex;
	flex-direction: column;
	gap: 5px;
`;

export const ResultTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-weight: bold;
	color: ${(props) => props.theme.colors.font.primary};
`;

export const ResultSubtitle = styled.div`
	font-size: ${(props) => props.theme.typography.size.xxxSmall};
	color: ${(props) => props.theme.colors.font.alt3};
`;

export const ResultStatus = styled.div<{ success: boolean }>`
	padding: 2px 5px;
	border: 1px solid ${(props) => (props.success ? '#2e7d32' : '#c62828')};
	color: ${(props) => (props.success ? '#2e7d32' : '#c62828')};
	border-radius: ${STYLING.dimensions.radius.primary};
	font-size: ${(props) => props.theme.typography.size.xxxSmall};
	font-weight: bold;
	text-transform: uppercase;
`;

export const ResultContent = styled.div`
	max-height: 200px;
	overflow-y: auto;
	padding: 10px;
	background-color: ${(props) => props.theme.colors.container.alt1.background};
	border-top: 0px solid ${(props) => props.theme.colors.border.primary};

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
	padding: 10px;
	background-color: ${(props) => props.theme.colors.container.alt2.background};
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};
	color: ${(props) => props.theme.colors.font.primary};
	font-size: ${(props) => props.theme.typography.size.xxxSmall};
	font-family: ${(props) => props.theme.typography.family.primary};

	strong {
		color: #d32f2f;
	}
`;
