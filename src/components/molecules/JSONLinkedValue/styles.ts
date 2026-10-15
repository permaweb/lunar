import styled from 'styled-components';

export const Wrapper = styled.div`
	display: block;
`;

export const Content = styled.div`
	padding-left: 22.5px;
`;

export const Label = styled.span`
	font-family: ${(props) => props.theme.typography.family.alt2};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	white-space: nowrap;
`;

export const Link = styled.span`
	color: ${(props) => props.theme.colors.editor.alt8};
	text-decoration: underline;
	text-underline-offset: 3px;
`;

export const Status = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	padding-bottom: 5px;
	color: ${(props) => props.theme.colors.font.alt1};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
`;
