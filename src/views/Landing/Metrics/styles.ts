import styled from 'styled-components';

import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div<{ gridTemplate: number }>`
	width: 100%;
	display: grid;
	grid-template-columns: repeat(${(props) => props.gridTemplate}, 1fr);
	gap: ${CSS_DIMENSIONS.px25};
	position: relative;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		grid-template-columns: repeat(1, 1fr);
	}
`;

export const Placeholder = styled.div`
	height: ${CSS_DIMENSIONS.px313_5};
	width: 100%;
	box-shadow: none !important;
	background: ${(props) => props.theme.colors.container.primary};
	border-radius: ${STYLING.dimensions.radius.alt1};
	background: linear-gradient(
		90deg,
		${(props) => props.theme.colors.container.primary.background} 0%,
		${(props) => props.theme.colors.container.alt2.background} 50%,
		${(props) => props.theme.colors.container.primary.background} 100%
	);
	background-size: 200% 100%;
	animation: shimmer 1s ease-in-out infinite alternate;

	@keyframes shimmer {
		0% {
			background-position: 0% 0;
		}
		100% {
			background-position: 100% 0;
		}
	}
`;

export const TotalsWrapper = styled.div`
	width: 100%;
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: ${CSS_DIMENSIONS.px25};
	margin: 0 0 ${CSS_DIMENSIONS.px30} 0;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		grid-template-columns: 1fr;
	}
`;

export const TotalCard = styled.div`
	min-height: ${CSS_DIMENSIONS.px102};
	padding: ${CSS_DIMENSIONS.px17_5} ${CSS_DIMENSIONS.px20};
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	gap: ${CSS_DIMENSIONS.px8};

	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}

	p {
		font-size: clamp(${CSS_DIMENSIONS.px18}, 1.5vw, ${CSS_DIMENSIONS.px24});
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}
`;

export const TotalPlaceholder = styled(Placeholder)`
	height: ${CSS_DIMENSIONS.px102};
`;

export const ErrorWrapper = styled.div`
	width: 100%;
	padding: ${CSS_DIMENSIONS.px20};
	color: ${(props) => props.theme.colors.warning.primary};
	background: ${(props) => props.theme.colors.container.primary.background};
	border-radius: ${STYLING.dimensions.radius.alt1};
`;
