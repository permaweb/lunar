import styled from 'styled-components';

import { open, transition1 } from 'helpers/animations';
import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div<{ warning: boolean | undefined }>`
	min-width: ${CSS_DIMENSIONS.px375};
	max-width: 50vw;
	animation: ${open} ${transition1};
	display: flex;
	align-items: center;
	padding: ${CSS_DIMENSIONS.px11_5} ${CSS_DIMENSIONS.px17_5} !important;
	gap: ${CSS_DIMENSIONS.px45};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.alt1} !important;
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
	gap: ${CSS_DIMENSIONS.px10};
	overflow: hidden;
	text-overflow: ellipsis;
`;

export const Icon = styled.div<{ type: 'success' | 'warning' | 'info' }>`
	min-height: ${CSS_DIMENSIONS.px17_5};
	height: ${CSS_DIMENSIONS.px17_5};
	min-width: ${CSS_DIMENSIONS.px17_5};
	width: ${CSS_DIMENSIONS.px17_5};
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${(props) =>
		props.type === 'warning'
			? props.theme.colors.warning.alt1
			: props.type === 'info'
			? props.theme.colors.actions.info
			: props.theme.colors.indicator.active};
	border-radius: 50%;

	svg {
		height: ${CSS_DIMENSIONS.px11_5};
		width: ${CSS_DIMENSIONS.px11_5};
		margin: ${CSS_DIMENSIONS.px6_5} 0 0 0;
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
