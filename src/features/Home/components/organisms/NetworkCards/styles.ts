import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.section`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 24px;
	@media (max-width: ${STYLING.cutoffs.tablet}) {
		grid-template-columns: minmax(0, 1fr);
	}
`;
export const Card = styled.article`
	min-width: 0;
	padding: 26px;
	display: flex;
	flex-direction: column;
	@media (max-width: ${STYLING.cutoffs.secondary}) {
		padding: 20px;
	}
`;
export const Intro = styled.div`
	display: flex;
	align-items: center;
	gap: 14px;
	h2 {
		font-size: ${(props) => props.theme.typography.size.xLg};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}
	p {
		margin-top: 6px;
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xxSmall};
	}
`;
export const NetworkIcon = styled.div`
	color: ${(props) => props.theme.colors.font.primary};
	svg path {
		fill: currentColor;
	}
	width: 48px;
	height: 48px;
	display: flex;
	flex-shrink: 0;
	align-items: center;
	justify-content: center;
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.primary};
	background: ${(props) => props.theme.colors.container.alt2.background};
`;
export const Detail = styled.p`
	margin: 18px 0 24px;
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	color: ${(props) => props.theme.colors.font.alt1};
	line-height: 1.6;
`;
export const Stats = styled.dl`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16px;
	margin-bottom: 26px;
	dt {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		color: ${(props) => props.theme.colors.font.alt1};
		line-height: 1.5;
	}
	dd {
		margin: 10px 0 0;
		font-size: ${(props) => props.theme.typography.size.lg};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		overflow-wrap: anywhere;
	}
	@media (max-width: ${STYLING.cutoffs.secondary}) {
		grid-template-columns: 1fr;
		> div {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 10px;
		}
		dd {
			margin: 0;
			font-size: ${(props) => props.theme.typography.size.small};
		}
	}
`;
export const Actions = styled.div`
	margin-top: auto;
	padding-top: 18px;
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
	a {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}
	a:focus-visible {
		outline: 2px solid ${(props) => props.theme.colors.border.alt4};
		outline-offset: 5px;
	}
`;
export const Links = styled.div`
	display: flex;
	gap: 16px;
	a {
		color: ${(props) => props.theme.colors.font.alt1};
		font-weight: ${(props) => props.theme.typography.weight.medium};
	}
`;
