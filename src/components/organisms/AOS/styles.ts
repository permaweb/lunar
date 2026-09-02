import styled from 'styled-components';

import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div<{ fullScreenMode: boolean; useFixedHeight: boolean }>`
	min-height: ${CSS_DIMENSIONS.px500};
	height: calc(100vh - ${CSS_DIMENSIONS.px145});
	width: 100%;
	position: relative;
	display: flex;
	gap: ${CSS_DIMENSIONS.px25};
	padding: ${(props) => (props.fullScreenMode ? `${CSS_DIMENSIONS.px15}` : '0')};
	background: ${(props) => props.theme.colors.view.background};

	@media (max-width: ${STYLING.cutoffs.initial}) {
		flex-direction: column-reverse;
	}
`;

export const ConsoleWrapper = styled.div<{ editorMode: boolean }>`
	height: 100%;
	width: ${(props) => (props.editorMode ? '50%' : '100%')};
	max-width: ${(props) => (props.editorMode ? 'none' : `${CSS_DIMENSIONS.px850}`)};
	display: flex;
	gap: ${CSS_DIMENSIONS.px25};
	flex-direction: column;
	position: relative;
	margin: 0 auto;
	padding: ${CSS_DIMENSIONS.px1_5} 0;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		width: 100%;
	}
`;

export const ResultsWrapper = styled.div`
	width: 100%;
	flex: 1;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px20};
	padding: 0 ${CSS_DIMENSIONS.px15} 0 0;

	.result-command {
		width: fit-content;
		color: ${(props) => props.theme.colors.font.primary};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		background: ${(props) => props.theme.colors.container.alt2.background};
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
		border-radius: ${STYLING.dimensions.radius.alt2};
		padding: ${CSS_DIMENSIONS.px1_5} ${CSS_DIMENSIONS.px7_5};
	}

	.result-error {
		font-family: ${(props) => props.theme.typography.family.primary};
		color: ${(props) => props.theme.colors.warning.primary};
	}

	.result-loading {
		font-family: ${(props) => props.theme.typography.family.primary};
		color: ${(props) => props.theme.colors.font.alt1};
	}

	.result-success {
		letter-spacing: -${CSS_DIMENSIONS.px0_35};
		font-family: ${(props) => props.theme.typography.family.alt2};
		color: ${(props) => props.theme.colors.font.primary};
	}
`;

export const ResultLine = styled.div`
	font-family: ${(props) => props.theme.typography.family.primary};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	color: ${(props) => props.theme.colors.font.primary};
	white-space: pre-wrap;
	word-wrap: break-word;
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px8};
`;

export const Spinner = styled.span`
	display: inline-block;
	width: ${CSS_DIMENSIONS.px12};
	height: ${CSS_DIMENSIONS.px12};
	border: ${CSS_DIMENSIONS.px2} solid ${(props) => props.theme.colors.font.alt3};
	border-top-color: ${(props) => props.theme.colors.editor.alt1};
	border-radius: 50%;
	animation: spin 0.5s linear infinite;

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
`;

export const LoadingText = styled.span`
	&::after {
		content: '';
		animation: ellipsis 0.65s steps(4, end) infinite;
	}

	@keyframes ellipsis {
		0% {
			content: '';
		}
		25% {
			content: '.';
		}
		50% {
			content: '..';
		}
		75% {
			content: '...';
		}
		100% {
			content: '';
		}
	}
`;

export const SplashScreen = styled.div`
	padding: ${CSS_DIMENSIONS.px15};
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px7_5};
	position: relative;
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary} !important;
`;

export const SplashScreenHeader = styled.div`
	display: flex;
	font-family: ${(props) => props.theme.typography.family.primary};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	color: ${(props) => props.theme.colors.editor.alt1};
	margin: 0 0 ${CSS_DIMENSIONS.px1_5} 0;
`;

export const SplashScreenLine = styled.div`
	display: flex;
	gap: ${CSS_DIMENSIONS.px10};

	p,
	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}

	span {
		font-family: ${(props) => props.theme.typography.family.alt2};
		color: ${(props) => props.theme.colors.editor.alt1};
		letter-spacing: -${CSS_DIMENSIONS.px0_5};
	}

	p {
		font-family: ${(props) => props.theme.typography.family.primary};
		color: ${(props) => props.theme.colors.font.primary};
	}
`;

export const SplashScreenDivider = styled.div`
	height: ${CSS_DIMENSIONS.px1};
	width: 100%;
	border-top: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary} !important;
	margin: ${CSS_DIMENSIONS.px10} 0;
`;

export const InputWrapper = styled.div<{ disabled: boolean }>`
	width: 100%;
	display: flex;
	flex-direction: column;
	padding: ${CSS_DIMENSIONS.px15};
	background: ${(props) =>
		props.disabled
			? props.theme.colors.button.primary.disabled.background
			: props.theme.colors.container.alt1.background} !important;
	border: ${CSS_DIMENSIONS.px1} solid
		${(props) => (props.disabled ? props.theme.colors.border.primary : props.theme.colors.border.primary)} !important;
	position: relative;
	transition: border-color 100ms ease;
	cursor: text;

	&:focus-within {
		border-color: ${(props) => !props.disabled && props.theme.colors.border.primary} !important;
	}
`;

