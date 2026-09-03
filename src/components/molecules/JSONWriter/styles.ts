import styled from 'styled-components';

export const Wrapper = styled.div`
	height: 100%;
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 20px;
	min-width: 0;
`;

export const EditorWrapper = styled.div`
	height: 100%;
	width: 100%;
	display: flex;
	align-items: flex-start;
	position: relative;
	min-width: 0;
`;

export const Editor = styled.div`
	height: 100%;
	width: 100%;
	flex: 1;
	position: relative;
	padding: 15px 0 0 0;
	background: ${(props) => props.theme.colors.container.alt1.background};
	min-width: 0;
	overflow: hidden;

	> div {
		height: 100% !important;
		width: 100% !important;
		background: ${(props) => props.theme.colors.container.alt1.background} !important;
	}

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
	right: 20px;
`;

export const ErrorWrapper = styled.div`
	span {
		color: ${(props) => props.theme.colors.warning.primary};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		font-size: ${(props) => props.theme.typography.size.xxSmall};
	}
`;
