import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	width: 100%;
	padding: 25px 0 0 0;
	display: flex;
	gap: 25px;
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};

	#docs-previous {
		align-items: flex-start;
		margin: 0 auto 0 0;
	}

	#docs-next {
		align-items: flex-end;
		margin: 0 0 0 auto;
	}

	a {
		flex: 1;
		max-width: calc(50% - 17.5px);
		display: flex;
		flex-direction: column;
		gap: 2.5px;
		padding: 15px;
		border: 1px solid ${(props) => props.theme.colors.border.primary};
		border-radius: ${STYLING.dimensions.radius.primary};

		span {
			font-size: ${(props) => props.theme.typography.size.xxSmall} !important;
			font-weight: ${(props) => props.theme.typography.weight.medium} !important;
			font-family: ${(props) => props.theme.typography.family.primary} !important;
			color: ${(props) => props.theme.colors.font.alt1} !important;
		}

		p {
			font-size: ${(props) => props.theme.typography.size.xSmall} !important;
			font-weight: ${(props) => props.theme.typography.weight.bold} !important;
			font-family: ${(props) => props.theme.typography.family.primary} !important;
			color: ${(props) => props.theme.colors.font.primary} !important;
		}

		&:hover {
			border: 1px solid ${(props) => props.theme.colors.border.alt4};
			background: ${(props) => props.theme.colors.container.primary.active};
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
