import styled from 'styled-components';

export const Wrapper = styled.div`
	height: 100%;
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 7.5px;
`;

export const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 15px;
	padding: 15px 15px 12.5px 15px;
	p {
		color: ${(props) => props.theme.colors.font.primary};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		font-size: ${(props) => props.theme.typography.size.lg};
	}
`;

export const EditorWrapper = styled.div<{ $useFixedHeight?: boolean; $height: number; $noWrapper?: boolean }>`
	height: ${(props) => (props.$useFixedHeight ? '100%' : `${props.$height}px`)};
	min-height: ${(props) => (props.$noWrapper ? '0' : '125px')};
	max-height: ${(props) => (props.$useFixedHeight ? '100%' : `calc(100vh - 190px)`)};
	overflow: hidden;
	width: 100%;
	min-width: 0;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	position: relative;
	isolation: isolate;
`;

export const Editor = styled.div<{ $hasHeader?: boolean; $noWrapper?: boolean }>`
	height: 100%;
	width: 100%;
	min-width: 0;
	flex: 1;
	position: relative;
	z-index: 0;
	min-height: 0;
	padding: ${(props) => (props.$noWrapper ? '0' : props.$hasHeader ? `0 0 15px 0` : `18.5px 0 15px 0`)};
	background: ${(props) => (props.$noWrapper ? 'transparent' : props.theme.colors.container.alt1.background)};

	> div {
		height: 100% !important;
		background: ${(props) =>
			props.$noWrapper ? 'transparent' : props.theme.colors.container.alt1.background} !important;
	}

	${(props) =>
		props.$noWrapper &&
		`
			.monaco-editor, .monaco-editor-background, .margin {
				background: transparent !important;
			}
		`}

	> * {
		font-family: ${(props) => props.theme.typography.family.alt2} !important;
	}
`;

export const ActionsWrapper = styled.div`
	width: fit-content;
	display: flex;
	align-items: center;
	gap: 20px;
	position: absolute;
	bottom: 20px;
	right: 32.5px;
	z-index: 1;
	pointer-events: none;

	button {
		pointer-events: auto;
	}
`;

export const SubmitWrapper = styled.div`
	button {
		padding: 0 17.5px !important;
		pointer-events: auto;
	}
`;

export const ErrorWrapper = styled.div`
	span {
		color: ${(props) => props.theme.colors.warning.primary};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		font-size: ${(props) => props.theme.typography.size.xxSmall};
	}
`;
