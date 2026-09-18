export * from '../styles';

import styled from 'styled-components';

export const NetworkDescription = styled.p`
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	color: ${(props) => props.theme.colors.font.alt1};
	line-height: 1.5;
`;

export const NetworkProviders = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	div {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	strong,
	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		overflow-wrap: anywhere;
	}
	span {
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const PeerList = styled.ul`
	padding-left: 20px;
	li {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		overflow-wrap: anywhere;
		line-height: 1.7;
	}
`;

export const SectionActions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	margin: 10px 0 0 0;
`;
