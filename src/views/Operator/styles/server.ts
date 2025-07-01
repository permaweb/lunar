import styled from 'styled-components';

import { STYLING } from 'helpers/config';

// Server management styles
export const ServerListContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

export const ServerListHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	padding: 0px 10px 10px 10px;

	h3 {
		margin: 0;
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-weight: bold;
		color: ${(props) => props.theme.colors.font.primary};
	}
`;

export const AddServerForm = styled.div`
	padding: 10px;
	background: ${(props) => props.theme.colors.container.alt1.background};
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.primary};
	display: flex;
	flex-direction: column;
	gap: 10px;

	h4 {
		margin: 0 0 5px 0;
		font-size: 14px;
		color: ${(props) => props.theme.colors.font.primary};
	}
`;

export const FormFieldContainer = styled.div``;

export const FormButtonContainer = styled.div`
	display: flex;
	gap: 10px;
	justify-content: flex-end;
`;

export const ServerItemsContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

export const ServerItem = styled.div<{ isActive?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px;
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
`;

export const ServerName = styled.div<{ isActive?: boolean }>`
	font-weight: bold;
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	color: ${(props) => props.theme.colors.font.primary};

	.current-label {
		margin-left: 8px;
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		color: ${(props) => props.theme.colors.link.color};
		font-weight: normal;
	}
`;

export const ServerUrl = styled.div`
	font-size: ${(props) => props.theme.typography.size.xxxSmall};
	color: ${(props) => props.theme.colors.font.alt3};
`;
