import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div<{ isFullscreen?: boolean }>`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	gap: 25px;
	position: relative;

	&:fullscreen {
		background: ${(props) => props.theme.colors.container.primary.background};
		padding: 25px;
		overflow: auto;
	}
`;

export const HeaderWrapper = styled.div`
	width: 100%;
	display: flex;
	gap: 20px;
	align-items: center;
	justify-content: space-between;
`;

export const InputWrapper = styled.div`
	height: 38.5px;
	max-width: 100%;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 15px;
	position: relative;
	padding: 0 0 0 0.5px;

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		height: auto;
	}
`;

export const InputFormWrapper = styled.div`
	width: 510px;
	max-width: 100%;
	position: relative;

	input {
		max-width: 100%;
		padding: 10px 10px 10px 42.5px !important;
	}

	svg {
		height: 15px;
		width: 15px;
		color: ${(props) => props.theme.colors.font.alt1};
		fill: ${(props) => props.theme.colors.font.alt1};
		position: absolute;
		z-index: 1;
		top: 11.5px;
		left: 14.5px;
	}
`;

export const ActionsWrapper = styled.div`
	display: flex;
	gap: 10px;
	align-items: center;

	button {
		border-radius: ${STYLING.dimensions.radius.alt2} !important;
	}
`;

export const GatewaysLabel = styled.div`
	height: calc(${STYLING.dimensions.form.small} - 1.75px);
	width: fit-content;
	padding: 4.5px 15px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${(props) => props.theme.colors.container.alt8.background};
	border: 1px solid ${(props) => props.theme.colors.border.alt2};
	border-radius: ${STYLING.dimensions.radius.alt2};
	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.light1};
		text-align: center;
		text-transform: uppercase;
		white-space: nowrap;
		line-height: 1;
	}
`;

export const Container = styled.div<{ isFullscreen?: boolean }>`
	height: calc(100vh - 295px);
	width: 100%;
	display: flex;
	gap: 25px;
	position: relative;

	${(props) =>
		props.isFullscreen &&
		`
		height: calc(100vh - 112.5px);
	`}

	@media (max-width: ${STYLING.cutoffs.initial}) {
		flex-direction: column;
	}
`;

export const EditorWrapper = styled.div<{ showVariables?: boolean }>`
	height: 100%;
	flex: 1;
	min-width: 0;
	position: relative;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	gap: ${(props) => (props.showVariables ? '25px' : '0')};
`;

export const QueryEditorWrapper = styled.div<{ showVariables?: boolean }>`
	height: ${(props) => (props.showVariables ? '65%' : '100%')};
	position: relative;
	overflow: hidden;
`;

export const VariablesEditorWrapper = styled.div`
	height: 35%;
	position: relative;
	overflow: hidden;
`;

export const ResultWrapper = styled.div`
	height: 100%;
	flex: 1;
	min-width: 0;
	position: relative;
	overflow: hidden;

	> * {
		&:first-child {
			height: 100%;
		}
	}
`;

export const ErrorMessage = styled.div`
	position: absolute;
	bottom: 20px;
	left: 20px;
	right: 20px;
	padding: 15px;
	background: ${(props) => props.theme.colors.warning};
	border-radius: 5px;
	z-index: 10;

	p {
		color: ${(props) => props.theme.colors.font.primary};
		font-size: ${(props) => props.theme.typography.size.small};
	}
`;

export const DocsPanel = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 0 20px 20px 20px;
`;

export const DocsEndpoint = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 12px 0 16px 0;
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};

	span {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		text-transform: uppercase;
	}

	p {
		color: ${(props) => props.theme.colors.font.primary};
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		overflow-wrap: anywhere;
	}
`;

export const DocsSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

export const DocsSectionHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;

	p,
	span {
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}

	p {
		color: ${(props) => props.theme.colors.font.primary};
		font-size: ${(props) => props.theme.typography.size.base};
	}

	span {
		min-width: 28px;
		padding: 2px 8px;
		border-radius: ${STYLING.dimensions.radius.alt2};
		background: ${(props) => props.theme.colors.container.alt8.background};
		color: ${(props) => props.theme.colors.font.light1};
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		text-align: center;
	}
`;

export const DocsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

export const DocsField = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 12px;
	background: ${(props) => props.theme.colors.container.primary.background};
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.alt2};
`;

export const DocsFieldHeader = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;

	button {
		flex: 0 0 auto;
		border-radius: ${STYLING.dimensions.radius.alt2} !important;
	}
`;

export const DocsFieldSignature = styled.div`
	min-width: 0;

	code {
		color: ${(props) => props.theme.colors.font.primary};
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		line-height: 1.5;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
`;

export const DocsDescription = styled.div`
	p {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		line-height: 1.55;
	}
`;

export const DocsArgs = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 7px;
`;

export const DocsArg = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	max-width: 100%;
	padding: 4px 7px;
	background: ${(props) => props.theme.colors.container.alt1.background};
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.alt2};

	code,
	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		overflow-wrap: anywhere;
	}

	span {
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const DocsDeprecated = styled.div`
	p {
		color: ${(props) => props.theme.colors.warning.alt1};
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}
`;

export const DocsTypeGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 8px;
`;

export const DocsType = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	gap: 8px;
	min-width: 0;
	padding: 8px 10px;
	background: ${(props) => props.theme.colors.container.primary.background};
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.alt2};

	code,
	span {
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		overflow: hidden;
		text-overflow: ellipsis;
	}

	code {
		color: ${(props) => props.theme.colors.font.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}

	span {
		flex: 0 0 auto;
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const DocsEmpty = styled.div`
	padding: 14px 0;

	p {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}
`;

export const DocsError = styled(DocsEmpty)`
	p {
		color: ${(props) => props.theme.colors.warning.alt1};
	}
`;
