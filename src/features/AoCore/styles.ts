import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	min-width: 0;
	color: ${(props) => props.theme.colors.font.primary};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-weight: ${(props) => props.theme.typography.weight.medium};
	line-height: 1.5;

	h3,
	h4 {
		font-family: ${(props) => props.theme.typography.family.primary};
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		line-height: 1.5;
		letter-spacing: normal;
	}
	p {
		line-height: 1.6;
	}
`;

export const Card = styled.section`
	min-width: 0;
	padding: 15px;
	display: flex;
	flex-direction: column;
	gap: 16px;

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		padding: 14px;
	}
`;

export const Muted = styled.p`
	color: ${(props) => props.theme.colors.font.alt1};
	font-size: ${(props) => props.theme.typography.size.xSmall};
`;

export const Actions = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px;
	font-size: ${(props) => props.theme.typography.size.xSmall};
`;

export const Facts = styled.dl`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 20px;
	margin: 0;

	dt {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		margin-bottom: 5px;
	}
	dd {
		margin: 0;
		overflow-wrap: anywhere;
		line-height: 1.5;
	}
	@media (max-width: ${STYLING.cutoffs.secondary}) {
		grid-template-columns: minmax(0, 1fr);
	}
`;

export const Code = styled.code`
	font-family: ${(props) => props.theme.typography.family.primary};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-weight: ${(props) => props.theme.typography.weight.medium};
	overflow-wrap: anywhere;
	white-space: pre-wrap;
`;

export const Badge = styled.span`
	display: inline-block;
	padding: 3px 6px;
	background: ${(props) => props.theme.colors.container.alt1.background};
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.alt2};
	font-size: ${(props) => props.theme.typography.size.xxxSmall};
	color: ${(props) => props.theme.colors.font.alt1};
`;

export const Steps = styled.ol`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 28px;
	padding-left: 20px;
	li {
		padding-left: 4px;
	}
	li p {
		margin-top: 8px;
		color: ${(props) => props.theme.colors.font.alt1};
	}
	@media (max-width: ${STYLING.cutoffs.secondary}) {
		grid-template-columns: minmax(0, 1fr);
	}
`;

export const PanelContent = styled(Wrapper)`
	padding: 0 20px 20px 20px;

	${Facts}, ${Steps} {
		grid-template-columns: minmax(0, 1fr);
	}
`;

export const PanelSection = styled.section`
	display: flex;
	flex-direction: column;
	gap: 16px;
	min-width: 0;

	& + & {
		padding-top: 20px;
		border-top: 1px solid ${(props) => props.theme.colors.border.primary};
	}
`;
