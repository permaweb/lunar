import styled from 'styled-components';
export const Balance = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
`;
export const Failure = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	color: ${(props) => props.theme.colors.warning.primary};
`;
