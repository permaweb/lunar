import styled from 'styled-components';

export const Row = styled.tr`
	height: 40px;
	background: ${(props) => props.theme.colors.container.primary.background};
	cursor: pointer;
	&:hover,
	&:focus-within {
		background: ${(props) => props.theme.colors.container.alt1.background};
	}
`;
export const Status = styled.span`
	display: inline-flex;
	align-items: center;
	vertical-align: middle;
	gap: 7.5px;
	color: ${(props) => props.theme.colors.font.primary};
	font-weight: ${(props) => props.theme.typography.weight.medium};
`;
export const StatusDot = styled.span<{ $status: 'idle' | 'reachable' | 'unavailable' }>`
	height: 10px;
	width: 10px;
	flex: 0 0 10px;
	border-radius: 50%;
	opacity: 0.85;
	background: ${(props) =>
		props.$status === 'reachable'
			? props.theme.colors.indicator.active
			: props.$status === 'unavailable'
			? props.theme.colors.warning.primary
			: props.theme.colors.font.alt1};
`;