export const Input = styled.div<{ disabled: boolean }>`
	height: fit-content;
	width: 100%;
	font-family: ${(props) => props.theme.typography.family.primary};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	color: ${(props) =>
		props.disabled ? props.theme.colors.button.primary.disabled.color : props.theme.colors.font.primary};
	opacity: ${(props) => (props.disabled ? 1 : 1)};
	line-height: 1.5;
	border: none;
	outline: none;
	resize: none;
	padding: 0;

	white-space: pre-wrap;
	overflow-wrap: break-word;

	caret-color: ${(props) => props.theme.colors.editor.alt1};

	&.placeholder:before {
		content: attr(data-placeholder);
		color: ${(props) => props.theme.colors.font.alt2};
		pointer-events: none;
	}

	&.loading:before {
		content: attr(data-placeholder);
		color: ${(props) => props.theme.colors.font.alt3};
		pointer-events: none;
	}

	position: relative;
`;

export const InputActionsWrapper = styled.div`
	width: 100%;
	display: flex;
	gap: ${CSS_DIMENSIONS.px15};
	align-items: center;
	justify-content: space-between;
	margin: ${CSS_DIMENSIONS.px12_5} 0 0 0;
`;

export const InputActionsSection = styled.div`
	width: fit-content;
	display: flex;
	gap: ${CSS_DIMENSIONS.px10};
	margin: 0 0 0 -${CSS_DIMENSIONS.px3_5};
`;

export const OptionsWrapper = styled.div`
	height: fit-content;
	max-height: calc(100% - ${CSS_DIMENSIONS.px30});
	width: ${CSS_DIMENSIONS.px450};
	max-width: 90vw;
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px15};
	margin: 0 auto;
	position: relative;
	top: ${CSS_DIMENSIONS.px20};
	padding: ${CSS_DIMENSIONS.px17_5};
`;

export const OptionsHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	margin: ${CSS_DIMENSIONS.px10} 0 ${CSS_DIMENSIONS.px12_5} 0;

	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
		text-transform: uppercase;
		text-align: center;
	}
	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const OptionsCreate = styled.div`
	margin: 0 0 ${CSS_DIMENSIONS.px2_5} 0;

	button {
		border-radius: ${STYLING.dimensions.radius.alt2} !important;
		span {
			text-transform: uppercase !important;
		}
	}
`;

export const OptionsDivider = styled.div`
	width: 100%;
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px12_5};
	margin: ${CSS_DIMENSIONS.px1_5} 0;

	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		color: ${(props) => props.theme.colors.font.alt1};
		text-transform: uppercase;
	}

	.aos-options-divider {
		height: ${CSS_DIMENSIONS.px1};
		flex: 1;
		border-top: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	}
`;

export const OptionsInput = styled.div`
	margin: 0 0 ${CSS_DIMENSIONS.px2_5} 0;

	input {
		height: ${CSS_DIMENSIONS.px42_5} !important;
	}
`;

export const Options = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px15};
	padding: 0 ${CSS_DIMENSIONS.px12_5} 0 0;

	overflow-y: scroll;
	scrollbar-color: ${(props) => props.theme.colors.scrollbar.thumb} ${(props) => props.theme.colors.scrollbar.track};

	::-webkit-scrollbar-track {
		background: ${(props) => props.theme.colors.scrollbar.track};
	}
	::-webkit-scrollbar {
		width: ${CSS_DIMENSIONS.px15};
		border-left: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	}
	::-webkit-scrollbar-thumb {
		background-color: ${(props) => props.theme.colors.scrollbar.thumb};
		border-radius: ${CSS_DIMENSIONS.px36};
		border: ${CSS_DIMENSIONS.px3_5} solid transparent;
		background-clip: padding-box;
	}

	button {
		border-radius: ${STYLING.dimensions.radius.primary} !important;
	}
`;

export const OptionsPaginator = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

export const OptionsLoader = styled.div`
	position: relative;
`;

export const LoadingWrapper = styled.div`
	height: fit-content;
	width: fit-content;
	max-width: 100%;
	position: absolute;
	top: 45%;
	left: 50%;
	transform: translate(-50%, -50%);
	display: flex;
	align-items: center;
	justify-content: center;
	gap: ${CSS_DIMENSIONS.px40};
	padding: ${CSS_DIMENSIONS.px20} ${CSS_DIMENSIONS.px60} ${CSS_DIMENSIONS.px20} ${CSS_DIMENSIONS.px35};
	margin: ${CSS_DIMENSIONS.px40} auto;

	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
		text-transform: uppercase;
	}

	> {
		div {
			height: fit-content !important;
			width: fit-content !important;
			margin: 0 !important;
		}
	}
`;

export const Editor = styled.div`
	height: 100%;
	width: 50%;
	position: relative;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		width: 100%;
	}
`;

export const ActionsWrapper = styled.div<{ fullScreenMode: boolean }>`
	position: absolute;
	bottom: ${CSS_DIMENSIONS.px20};
	right: ${CSS_DIMENSIONS.px20};

	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px15};

	button {
		padding: ${CSS_DIMENSIONS.px3_5} 0 0 0 !important;
	}
`;

export const LoadWrapper = styled(ActionsWrapper)`
	bottom: ${CSS_DIMENSIONS.px20};
	right: ${CSS_DIMENSIONS.px27_5};
	bottom: ${(props) => (props.fullScreenMode ? `${CSS_DIMENSIONS.px30}` : `${CSS_DIMENSIONS.px20}`)};
	right: ${(props) => (props.fullScreenMode ? `${CSS_DIMENSIONS.px42_5}` : `${CSS_DIMENSIONS.px27_5}`)};
`;

export const PanelContent = styled.form`
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px20};
	padding: ${CSS_DIMENSIONS.px20} 0;
`;
