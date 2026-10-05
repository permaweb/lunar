import styled from 'styled-components';

export const Wrapper = styled.details`
	min-width: 0;
`;

export const Summary = styled.summary`
	width: fit-content;
	display: flex;
	align-items: center;
	gap: 7.5px;
	list-style: none;
	color: ${(props) => props.theme.colors.font.alt1};
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	cursor: pointer;

	&::-webkit-details-marker {
		display: none;
	}

	&:hover {
		color: ${(props) => props.theme.colors.font.primary};
	}

	&:focus-visible {
		outline: 2px solid ${(props) => props.theme.colors.border.alt4};
		outline-offset: 4px;
	}
`;

export const Content = styled.div`
	margin-top: 5px;
`;
