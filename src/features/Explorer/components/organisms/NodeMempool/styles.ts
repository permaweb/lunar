import styled from 'styled-components';

export { Actions, ButtonGroup, Error, Note, Section } from '../ArweaveNode/styles';

export const Changes = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	gap: 20px;
	> div {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
	}
`;
