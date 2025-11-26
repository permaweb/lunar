import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	height: 100%;
	width: 100%;
`;

export const TabsHeader = styled.div<{ useFixed: boolean }>`
	width: 100%;
	display: flex;
	gap: 20px;
	align-items: center;
	justify-content: space-between;
	overflow-x: auto;
	margin: 0 0 25px 0;
	@media (max-width: ${STYLING.cutoffs.secondary}) {
		position: relative;
		top: auto;
	}
`;

export const Tabs = styled.div`
	display: flex;
	align-items: center;
	gap: 20px;
`;

export const EndWrapper = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 15px;

	button {
		min-width: 160px;
	}
`;

export const Content = styled.div``;

export const Tab = styled.div<{ active: boolean }>`
	display: flex;
	justify-content: center;
	align-items: center;
	position: relative;
`;

export const View = styled.div`
	height: 100%;
	width: 100%;
	position: relative;
`;
