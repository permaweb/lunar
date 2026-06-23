import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div<{ gridTemplate: number }>`
	width: 100%;
	display: grid;
	grid-template-columns: repeat(${(props) => props.gridTemplate}, 1fr);
	gap: 25px;
	position: relative;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		grid-template-columns: repeat(1, 1fr);
	}
`;

export const Placeholder = styled.div`
	height: 313.5px;
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
	gap: 25px;
	margin: 0 0 30px 0;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		grid-template-columns: 1fr;
	}
`;

export const TotalCard = styled.div`
	min-height: 102px;
	padding: 17.5px 20px;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	gap: 8px;

	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}

	p {
		font-size: clamp(18px, 1.5vw, 24px);
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}
`;

export const TotalPlaceholder = styled(Placeholder)`
	height: 102px;
`;

export const ErrorWrapper = styled.div`
	width: 100%;
	padding: 20px;
	color: ${(props) => props.theme.colors.warning.primary};
	background: ${(props) => props.theme.colors.container.primary.background};
	border-radius: ${STYLING.dimensions.radius.alt1};
`;
