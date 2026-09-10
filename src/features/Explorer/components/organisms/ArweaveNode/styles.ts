import styled from 'styled-components';

export const Section = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 0;
`;
export const Actions = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 12px;
`;
export const ButtonGroup = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 10px;
`;
export const Note = styled.p`
	color: ${(props) => props.theme.colors.font.alt1};
	font-size: ${(props) => props.theme.typography.size.small};
	line-height: 1.6;
`;
export const Error = styled.p`
	color: ${(props) => props.theme.colors.warning.primary};
	font-size: ${(props) => props.theme.typography.size.small};
	line-height: 1.6;
`;
