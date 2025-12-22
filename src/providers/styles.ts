import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const WalletListContainer = styled.div`
	height: 100%;
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 20px;
	flex-wrap: wrap;
	padding: 20px 0;
`;

export const WalletListItem = styled.button`
	width: 200px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	padding: 15px;
	span {
		color: ${(props) => props.theme.colors.font.primary};
		font-size: ${(props) => props.theme.typography.size.base};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		font-family: ${(props) => props.theme.typography.family.primary};
	}
	&:hover {
		background: ${(props) => props.theme.colors.container.primary.active};
	}
`;

export const WalletLogo = styled.div`
	height: 35px;
	display: flex;
	align-items: center;
	justify-content: center;
	img {
		width: 30px;
		border-radius: 50%;
		margin: 0 0 10px 0;
	}
`;

export const WalletLink = styled.div`
	margin: 10px 0;
	padding: 0 20px;
	text-align: center;
	a,
	span {
		font-size: ${(props) => props.theme.typography.size.small};
		font-weight: ${(props) => props.theme.typography.weight.medium};
	}
	span {
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const MWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
`;

export const NodeSection = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 15px;
`;

export const NodeSectionHeader = styled.div`
	p {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		font-family: ${(props) => props.theme.typography.family.alt1} !important;
		text-transform: uppercase;
	}
`;

export const NodeList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

export const NodeItem = styled.div<{ active: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 15px;
	border-radius: ${STYLING.dimensions.radius.alt2};
	background: ${(props) =>
		props.active ? props.theme.colors.container.alt1.background : props.theme.colors.container.primary.background};
	border: 1px solid ${(props) => (props.active ? props.theme.colors.border.alt3 : props.theme.colors.border.primary)};
	transition: all 100ms;
	cursor: ${(props) => (props.active ? 'default' : 'pointer')};
	pointer-events: ${(props) => (!props.active ? 'all' : 'none')};

	&:hover {
		background: ${(props) => props.theme.colors.container.primary.active};
		border: 1px solid ${(props) => props.theme.colors.border.alt2};
	}
`;

export const NodeInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 12.5px;
	flex: 1;
`;

export const Indicator = styled.div<{ active: boolean }>`
	height: 12.5px;
	width: 12.5px;
	border-radius: 50%;
	background: ${(props) => (props.active ? props.theme.colors.indicator.active : 'transparent')};
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	transition: all 150ms;
`;

export const NodeDetails = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	overflow: hidden;

	p {
		color: ${(props) => props.theme.colors.font.primary};
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		font-family: ${(props) => props.theme.typography.family.primary};
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	span {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		font-family: ${(props) => props.theme.typography.family.primary};
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
`;

export const NodeRemove = styled.div`
	button {
		padding: 3.75px 0 0 0 !important;
	}
`;

export const NodeDivider = styled.div`
	width: 100%;
	display: flex;
	align-items: center;
	gap: 12.5px;
	margin: 1.5px 0;

	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		color: ${(props) => props.theme.colors.font.alt1};
		text-transform: uppercase;
	}

	.node-divider {
		height: 1px;
		flex: 1;
		border-top: 1px solid ${(props) => props.theme.colors.border.primary};
	}
`;

export const NodeAddSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;

	button {
		margin: 5px 0 0 0;
	}
`;
