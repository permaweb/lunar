import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	width: 100%;
	max-width: 910.5px;
	padding: 25px 0 0 0;
	display: flex;
	gap: 25px;
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};

	#docs-previous {
		align-items: flex-start;
		margin: 0 auto 0 0;

		i {
			margin: 0 7.5px 0 0;
		}
	}

	#docs-next {
		align-items: flex-end;
		margin: 0 0 0 auto;

		i {
			margin: 0 0 0 7.5px;
		}
	}

	a {
		flex: 1;
		max-width: calc(50% - 17.5px);
		display: flex;
		flex-direction: column;
		gap: 5px;
		padding: 8.5px 15px 15px 15px;
		background: ${(props) => props.theme.colors.container.alt1.background};
		border: 1px solid ${(props) => props.theme.colors.border.primary};
		border-radius: ${STYLING.dimensions.radius.primary};

		span {
			font-size: ${(props) => props.theme.typography.size.xxSmall} !important;
			font-weight: ${(props) => props.theme.typography.weight.medium} !important;
			font-family: ${(props) => props.theme.typography.family.primary} !important;
			color: ${(props) => props.theme.colors.font.alt1} !important;

			i {
				font-size: ${(props) => props.theme.typography.size.lg};
				color: ${(props) => props.theme.colors.font.alt1} !important;
				font-style: normal;
			}
		}

		p {
			font-size: ${(props) => props.theme.typography.size.xSmall} !important;
			font-weight: ${(props) => props.theme.typography.weight.bold} !important;
			font-family: ${(props) => props.theme.typography.family.primary} !important;
			color: ${(props) => props.theme.colors.font.primary} !important;
		}

		&:hover {
			border: 1px solid ${(props) => props.theme.colors.border.alt1};
			background: ${(props) => props.theme.colors.container.alt2.background};
		}
	}

	@media (max-width: ${STYLING.cutoffs.tablet}) {
		flex-direction: column;

		a {
			max-width: 100%;
		}

		#docs-previous {
			margin: 0;
		}

		#docs-next {
			margin: 0;
		}
	}
`;
