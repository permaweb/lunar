import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.section`
	text-align: center;
	padding: 40px 0 12px;
	h1 {
		font-size: ${(props) => props.theme.typography.size.xxLg};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		margin: 12px 0;
	}
	@media (max-width: ${STYLING.cutoffs.secondary}) {
		padding-top: 20px;
	}
`;
export const Eyebrow = styled.p`
	font-size: ${(props) => props.theme.typography.size.xxxSmall};
	font-family: ${(props) => props.theme.typography.family.alt1};
	color: ${(props) => props.theme.colors.font.alt1};
	letter-spacing: 1px;
	text-transform: uppercase;
`;
export const Description = styled.p`
	font-size: ${(props) => props.theme.typography.size.small};
	color: ${(props) => props.theme.colors.font.alt1};
	line-height: 1.6;
`;
export const Search = styled.form`
	width: 100%;
	max-width: 760px;
	margin: 26px auto 12px;
	text-align: left;
`;
export const Examples = styled.p`
	color: ${(props) => props.theme.colors.font.alt1};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	line-height: 1.7;
`;
export const Error = styled.p`
	color: ${(props) => props.theme.colors.warning.primary};
	margin-top: 10px;
	font-size: ${(props) => props.theme.typography.size.xxSmall};
`;
