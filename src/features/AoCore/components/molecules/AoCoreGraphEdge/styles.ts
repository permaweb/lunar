import styled from 'styled-components';

export const LABEL_MAX_WIDTH = 240;
export const LABEL_SIDE_GAP = 16;
export const LABEL_HEIGHT = 20;
export const LABEL_OFFSET = 24;

export const Label = styled.div`
	width: 100%;
	line-height: ${LABEL_HEIGHT}px;
	font-family: ${(props) => props.theme.typography.family.primary};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	color: ${(props) => props.theme.colors.font.primary};
	background: ${(props) => props.theme.colors.container.primary.background};
	text-align: center;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	pointer-events: auto;
`;
