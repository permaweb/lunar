import styled, { DefaultTheme } from 'styled-components';

import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div``;

function getRangeColor(theme: DefaultTheme, invalid: boolean) {
	return invalid ? theme.colors.warning.primary : theme.colors.indicator.active;
}

export const RangeBar = styled.input.attrs({ type: 'range' })<{
	value: any;
	max: any;
	disabled: boolean;
	invalid: boolean;
}>`
	border: none !important;
	padding: 0 !important;
	background: ${(props) => props.theme.colors.container.primary.background} !important;
	width: 100%;
	appearance: none;
	height: ${CSS_DIMENSIONS.px15};
	outline: none;
	scroll-behavior: smooth;

	&::-webkit-slider-runnable-track {
		height: ${CSS_DIMENSIONS.px12_5};
		border-radius: ${STYLING.dimensions.radius.primary};
		background: ${(props) =>
			props.disabled
				? props.theme.colors.container.alt2.background
				: `linear-gradient(90deg, ${getRangeColor(props.theme, props.invalid)} ${(props.value / props.max) * 100}%, ${
						props.theme.colors.container.primary.background
				  } ${(props.value / props.max) * 100}% )`};
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
		transition: background 0.1s;
		&:hover {
			background: ${(props) =>
				props.disabled
					? props.theme.colors.container.alt2.background
					: `linear-gradient(90deg, ${getRangeColor(props.theme, props.invalid)} ${(props.value / props.max) * 100}%, ${
							props.theme.colors.container.primary.active
					  } ${(props.value / props.max) * 100}% )`};
			cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
		}
	}

	&::-moz-range-track {
		height: ${CSS_DIMENSIONS.px12_5};
		border-radius: ${STYLING.dimensions.radius.primary};
		background: ${(props) =>
			props.disabled
				? props.theme.colors.container.alt2.background
				: `linear-gradient(90deg, ${getRangeColor(props.theme, props.invalid)} ${(props.value / props.max) * 100}%, ${
						props.theme.colors.container.primary.background
				  } ${(props.value / props.max) * 100}% )`};
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
		transition: background 0.1s;
		&:hover {
			background: ${(props) =>
				props.disabled
					? props.theme.colors.container.alt2.background
					: `linear-gradient(90deg, ${getRangeColor(props.theme, props.invalid)} ${(props.value / props.max) * 100}%, ${
							props.theme.colors.container.primary.active
					  } ${(props.value / props.max) * 100}% )`};
			cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
		}
	}

	&::-ms-track {
		height: ${CSS_DIMENSIONS.px12_5};
		border-radius: ${STYLING.dimensions.radius.primary};
		background: ${(props) =>
			props.disabled
				? props.theme.colors.container.alt2.background
				: `linear-gradient(90deg, ${getRangeColor(props.theme, props.invalid)} ${(props.value / props.max) * 100}%, ${
						props.theme.colors.container.primary.background
				  } ${(props.value / props.max) * 100}% )`};
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
		transition: background 0.1s;
		&:hover {
			background: ${(props) =>
				props.disabled
					? props.theme.colors.container.alt2.background
					: `linear-gradient(90deg, ${getRangeColor(props.theme, props.invalid)} ${(props.value / props.max) * 100}%, ${
							props.theme.colors.container.primary.active
					  } ${(props.value / props.max) * 100}% )`};
			cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
		}
	}

	&::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		height: ${CSS_DIMENSIONS.px26_5};
		width: ${CSS_DIMENSIONS.px9_5};
		background: ${(props) =>
			props.disabled ? props.theme.colors.container.alt2.background : getRangeColor(props.theme, props.invalid)};
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
		border-radius: ${CSS_DIMENSIONS.px2_5};
		cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
		margin-top: -${CSS_DIMENSIONS.px6_5};
	}

	&.custom-range::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		height: ${CSS_DIMENSIONS.px26_5};
		width: ${CSS_DIMENSIONS.px9_5};
		background: ${(props) =>
			props.disabled ? props.theme.colors.container.alt2.background : getRangeColor(props.theme, props.invalid)};
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
		border-radius: ${CSS_DIMENSIONS.px2_5};
		cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
		margin-top: -${CSS_DIMENSIONS.px7_5};
	}

	&.custom-range::-moz-range-thumb {
		-webkit-appearance: none;
		appearance: none;
		height: ${CSS_DIMENSIONS.px25_5};
		width: ${CSS_DIMENSIONS.px7_5};
		background: ${(props) =>
			props.disabled ? props.theme.colors.container.alt2.background : getRangeColor(props.theme, props.invalid)};
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
		border-radius: ${CSS_DIMENSIONS.px2_5};
		cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
		margin-top: -${CSS_DIMENSIONS.px4_5};
	}

	&::-webkit-slider-runnable-track:before {
		content: '';
		position: absolute;
		width: ${(props) => (props.value / props.max) * 100 + '%'};
		height: ${CSS_DIMENSIONS.px15};
		cursor: ${(props) => (props.disabled ? 'default' : 'pointer')}
		border-radius: ${STYLING.dimensions.radius.primary};
	}

	&::-ms-track:before {
		content: '';
		position: absolute;
		width: ${(props) => (props.value / props.max) * 100 + '%'};
		height: ${CSS_DIMENSIONS.px15};
		cursor: ${(props) => (props.disabled ? 'default' : 'pointer')}
		border-radius: ${STYLING.dimensions.radius.primary};
	}

	&::-moz-range-track:before {
		content: '';
		position: absolute;
		width: ${(props) => (props.value / props.max) * 100 + '%'};
		height: ${CSS_DIMENSIONS.px15};
		cursor: ${(props) => (props.disabled ? 'default' : 'pointer')}
		border-radius: ${STYLING.dimensions.radius.primary};
	}

	&::-webkit-slider-runnable-track:after {
		content: '';
		position: absolute;
		left: ${(props) => (props.value / props.max) * 100 + '%'};
		width: ${(props) => (1 - props.value / props.max) * 100 + '%'};
		height: ${CSS_DIMENSIONS.px15};
		background: ${(props) => props.theme.colors.container.primary.background};
		border-radius: ${STYLING.dimensions.radius.primary};
	}

	&::-ms-track:after {
		content: '';
		position: absolute;
		left: ${(props) => (props.value / props.max) * 100 + '%'};
		width: ${(props) => (1 - props.value / props.max) * 100 + '%'};
		height: ${CSS_DIMENSIONS.px15};
		background: ${(props) => props.theme.colors.container.primary.background};
		border-radius: ${STYLING.dimensions.radius.primary};
	}

	&::-moz-range-track:after {
		content: '';
		position: absolute;
		left: ${(props) => (props.value / props.max) * 100 + '%'};
		width: ${(props) => (1 - props.value / props.max) * 100 + '%'};
		height: ${CSS_DIMENSIONS.px15};
		background: ${(props) => props.theme.colors.container.primary.background};
		border-radius: ${STYLING.dimensions.radius.primary};
	}
`;

export const Input = styled(RangeBar)`
	width: 100%;
`;

export const LabelWrapper = styled.div`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: ${CSS_DIMENSIONS.px10};
	margin: 0 0 ${CSS_DIMENSIONS.px10} 0;
	@media (max-width: ${STYLING.cutoffs.secondary}) {
		flex-direction: column;
		align-items: flex-start;
	}
`;

export const Label = styled.div`
	p {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.small};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}
`;

export const Value = styled(Label)`
	p {
		color: ${(props) => props.theme.colors.font.primary};
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}
`;
