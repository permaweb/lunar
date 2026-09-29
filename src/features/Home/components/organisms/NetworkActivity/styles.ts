import styled from 'styled-components';

export const Wrapper = styled.section`
	scroll-margin-top: 90px;
	display: flex;
	flex-direction: column;
	gap: 20px;
`;
export const Status = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 15px;
	padding: 36px 20px;
	text-align: center;
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	color: ${(props) => props.theme.colors.font.alt1};
`;
