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
	margin: 0 0 2.5px 0;
	p {
		color: ${(props) => props.theme.colors.font.primary};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		font-size: ${(props) => props.theme.typography.size.lg};
	}
`;

export const EditorWrapper = styled.div<{ useFixedHeight: boolean }>`
	min-height: 125px;
	max-height: ${(props) => (props.useFixedHeight ? '100%' : 'calc(100vh - 190px)')};
	width: 100%;
	display: flex;
	align-items: flex-start;
	position: relative;
`;

export const Editor = styled.div`
	height: 100%;
	width: 100%;
	flex: 1;
	position: relative;
	padding: 18.5px 0 0 0;
	background: ${(props) => props.theme.colors.container.alt1.background};

	> div {
		height: 100% !important;
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
	right: 32.5px;
	z-index: 1;
	pointer-events: none;

	button {
		padding: 3.5px 0 0 0 !important;
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
