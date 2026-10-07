export * from '../styles';

import styled from 'styled-components';

export const NetworkDescription = styled.p`
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	color: ${(props) => props.theme.colors.font.alt1};
	line-height: 1.5;
	margin: -7.5px 0 0 0;
`;

export const SectionActions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	margin: 10px 0 0 0;
`;
