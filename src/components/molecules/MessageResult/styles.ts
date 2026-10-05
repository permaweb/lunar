import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	width: 100%;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 25px;
`;

export const TagLine = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;

	p,
	span {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		white-space: nowrap;
	}

	p {
		color: ${(props) => props.theme.colors.font.primary};
		text-align: right;
		text-align: right;
		max-width: 45%;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	span {
		color: ${(props) => props.theme.colors.font.alt1};
		max-width: 45%;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		flex-direction: column;
		align-items: flex-start;
		justify-content: flex-start;
		gap: 5px;

		p {
			text-align: left;
		}
	}
`;

export const ResultWrapper = styled.div`
	flex: 1;
	min-width: 0;
`;
