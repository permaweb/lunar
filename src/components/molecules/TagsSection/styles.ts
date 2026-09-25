import styled from 'styled-components';

import { STYLING } from 'helpers/config';

import { OverviewStyles } from '../Overview';

export const Wrapper = styled.section<{ $fixedHeight?: number }>`
	height: ${(props) => (props.$fixedHeight ? `${props.$fixedHeight}px` : 'fit-content')};
	max-height: 600px;
	min-width: 0;
	flex: 1;
	display: flex;
	flex-direction: column;
	padding: 15px;
	overflow: hidden;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		width: 100%;
	}
`;

export const Header = styled.div<{ $compact?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	flex-shrink: 0;
	margin-bottom: 15px;

	h3 {
		font-size: ${(props) => props.theme.typography.size[props.$compact ? 'xSmall' : 'lg']};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}

	span {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt2};
	}
`;

export const List = styled(OverviewStyles.TagList)`
	max-height: none;
	min-height: 0;

	> * {
		flex-shrink: 0;
	}
`;

export const Row = styled(OverviewStyles.TagRow)`
	@media (max-width: ${STYLING.cutoffs.secondary}) {
		max-height: none;
	}
`;
