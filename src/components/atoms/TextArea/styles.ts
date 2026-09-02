import styled from 'styled-components';

import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div`
	width: 100%;
	margin: ${CSS_DIMENSIONS.px10} 0;
	display: flex;
	flex-direction: column;
	position: relative;
	@media (max-width: ${STYLING.cutoffs.initial}) {
		max-width: none;
	}
`;

export const Label = styled.label`
	color: ${(props) => props.theme.colors.font.alt1};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
`;

export const TextArea = styled.textarea<{
	disabled: boolean;
	invalid: boolean;
}>`
	min-height: ${CSS_DIMENSIONS.px165};
	color: ${(props) => props.theme.colors.font.primary};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-size: ${(props) => props.theme.typography.size.base};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	letter-spacing: ${CSS_DIMENSIONS.px0_15};
	margin: ${CSS_DIMENSIONS.px7_5} 0 0 0;
	background: ${(props) => props.theme.colors.form.background};
	border: ${CSS_DIMENSIONS.px1} solid
		${(props) => (props.invalid ? props.theme.colors.form.invalid.outline : props.theme.colors.form.border)};
	border-radius: ${STYLING.dimensions.radius.alt2};
	&:focus {
		outline: 0;
		border: ${CSS_DIMENSIONS.px1} solid
			${(props) => (props.invalid ? props.theme.colors.form.invalid.outline : props.theme.colors.form.valid.outline)};
		outline: ${CSS_DIMENSIONS.px0_5} solid
			${(props) => (props.invalid ? props.theme.colors.form.invalid.outline : props.theme.colors.form.valid.outline)};
		box-shadow: 0 0 ${CSS_DIMENSIONS.px0_5}
			${(props) => (props.invalid ? props.theme.colors.form.invalid.shadow : props.theme.colors.form.valid.shadow)};
		transition: box-shadow, border, outline 225ms ease-in-out;
	}
	&:disabled {
		background: ${(props) => props.theme.colors.form.disabled.background};
		color: ${(props) => props.theme.colors.form.disabled.label};
		box-shadow: none;
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.form.border};
	}
	scrollbar-color: transparent transparent;

	::-webkit-scrollbar-track {
		background: ${(props) => props.theme.colors.view.background};
		padding: 0 ${CSS_DIMENSIONS.px5};
	}

	::-webkit-scrollbar {
		width: ${CSS_DIMENSIONS.px15_5};
	}

	scrollbar-color: ${(props) => props.theme.colors.scrollbar.thumb} transparent;

	::-webkit-scrollbar-thumb {
		background-color: ${(props) => props.theme.colors.scrollbar.thumb};
		border-radius: ${CSS_DIMENSIONS.px36};
		border: ${CSS_DIMENSIONS.px3_5} solid transparent;
		background-clip: padding-box;
	}
`;

export const ErrorContainer = styled.div`
	margin: ${CSS_DIMENSIONS.px7_5} 0 0 0;
	height: ${CSS_DIMENSIONS.px25};
	overflow-x: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

export const Error = styled.span`
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-weight: ${(props) => props.theme.typography.weight.regular};
	border-left: ${CSS_DIMENSIONS.px2_75} solid ${(props) => props.theme.colors.warning.primary};
	padding-left: ${CSS_DIMENSIONS.px5};
`;
