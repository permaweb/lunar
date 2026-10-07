import styled from 'styled-components';

export const Section = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 15px;
`;
export const Title = styled.p`
	color: ${(props) => props.theme.colors.font.primary};
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	font-family: ${(props) => props.theme.typography.family.primary};
`;
export const Description = styled.p`
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	color: ${(props) => props.theme.colors.font.alt1};
	line-height: 1.5;
	margin: -7.5px 0 0 0;
`;
export const Providers = styled.div`
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
export const Actions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	margin: 10px 0 0 0;
`;
