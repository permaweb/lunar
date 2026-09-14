import styled from 'styled-components';

export const TableScroll = styled.div`
	width: 100%;
	overflow-x: auto;
	/* Keep the viewport in place when a checked row moves in the sorted list. */
	overflow-anchor: none;
	&:focus-visible {
		outline: 2px solid ${(props) => props.theme.colors.border.alt4};
		outline-offset: -2px;
	}
`;
export const Table = styled.table`
	width: 100%;
	min-width: 930px;
	border-collapse: collapse;
	text-align: left;
	th,
	td {
		height: 40px;
		padding: 0 15px;
		vertical-align: middle;
		white-space: nowrap;
		border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}
	th {
		background: ${(props) => props.theme.colors.container.alt1.background};
		color: ${(props) => props.theme.colors.font.alt1};
		border-top: 1px solid ${(props) => props.theme.colors.border.primary};
	}
	td:first-child {
		min-width: 205px;
	}
`;

export const InfoRow = styled.tr`
	&,
	&:hover {
		background: transparent;
		outline: none;
		cursor: default;
	}
`;

export const GroupHeading = styled.th`
	&& {
		padding: 14px 15px;
		white-space: normal;
	}
`;
