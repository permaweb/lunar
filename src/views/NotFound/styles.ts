import styled from 'styled-components';

export const Wrapper = styled.div`
	min-height: 100vh;
	width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	gap: 25px;
	padding: 20px;
`;

export const Content = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
`;

export const Header = styled.h2`
	font-size: 28px;
	font-family: ${(props) => props.theme.typography.family.primary};
`;

export const Divider = styled.div`
	height: 25px;
	width: 1px;
	margin: 0 22.5px;
	border-right: 1px solid ${(props) => props.theme.colors.border.alt3};
`;

export const Message = styled.p`
	font-size: ${(props) => props.theme.typography.size.base};
`;
