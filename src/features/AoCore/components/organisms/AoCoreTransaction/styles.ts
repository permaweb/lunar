import styled from 'styled-components';

export const Notice = styled.div`
	padding: 24px;
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	color: ${(props) => props.theme.colors.font.primary};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-size: ${(props) => props.theme.typography.size.xSmall};
	line-height: 1.6;

	h3 {
		font-family: ${(props) => props.theme.typography.family.primary};
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		letter-spacing: normal;
	}

	p {
		margin-top: 12px;
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;
