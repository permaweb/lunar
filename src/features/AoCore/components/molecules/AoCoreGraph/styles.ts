import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	min-width: 0;
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: 0 0 ${STYLING.dimensions.radius.alt1} ${STYLING.dimensions.radius.alt1};
	background: ${(props) => props.theme.colors.container.primary.background};
	overflow: hidden;
`;
export const Toolbar = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 15px;
	padding: 12px 15px;
	background: ${(props) => props.theme.colors.container.alt1.background};
	p {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;
export const Actions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
`;
export const Canvas = styled.div`
	height: 620px;
	max-height: 75vh;
	min-height: 400px;
	width: 100%;
	border-block: 1px solid ${(props) => props.theme.colors.border.primary};
	--xy-background-color: ${(props) => props.theme.colors.container.primary.background};
	--xy-background-pattern-color: ${(props) => props.theme.colors.border.alt1};
	--xy-edge-stroke: ${(props) => props.theme.colors.link.color};
	--xy-edge-stroke-width: 1.5;
	.message-link .react-flow__edge-path {
		stroke-dasharray: 3 4;
	}
`;
export const Notice = styled.p`
	padding: 10px 15px;
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	color: ${(props) => props.theme.colors.font.alt1};
`;
export const Legend = styled(Notice)`
	background: ${(props) => props.theme.colors.container.alt1.background};
`;
export const Evidence = styled.div`
	min-width: 0;
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};
`;
