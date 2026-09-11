import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export { Actions, ButtonGroup, Divider, Error, Note, PageCount, PanelContent, Section } from '../ArweaveNode/styles';

export const Changes = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 20px;
	@media (max-width: ${STYLING.cutoffs.tablet}) {
		grid-template-columns: minmax(0, 1fr);
	}
`;
