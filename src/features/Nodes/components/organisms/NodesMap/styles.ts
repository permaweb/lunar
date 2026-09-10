import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	padding: 0 15px 15px 15px;
	background: ${(props) => props.theme.colors.container.alt1.background};
`;
export const CanvasWrapper = styled.div`
	height: 440px;
	width: 100%;
	position: relative;
	overflow: hidden;
	margin: 25px 0;
	canvas {
		display: block;
	}
	@media (max-width: ${STYLING.cutoffs.tablet}) {
		height: 280px;
	}
`;
export const Note = styled.p`
	font-size: ${(props) => props.theme.typography.size.small};
	color: ${(props) => props.theme.colors.font.alt1};
	line-height: 1.5;
`;
export const Progress = styled.p`
	padding-top: 10px;
	font-size: ${(props) => props.theme.typography.size.xSmall};
	color: ${(props) => props.theme.colors.font.primary};
`;
export const Attribution = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 10px 20px;
	padding-top: 15px;
`;
export const LocationList = styled.ul`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 15px 25px;
	padding-top: 15px;
	list-style: none;
	li {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		min-width: 0;
		gap: 15px;
		line-height: 20px;
		font-size: ${(props) => props.theme.typography.size.xSmall};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;
export const LocationName = styled.span`
	display: inline-flex;
	align-items: center;
	min-width: 0;
	gap: 7.5px;
`;
export const LocationLabel = styled.span`
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;
export const LocationCount = styled.span`
	min-width: 2ch;
	text-align: right;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
`;
export const Swatch = styled.span<{ $color: string }>`
	height: 10px;
	width: 10px;
	flex: 0 0 10px;
	border-radius: 2px;
	background: ${(props) => props.$color};
`;
