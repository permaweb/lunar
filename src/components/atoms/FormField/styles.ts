import styled from 'styled-components';

import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div<{ sm: boolean | undefined }>`
	width: 100%;
	display: flex;
	flex-direction: column;
	position: relative;
`;

export const TWrapper = styled.div`
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 ${CSS_DIMENSIONS.px2_5} 0 0;
	button {
		svg {
			margin: 0 0 ${CSS_DIMENSIONS.px1_5} 0;
		}
	}
`;

export const Label = styled.label`
	color: ${(props) => props.theme.colors.font.alt1};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	margin: 0 0 ${CSS_DIMENSIONS.px7_5} 0;
`;

export const Tooltip = styled.div`
	padding: 0 ${CSS_DIMENSIONS.px20} ${CSS_DIMENSIONS.px20} ${CSS_DIMENSIONS.px20};
	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		line-height: 1.5;
		color: ${(props) => props.theme.colors.font.primary};
	}
`;

export const Input = styled.input<{
	sm: boolean | undefined;
	disabled: boolean;
	invalid: boolean;
}>`
	height: ${(props) => (props.sm ? STYLING.dimensions.form.small : STYLING.dimensions.form.max)};
	color: ${(props) =>
		props.disabled ? props.theme.colors.button.primary.disabled.color : props.theme.colors.font.primary};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-size: ${(props) => props.theme.typography.size.small};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	letter-spacing: ${CSS_DIMENSIONS.px0_15};
	background: ${(props) => props.theme.colors.form.background};
	border: ${CSS_DIMENSIONS.px1} solid
		${(props) => (props.invalid ? props.theme.colors.form.invalid.outline : props.theme.colors.form.border)};
	border-radius: ${STYLING.dimensions.radius.alt2};

	&::placeholder {
		color: ${(props) => props.theme.colors.font.alt2} !important;
		font-size: ${(props) => props.theme.typography.size.xSmall};
		opacity: 0.75;
	}

	&::-webkit-input-placeholder {
		color: ${(props) => props.theme.colors.font.alt2} !important;
		font-size: ${(props) => props.theme.typography.size.xSmall};
		opacity: 0.75;
	}

	&::-moz-placeholder {
		color: ${(props) => props.theme.colors.font.alt2} !important;
		font-size: ${(props) => props.theme.typography.size.xSmall};
		opacity: 0.75;
	}

	&:-ms-input-placeholder {
		color: ${(props) => props.theme.colors.font.alt2} !important;
		font-size: ${(props) => props.theme.typography.size.xSmall};
		opacity: 0.75;
	}

	&::-ms-input-placeholder {
		color: ${(props) => props.theme.colors.font.alt2} !important;
		font-size: ${(props) => props.theme.typography.size.xSmall};
		opacity: 0.75;
	}

	&:focus {
		outline: 0;
		border: ${CSS_DIMENSIONS.px1} solid
			${(props) => (props.invalid ? props.theme.colors.form.invalid.outline : props.theme.colors.form.valid.outline)};
		outline: ${CSS_DIMENSIONS.px0_5} solid
			${(props) => (props.invalid ? props.theme.colors.form.invalid.outline : props.theme.colors.form.valid.outline)};
		box-shadow: ${CSS_DIMENSIONS.px1} ${CSS_DIMENSIONS.px1} ${CSS_DIMENSIONS.px5_5}
			${(props) => (props.invalid ? props.theme.colors.form.invalid.shadow : props.theme.colors.form.valid.shadow)};
		transition: box-shadow, border, outline 325ms ease-in-out;
	}
	&:disabled {
		background: ${(props) => props.theme.colors.form.disabled.background};
		color: ${(props) => props.theme.colors.form.disabled.label};
		box-shadow: none;
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.form.disabled.border};
	}
`;

export const EndTextContainer = styled.div<{
	sm: boolean | undefined;
	disabled: boolean;
}>`
	height: ${(props) =>
		props.sm ? STYLING.dimensions.form.small : `calc(${STYLING.dimensions.form.max} - ${CSS_DIMENSIONS.px7_5})`};
	height: 100%;
	max-width: ${CSS_DIMENSIONS.px100};
	position: absolute;
	top: ${(props) => (props.sm ? '42.5%' : '37.5%')};
	right: ${CSS_DIMENSIONS.px47_5};
	transform: translate(0, -50%);
	display: flex;
	justify-content: center;
	align-items: center;
	overflow-x: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	background: transparent;
`;

export const EndText = styled.span<{ sm: boolean | undefined }>`
	color: ${(props) => props.theme.colors.font.primary.alt4};
	font-size: ${(props) => (props.sm ? props.theme.typography.size.small : `${CSS_DIMENSIONS.px19}`)};
	font-weight: ${(props) => props.theme.typography.weight.regular};
	width: 100%;
`;

export const ErrorContainer = styled.div`
	margin: ${CSS_DIMENSIONS.px8_5} 0 0 0;
	height: ${CSS_DIMENSIONS.px25};
	overflow-x: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

export const Error = styled.span`
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	border-left: ${CSS_DIMENSIONS.px2_75} solid ${(props) => props.theme.colors.warning.primary};
	padding-left: ${CSS_DIMENSIONS.px5};
`;
