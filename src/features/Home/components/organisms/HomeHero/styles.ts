import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.section`
	position: relative;
	isolation: isolate;
	width: 100%;
	min-height: 260px;
	display: flex;
	align-items: center;
	justify-content: center;
	text-align: left;
	padding: 40px 0;
	margin-bottom: 24px;
	h1 {
		font-size: ${(props) => props.theme.typography.size.xxLg};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		margin: 0;
	}
	@media (max-width: ${STYLING.cutoffs.secondary}) {
		min-height: 230px;
		padding: 32px 0;
		margin-bottom: 16px;
	}
`;
export const Content = styled.div`
	position: relative;
	z-index: 1;
	width: 100%;
	max-width: ${STYLING.cutoffs.max};
	padding: 0 25px;
	@media (max-width: ${STYLING.cutoffs.initial}) {
		padding: 0 15px;
	}
`;
export const Search = styled.form`
	width: 100%;
	max-width: 640px;
	margin: 20px 0 10px;
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
