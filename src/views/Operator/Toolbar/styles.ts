import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	width: 100%;
	position: relative;
	padding: 0px 25px;
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	justify-content: space-between;
	gap: 10px;
`;

export const Menu = styled.div``;

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

export const HeaderWrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 20px;
`;

export const Left = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: flex-start;
	gap: 10px;
	flex: 0 1 66px;
`;

export const TabsWrapper = styled.div`
	display: flex;
	position: relative;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	gap: 10px;
	flex: 1 1 auto;
`;

export const Right = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: flex-end;
	flex: 0 0 196px;
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

// Server Management Styles
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

export const ServerItemsContainer = styled.div`
	margin-bottom: 16px;
`;

export const ServerItem = styled.div<{ isActive: boolean }>`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px;
	margin-bottom: 8px;
	background-color: ${(props) =>
		props.isActive ? props.theme.colors.container.primary.background : props.theme.colors.container.alt1.background};
	border: ${(props) =>
		props.isActive ? `2px solid ${props.theme.colors.link.color}` : `2px solid ${props.theme.colors.border.primary}`};
	border-radius: ${STYLING.dimensions.radius.primary};
	cursor: pointer;

	&:hover {
		background-color: ${(props) => props.theme.colors.container.primary.active};
	}
`;

export const ServerItemContent = styled.div`
	flex: 1;
`;

export const ServerName = styled.div<{ isActive: boolean }>`
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

export const AddServerForm = styled.div`
	padding: 16px;
	background-color: ${(props) => props.theme.colors.container.alt1.background};
	border-radius: ${STYLING.dimensions.radius.primary};
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	margin-bottom: 16px;
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
