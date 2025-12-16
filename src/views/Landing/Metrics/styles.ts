import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	width: 100%;
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 25px;
	position: relative;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		grid-template-columns: repeat(1, 1fr);
	}
`;

export const Placeholder = styled.div`
	height: 250px;
	width: 100%;
	box-shadow: none !important;
	background: ${(props) => props.theme.colors.container.primary};
	border: 1px solid ${(props) => props.theme.colors.border.alt1};
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
