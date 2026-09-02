import styled from 'styled-components';

import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div<{ isFullscreen?: boolean }>`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px25};
	position: relative;

	&:fullscreen {
		background: ${(props) => props.theme.colors.container.primary.background};
		padding: ${CSS_DIMENSIONS.px25};
		overflow: auto;
	}
`;

export const HeaderWrapper = styled.div`
	width: 100%;
	display: flex;
	gap: ${CSS_DIMENSIONS.px20};
	align-items: center;
	justify-content: space-between;
`;

export const InputWrapper = styled.div`
	height: ${CSS_DIMENSIONS.px38_5};
	max-width: 100%;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: ${CSS_DIMENSIONS.px15};
	position: relative;
	padding: 0 0 0 ${CSS_DIMENSIONS.px0_5};

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		height: auto;
	}
`;

export const InputFormWrapper = styled.div`
	width: ${CSS_DIMENSIONS.px510};
	max-width: 100%;
	position: relative;

	input {
		max-width: 100%;
		padding: ${CSS_DIMENSIONS.px10} ${CSS_DIMENSIONS.px10} ${CSS_DIMENSIONS.px10} ${CSS_DIMENSIONS.px42_5} !important;
	}

	svg {
		height: ${CSS_DIMENSIONS.px15};
		width: ${CSS_DIMENSIONS.px15};
		color: ${(props) => props.theme.colors.font.alt1};
		fill: ${(props) => props.theme.colors.font.alt1};
		position: absolute;
		z-index: 1;
		top: ${CSS_DIMENSIONS.px11_5};
		left: ${CSS_DIMENSIONS.px14_5};
	}
`;

export const ActionsWrapper = styled.div`
	display: flex;
	gap: ${CSS_DIMENSIONS.px10};
	align-items: center;

	button {
		border-radius: ${STYLING.dimensions.radius.alt2} !important;
	}
`;

export const GatewaysLabel = styled.div`
	height: calc(${STYLING.dimensions.form.small} - ${CSS_DIMENSIONS.px1_75});
	width: fit-content;
	padding: ${CSS_DIMENSIONS.px4_5} ${CSS_DIMENSIONS.px15};
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${(props) => props.theme.colors.container.alt8.background};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.alt2};
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
	height: calc(100vh - ${CSS_DIMENSIONS.px295});
	width: 100%;
	display: flex;
	gap: ${CSS_DIMENSIONS.px25};
	position: relative;

	${(props) =>
		props.isFullscreen &&
		`
		height: calc(100vh - ${CSS_DIMENSIONS.px112_5});
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
	gap: ${(props) => (props.showVariables ? `${CSS_DIMENSIONS.px25}` : '0')};
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
	bottom: ${CSS_DIMENSIONS.px20};
	left: ${CSS_DIMENSIONS.px20};
	right: ${CSS_DIMENSIONS.px20};
	padding: ${CSS_DIMENSIONS.px15};
	background: ${(props) => props.theme.colors.warning};
	border-radius: ${CSS_DIMENSIONS.px5};
	z-index: 10;

	p {
		color: ${(props) => props.theme.colors.font.primary};
		font-size: ${(props) => props.theme.typography.size.small};
	}
`;

export const DocsPanel = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px12};
	padding: 0 ${CSS_DIMENSIONS.px20} ${CSS_DIMENSIONS.px20} ${CSS_DIMENSIONS.px20};
`;

export const DocsEndpoint = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px6};
	padding: ${CSS_DIMENSIONS.px12} 0 ${CSS_DIMENSIONS.px16} 0;
	border-top: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};

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
	gap: ${CSS_DIMENSIONS.px12};
`;

export const DocsSectionHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: ${CSS_DIMENSIONS.px12};

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
		min-width: ${CSS_DIMENSIONS.px28};
		padding: ${CSS_DIMENSIONS.px2} ${CSS_DIMENSIONS.px8};
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
	gap: ${CSS_DIMENSIONS.px10};
`;

export const DocsField = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px8};
	padding: ${CSS_DIMENSIONS.px12};
	background: ${(props) => props.theme.colors.container.primary.background};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.alt2};
`;

export const DocsFieldHeader = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: ${CSS_DIMENSIONS.px12};

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
	gap: ${CSS_DIMENSIONS.px7};
`;

export const DocsArg = styled.div`
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px6};
	max-width: 100%;
	padding: ${CSS_DIMENSIONS.px4} ${CSS_DIMENSIONS.px7};
	background: ${(props) => props.theme.colors.container.alt1.background};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
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
	grid-template-columns: repeat(auto-fit, minmax(${CSS_DIMENSIONS.px150}, 1fr));
	gap: ${CSS_DIMENSIONS.px8};
`;

export const DocsType = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	gap: ${CSS_DIMENSIONS.px8};
	min-width: 0;
	padding: ${CSS_DIMENSIONS.px8} ${CSS_DIMENSIONS.px10};
	background: ${(props) => props.theme.colors.container.primary.background};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
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
	padding: ${CSS_DIMENSIONS.px14} 0;

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
