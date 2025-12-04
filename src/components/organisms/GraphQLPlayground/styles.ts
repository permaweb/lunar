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
	max-width: 100%;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 15px;
	position: relative;
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

export const GatewaysWrapper = styled.div`
	display: flex;
	gap: 10px;
	align-items: flex-start;
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
	gap: ${(props) => (props.showVariables ? '15px' : '0')};
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
			overflow: auto;
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
