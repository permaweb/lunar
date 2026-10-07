import styled from 'styled-components';

export const Wrapper = styled.div`
	display: inline-block;
	max-width: 100%;
	vertical-align: top;
`;

export const Label = styled.span`
	font-family: ${(props) => props.theme.typography.family.alt2};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	overflow-wrap: anywhere;
`;

export const Status = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	color: ${(props) => props.theme.colors.font.alt1};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
`;
