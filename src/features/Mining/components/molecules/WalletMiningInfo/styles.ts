import styled from 'styled-components';

export const Content = styled.div`
	display: flex;
	flex-direction: column;
	gap: 15px;
	padding: 20px;
`;
export const Note = styled.p`
	font-size: ${(props) => props.theme.typography.size.small};
	color: ${(props) => props.theme.colors.font.alt1};
`;
