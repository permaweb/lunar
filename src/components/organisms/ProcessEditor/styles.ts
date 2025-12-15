import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	height: calc(100vh - 275px);
	width: 100%;
	display: flex;
	gap: 25px;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		flex-direction: column;
	}
`;

export const EditorWrapper = styled.div`
	height: 100%;
	flex: 1;
`;

export const ResultWrapper = styled.div`
	height: 100%;
	flex: 1;

	> * {
		&:first-child {
			height: 100%;
		}
	}
`;
