import styled from 'styled-components';

export { Actions, Container, Count, Divider, Footer, Header, Heading, PageCount } from '../NodesTable/styles';

export const GroupContent = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 10px 15px;
`;
export const GroupTitle = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	color: ${(props) => props.theme.colors.font.primary};
	font-size: ${(props) => props.theme.typography.size.small};
`;
export const Tip = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 15px;
	font-size: ${(props) => props.theme.typography.size.xSmall};
`;
export const Description = styled.p`
	flex-basis: 100%;
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-weight: ${(props) => props.theme.typography.weight.regular};
	color: ${(props) => props.theme.colors.font.alt1};
`;
