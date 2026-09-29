import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.section`
	min-width: 0;
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.alt1};
	background: ${(props) => props.theme.colors.container.alt1.background};
	background: color-mix(in srgb, ${(props) => props.theme.colors.container.alt1.background} 82%, transparent);
	backdrop-filter: blur(2px);
	@media (max-width: ${STYLING.cutoffs.secondary}) {
		grid-template-columns: minmax(0, 1fr);
	}
`;
export const Card = styled.article`
	min-width: 0;
	padding: 14px;
	& + & {
		border-left: 1px solid ${(props) => props.theme.colors.border.primary};
	}
	@media (max-width: ${STYLING.cutoffs.secondary}) {
		& + & {
			border-left: 0;
			border-top: 1px solid ${(props) => props.theme.colors.border.primary};
		}
	}
`;
export const Intro = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 4px 8px;
	h2 {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}
	p {
		grid-column: 2 / -1;
		font-size: ${(props) => props.theme.typography.size.xxxxSmall};
		line-height: 1.5;
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;
export const Description = styled.div`
	padding: 12px 0 14px 0;
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	p {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		line-height: 1.5;
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;
export const IntroFlex = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
`;
export const Price = styled.span`
	min-width: 0;
	text-align: right;
	font-size: ${(props) => props.theme.typography.size.xxxSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	font-variant-numeric: tabular-nums;
`;
export const NetworkIcon = styled.div<{ $size: number }>`
	width: ${(props) => props.$size}px;
	height: ${(props) => props.$size}px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${(props) => props.theme.colors.font.primary};
	svg path {
		fill: currentColor;
	}
`;
export const Stats = styled.dl`
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	gap: 14px;
	margin: 14px 0 0;
	> div {
		display: flex;
		flex-direction: column;
		gap: 2px;
		align-items: flex-start;
	}
	dt {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		color: ${(props) => props.theme.colors.font.alt1};
		line-height: 1.5;
	}
	dd {
		min-width: 0;
		margin: 0;
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		font-variant-numeric: tabular-nums;
		text-align: right;
		overflow-wrap: anywhere;
	}
	> *:not(:last-child) {
		padding: 0 0 14px 0;
		border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	}
`;
export const Actions = styled.div`
	margin-top: 14px;
	padding-top: 12px;
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};
`;
