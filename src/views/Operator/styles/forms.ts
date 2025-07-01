import styled from 'styled-components';

import { STYLING } from 'helpers/config';

// Form and Configuration styles
export const ConfigurationFormContainer = styled.div`
	padding: 16px;
	display: flex;
	width: 100%;
	flex-direction: row;
	flex-wrap: wrap;
	gap: 16px;
`;

export const ConfigurationFormFieldWrapper = styled.div`
	&.full {
		flex: 1 1 100%;
	}
	&.half {
		flex: 1 1 45%;
	}
	&.third {
		flex: 1 1 29%;
	}
	&.quarter {
		flex: 1 1 22%;
	}
`;

export const FormFieldWrapper = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
`;

export const FormLabel = styled.label`
	display: block;
	font-weight: bold;
	text-transform: capitalize;
	color: ${(props) => props.theme.colors.font.primary};
	font-size: ${(props) => props.theme.typography.size.xSmall};
`;

export const FormDescription = styled.div`
	font-size: 12px;
	color: ${(props) => props.theme.colors.font.alt3};
	margin-bottom: 4px;
`;

export const ArrayContainer = styled.div`
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
`;

export const ArrayButtonContainer = styled.div``;

export const ArrayItem = styled.div`
	width: 100%;
	gap: 8px;
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.primary};
	padding: 12px;
	background: ${(props) => props.theme.colors.container.alt1.background};
`;

export const ArrayItemHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;

	strong {
		color: ${(props) => props.theme.colors.font.primary};
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}
`;

export const ArrayItemContent = styled.div`
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	gap: 8px;
	&.full {
		flex: 1 1 100%;
	}
	&.half {
		flex: 1 1 45%;
	}
	&.third {
		flex: 1 1 29%;
	}
	&.quarter {
		flex: 1 1 22%;
	}
`;

export const JSONWriterWrapper = styled.div`
	display: flex;
	width: 100%;
	height: 220px;
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.primary};
	> div > div {
		border-radius: ${STYLING.dimensions.radius.primary} !important;
	}
`;

export const ParameterField = styled.div`
	margin-bottom: 8px;
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

export const ParameterLabel = styled.label`
	font-size: ${(props) => props.theme.typography.size.xxxSmall};
	font-weight: bold;
	color: ${(props) => props.theme.colors.font.primary};
	text-transform: capitalize;
`;

export const ParameterInput = styled.input`
	padding: 6px 8px;
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.primary};
	background: ${(props) => props.theme.colors.container.primary.background};
	color: ${(props) => props.theme.colors.font.primary};
	font-size: ${(props) => props.theme.typography.size.xxxSmall};

	&:focus {
		outline: none;
		border-color: ${(props) => props.theme.colors.link.color};
	}

	&::placeholder {
		color: ${(props) => props.theme.colors.font.alt3};
	}
`;

export const JSONParameterWrapper = styled.div`
	display: flex;
	width: 100%;
	height: 120px;
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.primary};
	> div > div {
		border-radius: ${STYLING.dimensions.radius.primary} !important;
	}
`;
