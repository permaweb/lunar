import styled from 'styled-components';

import { STYLING } from 'helpers/config';

// Actions and Devices styles
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
	border: 1px solid ${(props) => (props.method === 'GET' ? '#2e7d32' : '#ef6c00')};
	color: ${(props) => (props.method === 'GET' ? '#2e7d32' : '#ef6c00')};
	border-radius: ${STYLING.dimensions.radius.primary};
	font-size: 10px;
	font-weight: bold;
`;
