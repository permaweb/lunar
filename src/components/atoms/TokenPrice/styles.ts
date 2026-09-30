import styled from 'styled-components';

export const Wrapper = styled.span`
	display: inline-flex;
	align-items: baseline;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 2px 6px;
	font-variant-numeric: tabular-nums;
	> span {
		white-space: nowrap;
	}
`;

export const Change = styled.span<{ $direction: 'positive' | 'negative' | 'neutral' }>`
	font-size: ${(props) => props.theme.typography.size.xxxxSmall};
	font-weight: ${(props) => props.theme.typography.weight.medium};
	color: ${(props) =>
		props.$direction === 'neutral' ? props.theme.colors.font.alt1 : props.theme.colors.priceChange[props.$direction]};
`;
