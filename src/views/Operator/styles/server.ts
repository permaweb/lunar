import styled from 'styled-components';

import { STYLING } from 'helpers/config';

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
	gap: 8px;

	h4 {
		margin: 0 0 8px 0;
		font-size: 14px;
		color: ${(props) => props.theme.colors.font.primary};
	}
`;

export const FormFieldContainer = styled.div``;

export const FormButtonContainer = styled.div`
	display: flex;
	gap: 8px;
	margin-top: 8px;
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
	background: ${(props) =>
		props.isActive ? props.theme.colors.container.primary.background : props.theme.colors.container.alt1.background};
	border: ${(props) =>
		props.isActive ? `2px solid ${props.theme.colors.link.color}` : `2px solid ${props.theme.colors.border.primary}`};
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
