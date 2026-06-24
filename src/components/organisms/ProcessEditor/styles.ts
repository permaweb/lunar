import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div<{ $isFullscreen?: boolean }>`
	height: ${(props) => (props.$isFullscreen ? 'calc(100dvh - 175px)' : 'calc(100vh - 275px)')};
	width: 100%;
	display: flex;
	gap: 25px;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		flex-direction: column;
	}
`;

export const EditorWrapper = styled.div`
	height: 100%;
	flex: 1 1 50%;
	min-width: 0;
	overflow: hidden;
`;

export const ResultWrapper = styled.div`
	height: 100%;
	flex: 1 1 50%;
	min-width: 0;
	overflow: hidden;

	> * {
		&:first-child {
			height: 100%;
		}
	}
`;
