import styled from 'styled-components';

import { PrimitiveButton } from 'components/atoms/PrimitiveButton';
import { STYLING } from 'helpers/config';

export const Content = styled.div``;
export const List = styled.ul`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;
export const Item = styled.li`
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 0 20px 0 12.5px;
`;
export const Open = styled(PrimitiveButton)`
	display: flex;
	flex: 1;
	min-width: 0;
	gap: 16px;
	text-align: left;
	background: transparent;
	border: 1px solid transparent;
	padding: 12px 8px;
	cursor: pointer;
	color: ${(props) => props.theme.colors.font.primary};
	border-radius: ${STYLING.dimensions.radius.primary};
	&:hover,
	&:focus-visible {
		background: ${(props) => props.theme.colors.container.primary.active};
		border: 1px solid ${(props) => props.theme.colors.border.alt1};
	}
	svg {
		width: 14px;
		height: 14px;
		fill: currentColor;
	}
`;
export const Label = styled.div`
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 8px;
	span,
	small {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		font-family: ${(props) => props.theme.typography.family.primary};
	}
	small {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		font-family: ${(props) => props.theme.typography.family.primary};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;
export const Note = styled.p`
	font-size: ${(props) => props.theme.typography.size.xSmall};
	color: ${(props) => props.theme.colors.font.alt1};
	padding: 0 20px;
`;
export const Pagination = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin-top: 20px;
`;
