import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div<{ fullScreenMode: boolean; useFixedHeight: boolean }>`
	min-height: 500px;
	height: calc(100vh - 145px);
	width: 100%;
	position: relative;
	display: flex;
	gap: 25px;
	padding: ${(props) => (props.fullScreenMode ? '15px' : '0')};
	background: ${(props) => props.theme.colors.view.background};

	@media (max-width: ${STYLING.cutoffs.initial}) {
		flex-direction: column-reverse;
	}
`;

export const ConsoleWrapper = styled.div<{ editorMode: boolean }>`
	height: 100%;
	width: ${(props) => (props.editorMode ? '50%' : '100%')};
	max-width: ${(props) => (props.editorMode ? 'none' : '850px')};
	display: flex;
	gap: 25px;
	flex-direction: column;
	position: relative;
	margin: 0 auto;
	padding: 1.5px 0;

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
	gap: 20px;
	padding: 0 15px 0 0;

	.result-command {
		width: fit-content;
		color: ${(props) => props.theme.colors.font.primary};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		background: ${(props) => props.theme.colors.container.alt2.background};
		border: 1px solid ${(props) => props.theme.colors.border.alt2};
		border-radius: ${STYLING.dimensions.radius.alt2};
		padding: 1.5px 7.5px;
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
		letter-spacing: -0.35px;
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
	gap: 8px;
`;

export const Spinner = styled.span`
	display: inline-block;
	width: 12px;
	height: 12px;
	border: 2px solid ${(props) => props.theme.colors.font.alt3};
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
	padding: 15px;
	display: flex;
	flex-direction: column;
	gap: 7.5px;
	position: relative;
	border: 1px solid ${(props) => props.theme.colors.border.alt2} !important;
`;

export const SplashScreenHeader = styled.div`
	display: flex;
	font-family: ${(props) => props.theme.typography.family.primary};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	color: ${(props) => props.theme.colors.editor.alt1};
	margin: 0 0 1.5px 0;
`;

export const SplashScreenLine = styled.div`
	display: flex;
	gap: 10px;

	p,
	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}

	span {
		font-family: ${(props) => props.theme.typography.family.alt2};
		color: ${(props) => props.theme.colors.editor.alt1};
		letter-spacing: -0.5px;
	}

	p {
		font-family: ${(props) => props.theme.typography.family.primary};
		color: ${(props) => props.theme.colors.font.primary};
	}
`;

export const SplashScreenDivider = styled.div`
	height: 1px;
	width: 100%;
	border-top: 1px solid ${(props) => props.theme.colors.border.alt2} !important;
	margin: 10px 0;
`;

export const InputWrapper = styled.div<{ disabled: boolean }>`
	width: 100%;
	display: flex;
	flex-direction: column;
	padding: 15px;
	background: ${(props) =>
		props.disabled
			? props.theme.colors.button.primary.disabled.background
			: props.theme.colors.container.alt1.background} !important;
	border: 1px solid ${(props) => (props.disabled ? props.theme.colors.border.primary : props.theme.colors.border.alt1)} !important;
	position: relative;
	transition: border-color 100ms ease;
	cursor: text;

	&:focus-within {
		border-color: ${(props) => !props.disabled && props.theme.colors.border.alt4} !important;
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
	gap: 15px;
	align-items: center;
	justify-content: space-between;
	margin: 12.5px 0 0 0;
`;

export const InputActionsSection = styled.div`
	width: fit-content;
	display: flex;
	gap: 10px;
	margin: 0 0 0 -3.5px;
`;

export const OptionsWrapper = styled.div`
	height: fit-content;
	max-height: calc(100% - 30px);
	width: 450px;
	max-width: 90vw;
	display: flex;
	flex-direction: column;
	gap: 15px;
	margin: 0 auto;
	position: relative;
	top: 20px;
	padding: 17.5px;
`;

export const OptionsHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 10px 0 12.5px 0;

	p {
		font-size: ${(props) => props.theme.typography.size.base};
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
	margin: 0 0 2.5px 0;

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
	gap: 12.5px;
	margin: 1.5px 0;

	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		color: ${(props) => props.theme.colors.font.alt1};
		text-transform: uppercase;
	}

	.aos-options-divider {
		height: 1px;
		flex: 1;
		border-top: 1px solid ${(props) => props.theme.colors.border.primary};
	}
`;

export const OptionsInput = styled.div`
	margin: 0 0 2.5px 0;

	input {
		height: 42.5px !important;
	}
`;

export const Options = styled.div`
	display: flex;
	flex-direction: column;
	gap: 15px;
	padding: 0 12.5px 0 0;
	overflow-y: scroll;

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
	gap: 40px;
	padding: 20px 60px 20px 35px;
	margin: 40px auto;

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
	bottom: 20px;
	right: 20px;

	display: flex;
	flex-direction: column;
	gap: 15px;

	button {
		padding: 3.5px 0 0 0 !important;
	}
`;

export const LoadWrapper = styled(ActionsWrapper)`
	bottom: 20px;
	right: 27.5px;
	bottom: ${(props) => (props.fullScreenMode ? '30px' : '20px')};
	right: ${(props) => (props.fullScreenMode ? '42.5px' : '27.5px')};
`;

export const PanelContent = styled.form`
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 20px 0;
`;
