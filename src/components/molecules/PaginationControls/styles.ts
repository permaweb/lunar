import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12.5px;
`;

export const ControlGroup = styled.div`
	display: flex;
	align-items: center;
	gap: 7.5px;

	label,
	span,
	input {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}

	label,
	span {
		white-space: nowrap;
	}

	input {
		height: 30px;
		width: 70px;
		padding: 0 7.5px;
		border: 1px solid ${(props) => props.theme.colors.border.primary};
		border-radius: ${STYLING.dimensions.radius.alt2};
		background: ${(props) => props.theme.colors.container.primary.background};
		color: ${(props) => props.theme.colors.font.primary};

		&:disabled {
			cursor: not-allowed;
			opacity: 0.65;
		}
	}
`;

export const Divider = styled.div`
	height: 20px;
	width: 1px;
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		display: none;
	}
`;
