import styled from 'styled-components';

import { PrimitiveButton } from 'components/atoms/PrimitiveButton';
import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const WalletListContainer = styled.div`
	height: 100%;
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: ${CSS_DIMENSIONS.px20};
	flex-wrap: wrap;
	padding: ${CSS_DIMENSIONS.px20} 0;
`;

export const WalletListItem = styled(PrimitiveButton)`
	width: ${CSS_DIMENSIONS.px200};
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	padding: ${CSS_DIMENSIONS.px15};
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
	height: ${CSS_DIMENSIONS.px35};
	display: flex;
	align-items: center;
	justify-content: center;
	img {
		width: ${CSS_DIMENSIONS.px35};
		border-radius: 50%;
		margin: 0 0 ${CSS_DIMENSIONS.px10} 0;
	}
`;

export const WalletLink = styled.div`
	margin: ${CSS_DIMENSIONS.px10} 0;
	padding: 0 ${CSS_DIMENSIONS.px20};
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
	gap: ${CSS_DIMENSIONS.px20};
`;

export const NodeSection = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px15};
`;

export const NodeSectionHeader = styled.div`
	p {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		font-family: ${(props) => props.theme.typography.family.primary} !important;
	}
`;

export const NodeDisplayOption = styled.label`
	display: flex;
	align-items: flex-start;
	gap: ${CSS_DIMENSIONS.px10};
	padding: ${CSS_DIMENSIONS.px10} ${CSS_DIMENSIONS.px12};
	background: ${(props) => props.theme.colors.container.primary.background};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.alt2};
	cursor: pointer;
	transition: all 100ms;

	&:hover {
		background: ${(props) => props.theme.colors.container.primary.active};
		border-color: ${(props) => props.theme.colors.border.alt2};
	}

	> div:first-child {
		flex: none;
		margin: ${CSS_DIMENSIONS.px3_5} 0 0 0;
	}
`;

export const NodeDisplayOptionText = styled.div`
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px3};

	span {
		color: ${(props) => props.theme.colors.font.primary};
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		font-family: ${(props) => props.theme.typography.family.primary};
		line-height: 1.35;
	}

	p {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		font-family: ${(props) => props.theme.typography.family.primary};
		line-height: 1.45;
	}
`;

export const NodeList = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px10};
`;

export const NodeItem = styled.div<{ active: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: ${CSS_DIMENSIONS.px12} ${CSS_DIMENSIONS.px15};
	border-radius: ${STYLING.dimensions.radius.alt2};
	background: ${(props) =>
		props.active ? props.theme.colors.container.alt1.background : props.theme.colors.container.primary.background};
	border: ${CSS_DIMENSIONS.px1} solid
		${(props) => (props.active ? props.theme.colors.border.alt3 : props.theme.colors.border.primary)};
	transition: all 100ms;
	cursor: ${(props) => (props.active ? 'default' : 'pointer')};
	pointer-events: ${(props) => (!props.active ? 'all' : 'none')};

	&:hover {
		background: ${(props) => props.theme.colors.container.primary.active};
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.alt2};
	}
`;

export const NodeInfo = styled.div`
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px12_5};
	flex: 1;
`;

export const Indicator = styled.div<{ active: boolean }>`
	height: ${CSS_DIMENSIONS.px12_5};
	width: ${CSS_DIMENSIONS.px12_5};
	border-radius: 50%;
	background: ${(props) => (props.active ? props.theme.colors.indicator.active : 'transparent')};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	transition: all 150ms;
`;

export const NodeDetails = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px4};
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
		padding: ${CSS_DIMENSIONS.px3_75} 0 0 0 !important;
	}
`;

export const NodeDivider = styled.div`
	width: 100%;
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px12_5};
	margin: ${CSS_DIMENSIONS.px1_5} 0;

	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		color: ${(props) => props.theme.colors.font.alt1};
		text-transform: uppercase;
	}

	.node-divider {
		height: ${CSS_DIMENSIONS.px1};
		flex: 1;
		border-top: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	}
`;

export const NodeAddSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px10};

	button {
		margin: ${CSS_DIMENSIONS.px5} 0 0 0;
	}
`;
