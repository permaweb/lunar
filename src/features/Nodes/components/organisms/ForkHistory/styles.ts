import styled from 'styled-components';

export const Content = styled.div`
	display: flex;
	flex-direction: column;
	gap: 15px;
	padding: 0 15px 15px 15px;
`;
export const Controls = styled.div`
	display: flex;
	align-items: flex-end;
	flex-wrap: wrap;
	gap: 15px;
`;
export const SelectWrapper = styled.div`
	flex: 1;
	min-width: 240px;
`;
export const Note = styled.p`
	font-size: ${(props) => props.theme.typography.size.small};
	color: ${(props) => props.theme.colors.font.alt1};
`;
export const Status = styled(Note)`
	min-height: 20px;
`;
