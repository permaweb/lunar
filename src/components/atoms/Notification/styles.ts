import styled from 'styled-components';

import { open, transition1 } from 'helpers/animations';
import { STYLING } from 'helpers/config';

export const Wrapper = styled.div<{ warning: boolean | undefined }>`
	min-width: 375px;
	max-width: 50vw;
	position: fixed;
	left: 50%;
	bottom: 20px;
	transform: translate(-50%, 0);
	z-index: 2147483647;
	animation: ${open} ${transition1};
	display: flex;
	align-items: center;
	padding: 11.5px 17.5px !important;
	gap: 45px;
	border: 1px solid ${(props) => props.theme.colors.border.alt1} !important;
	border-radius: ${STYLING.dimensions.radius.primary};

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		min-width: 0;
		max-width: none;
		width: 90vw;
	}
`;

export const MessageWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	overflow: hidden;
	text-overflow: ellipsis;
`;

export const Icon = styled.div<{ warning: boolean | undefined }>`
	min-height: 17.5px;
	height: 17.5px;
	min-width: 17.5px;
	width: 17.5px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${(props) => (props.warning ? props.theme.colors.warning.alt1 : props.theme.colors.indicator.active)};
	border-radius: 50%;

	svg {
		height: 11.5px;
		width: 11.5px;
		margin: 6.5px 0 0 0;
		color: ${(props) => props.theme.colors.font.light1};
		fill: ${(props) => props.theme.colors.font.light1};
	}
`;

export const Message = styled.p`
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	color: ${(props) => props.theme.colors.font.light1};
	font-weight: ${(props) => props.theme.typography.weight.bold} !important;
	font-size: ${(props) => props.theme.typography.size.xSmall} !important;
`;

export const Close = styled.button`
	margin: 0 0 0 auto;
	p {
		color: ${(props) => props.theme.colors.font.light1} !important;
		font-family: ${(props) => props.theme.typography.family.primary} !important;
		font-size: ${(props) => props.theme.typography.size.xxSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
	}
	&:hover {
		p {
			color: ${(props) => props.theme.colors.font.light1} !important;
			opacity: 0.75;
		}
	}
`;
