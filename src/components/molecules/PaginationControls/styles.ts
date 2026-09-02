import styled from 'styled-components';

import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: ${CSS_DIMENSIONS.px12_5};
`;

export const ControlGroup = styled.div`
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px7_5};

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
		height: ${CSS_DIMENSIONS.px30};
		width: ${CSS_DIMENSIONS.px70};
		padding: 0 ${CSS_DIMENSIONS.px7_5};
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
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
	height: ${CSS_DIMENSIONS.px20};
	width: ${CSS_DIMENSIONS.px1};
	border-right: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		display: none;
	}
`;
