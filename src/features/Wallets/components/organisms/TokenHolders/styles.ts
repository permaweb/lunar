import styled from 'styled-components';

export const Wrapper = styled.div`
	width: 100%;
`;

export const PageCounter = styled.span`
	color: ${(props) => props.theme.colors.font.alt1};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
`;

export const Balance = styled.span`
	white-space: nowrap;
`;

export const ActivityStatus = styled.p`
	margin-bottom: 15px;
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	color: ${(props) => props.theme.colors.font.alt1};
`;
