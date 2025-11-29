import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	gap: 25px;
	position: relative;
`;

export const HeaderWrapper = styled.div`
	width: 100%;
	display: flex;
	gap: 20px;
	align-items: center;
	justify-content: flex-start;

	button {
		span {
			font-size: ${(props) => props.theme.typography.size.xxxSmall} !important;
			text-transform: uppercase !important;
		}
	}
`;

export const Container = styled.div`
	height: calc(100vh - 295px);
	width: 100%;
	display: flex;
	gap: 25px;
	position: relative;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		flex-direction: column;
	}
`;

export const EditorWrapper = styled.div`
	height: 100%;
	flex: 1;
	position: relative;
	overflow: visible;
`;

export const ResultWrapper = styled.div`
	height: 100%;
	flex: 1;
	position: relative;
	overflow: visible;

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
