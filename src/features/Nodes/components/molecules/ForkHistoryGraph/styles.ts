import styled from 'styled-components';

import type { ForkNode } from 'api/arweaveNode';

export const Scroll = styled.div`
	overflow: auto;
	height: auto;
	max-height: 65vh;
	max-height: 65dvh;
`;
export const Canvas = styled.div.attrs<{ $width: number; $height: number }>((props) => ({
	style: { width: props.$width, height: props.$height },
}))<{ $width: number; $height: number }>`
	position: relative;
`;
export const Edges = styled.svg`
	position: absolute;
	top: 0;
	left: 0;
	pointer-events: none;
	path {
		fill: none;
		stroke: ${(props) => props.theme.colors.border.alt2};
		stroke-width: 2;
	}
`;
export const Height = styled.span.attrs<{ $top: number }>((props) => ({ style: { top: props.$top } }))<{
	$top: number;
}>`
	position: absolute;
	left: 10px;
	font-size: ${(props) => props.theme.typography.size.xSmall};
	color: ${(props) => props.theme.colors.font.alt1};
`;
export const Card = styled.article.attrs<{ $left: number; $top: number }>((props) => ({
	style: { left: props.$left, top: props.$top },
}))<{ $state: ForkNode['state']; $left: number; $top: number }>`
	position: absolute;
	width: 200px;
	height: 126px;
	padding: 10px;
	display: flex;
	flex-direction: column;
	gap: 5px;
	border: 1px solid ${(props) => props.theme.colors.border.alt2};
	border-style: ${(props) => (props.$state === 'unknown' ? 'dashed' : 'solid')};
	border-radius: 8px;
	background: ${(props) => props.theme.colors.container.primary.background};
	font-size: ${(props) => props.theme.typography.size.small};
`;
export const Title = styled.p`
	font-size: ${(props) => props.theme.typography.size.small};
	color: ${(props) => props.theme.colors.font.primary};
`;
export const Label = styled.span<{ $orphan?: boolean }>`
	font-size: ${(props) => props.theme.typography.size.xSmall};
	color: ${(props) => (props.$orphan ? props.theme.colors.warning.primary : props.theme.colors.font.alt1)};
`;
export const Time = styled(Label)`
	white-space: nowrap;
`;
