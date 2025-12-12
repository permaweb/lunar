import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div<{ fullScreenMode: boolean; useFixedHeight: boolean }>`
	min-height: 500px;
	height: calc(100vh - 145px);
	width: 100%;
	position: relative;
	display: flex;
	gap: 15px;
	padding: ${(props) => (props.fullScreenMode ? '15px' : '0')};
	background: ${(props) => props.theme.colors.view.background};

	@media (max-width: ${STYLING.cutoffs.initial}) {
		flex-direction: column;
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

export const ConsoleWrapper = styled.div<{ editorMode: boolean }>`
	width: ${(props) => (props.editorMode ? '50%' : '100%')};
	display: flex;
	gap: 15px;
	flex-direction: ${(props) => (props.editorMode ? 'column' : 'row')};
	position: relative;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		flex-direction: column;
	}
`;

export const ConsoleDivider = styled.div<{ editorMode: boolean }>`
	height: ${(props) => (props.editorMode ? '1px' : '100%')};
	width: ${(props) => (props.editorMode ? '100%' : '1px')};
	border-top: 1px solid ${(props) => (props.editorMode ? props.theme.colors.border.primary : 'transparent')};
	border-left: 1px solid ${(props) => (props.editorMode ? 'transparent' : props.theme.colors.border.primary)};

	@media (max-width: ${STYLING.cutoffs.initial}) {
		height: 1px;
		width: 100%;
		border-top: 1px solid ${(props) => props.theme.colors.border.primary};
		border-left: 1px solid transparent;
	}
`;

export const Console = styled.div`
	height: 100%;
	flex: 1;

	.terminal {
		height: 100% !important;
		overflow: hidden !important;
		padding: 15px;
		span {
			letter-spacing: 0 !important;
		}
	}

	.xterm-rows {
		height: 100% !important;
		overflow: hidden !important;
		letter-spacing: 0;
	}

	.xterm-screen {
		height: 100% !important;
		width: 100% !important;
	}

	@media (max-width: ${STYLING.cutoffs.initial}) {
		width: 100%;
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

export const OptionsWrapper = styled.div`
	height: fit-content;
	max-height: calc(100% - 130px);
	width: 450px;
	max-width: 90vw;
	display: flex;
	flex-direction: column;
	gap: 15px;
	margin: 0 auto;
	position: relative;
	top: 20px;
	padding: 20px 15px 20px 30px;
	overflow: scroll;
	border-radius: ${STYLING.dimensions.radius.primary} !important;
`;

export const OptionsHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	p {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		color: ${(props) => props.theme.colors.font.alt1};
		text-transform: uppercase;
	}
	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const OptionsInput = styled.div`
	margin: 0 0 15px 0;
`;

export const Divider = styled.div`
	height: 1px;
	width: 100%;
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};
`;

export const Options = styled.div`
	display: flex;
	flex-direction: column;
	gap: 15px;

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
	width: 100%;
	background: ${(props) => props.theme.colors.container.alt1.background} !important;
	padding: 25px;
`;

export const InputWrapper = styled.div`
	height: 100%;
	flex: 1;
	display: flex;
	flex-direction: column;
	position: relative;
`;

export const OutputArea = styled.div`
	flex: 1;
	overflow-y: auto;
	padding: 15px;
	font-family: ${(props) => props.theme.typography.family.alt2};
	font-size: 12px;
	font-weight: 700;
	color: ${(props) => props.theme.colors.font.primary};
	background: ${(props) => props.theme.colors.container.alt1.background};
	white-space: pre-wrap;
	word-wrap: break-word;
	line-height: 1.5;

	.output-line {
		margin: 2px 0;
	}

	.output-command {
		color: ${(props) => props.theme.colors.font.alt1};
		opacity: 0.7;
	}

	.output-error {
		color: ${(props) => props.theme.colors.warning.primary};
	}

	.output-loading {
		color: ${(props) => props.theme.colors.font.alt3};
	}
`;

export const InputArea = styled.textarea`
	width: 100%;
	min-height: 80px;
	max-height: 200px;
	padding: 15px;
	font-family: ${(props) => props.theme.typography.family.alt2};
	font-size: 12px;
	font-weight: 700;
	color: ${(props) => props.theme.colors.font.primary};
	background: ${(props) => props.theme.colors.container.alt1.background};
	border: none;
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};
	outline: none;
	resize: vertical;
	line-height: 1.5;

	&::placeholder {
		color: ${(props) => props.theme.colors.font.alt1};
		opacity: 0.5;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

export const PromptLabel = styled.div`
	padding: 10px 15px;
	font-family: ${(props) => props.theme.typography.family.alt2};
	font-size: 11px;
	font-weight: 700;
	color: ${(props) => props.theme.colors.font.alt1};
	background: ${(props) => props.theme.colors.container.alt1.background};
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};
	display: flex;
	align-items: center;
	justify-content: space-between;

	span {
		opacity: 0.6;
	}
`;
