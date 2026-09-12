import styled from 'styled-components';

export const Section = styled.section`
	display: flex;
	flex-direction: column;
	gap: 15px;
	margin-bottom: 20px;
`;
export const Source = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;

	> span {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
		white-space: nowrap;
	}

	/* CloseHandler wraps the select in a full-width div that would otherwise crowd the title. */
	> div {
		height: fit-content;
		width: fit-content;
	}
`;
export const Note = styled.p`
	font-size: ${(props) => props.theme.typography.size.small};
	color: ${(props) => props.theme.colors.font.alt1};
`;
export const PageCount = styled.span`
	font-size: ${(props) => props.theme.typography.size.small};
	color: ${(props) => props.theme.colors.font.alt1};
`;
