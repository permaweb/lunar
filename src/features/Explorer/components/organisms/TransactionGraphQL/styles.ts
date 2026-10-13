import styled from 'styled-components';

import { PrimitiveButton } from 'components/atoms/PrimitiveButton';
import { ExplorerControlStyles } from 'components/molecules/ExplorerControls';

export const Chip = styled(ExplorerControlStyles.UpdateWrapper).attrs({ as: PrimitiveButton, type: 'button' })`
	padding: 5px 10px 5px 12px;
	cursor: pointer;
	gap: 7.5px;
	transition: background-color 120ms, border-color 120ms;

	&:hover {
		background: ${(props) => props.theme.colors.contrast.active.background};
		border-color: ${(props) => props.theme.colors.border.primary};
	}

	&:focus-visible {
		outline: 2px solid ${(props) => props.theme.colors.link.active};
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`;

export const PanelContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 0 20px 20px 20px;
	min-width: 0;
`;

export const Description = styled.p`
	color: ${(props) => props.theme.colors.font.alt1};
	font-size: ${(props) => props.theme.typography.size.xSmall};
	overflow-wrap: anywhere;
`;
