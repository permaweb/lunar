import styled from 'styled-components';

import { PrimitiveButton } from 'components/atoms/PrimitiveButton';
import { transition1 } from 'helpers/animations';
import { STYLING } from 'helpers/config';

export const NODE_WIDTH = 420;
export const NODE_HEIGHT = 470;

export const Card = styled.div`
	width: ${NODE_WIDTH}px;
	height: ${NODE_HEIGHT}px;
	display: flex;
	flex-direction: column;
	border: 1px solid ${(props) => props.theme.colors.border.alt1};
	border-radius: ${STYLING.dimensions.radius.alt1};
	background: ${(props) => props.theme.colors.container.primary.background};
	color: ${(props) => props.theme.colors.font.primary};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-size: ${(props) => props.theme.typography.size.xSmall};
	.react-flow__handle {
		background: ${(props) => props.theme.colors.link.color};
	}
`;
export const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 15px;
	padding: 12px 15px;
	border-top-left-radius: ${STYLING.dimensions.radius.alt1};
	border-top-right-radius: ${STYLING.dimensions.radius.alt1};
	background: ${(props) => props.theme.colors.container.alt1.background};
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	cursor: grab;
`;
export const Title = styled.strong`
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;
export const Meta = styled.span`
	display: block;
	min-width: 0;
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	color: ${(props) => props.theme.colors.font.alt1};
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;
export const Identity = styled.div`
	display: grid;
	gap: 5px;
	padding: 10px 15px;
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	&:empty {
		display: none;
	}
`;
export const Body = styled.div<{ $hasOverflow: boolean }>`
	min-height: 0;
	flex: 1;
	padding-right: 0;
	transition: padding-right ${transition1};
	overscroll-behavior: contain;
	border-radius: 0 0 ${STYLING.dimensions.radius.alt1} ${STYLING.dimensions.radius.alt1};

	&:not(:hover) {
		scrollbar-width: none;

		&::-webkit-scrollbar {
			width: 0;
		}
	}

	&:hover {
		padding-right: ${(props) => (props.$hasOverflow ? '12.5px' : '0')};
	}

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`;
export const Field = styled.div<{ $covered: boolean }>`
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
	gap: 12px;
	padding: 9px 15px;
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	background: ${(props) => (props.$covered ? props.theme.colors.container.primary.active : 'transparent')};
	box-shadow: ${(props) => (props.$covered ? `inset 3px 0 ${props.theme.colors.link.color}` : 'none')};
`;
export const Key = styled.div`
	min-width: 0;
	display: grid;
	gap: 4px;
	strong {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
`;
export const Value = styled.div`
	min-width: 0;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	justify-content: center;
	gap: 4px;
`;
export const Expand = styled(PrimitiveButton)`
	min-width: 0;
	max-width: 100%;
	display: inline-flex;
	align-items: center;
	gap: 7px;
	padding: 0;
	border: 0;
	background: transparent;
	color: ${(props) => props.theme.colors.link.color};
	font: inherit;
	span {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	> div {
		flex-shrink: 0;
	}
	&[aria-expanded='true'] svg {
		transform: rotate(180deg);
	}
	&:hover:not(:disabled) {
		text-decoration: underline;
	}
	&:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 3px;
	}
	&:disabled {
		opacity: 0.5;
		cursor: default;
	}
`;
export const Coverage = styled(Expand)`
	font-size: ${(props) => props.theme.typography.size.xxSmall};
`;
export const Status = styled.div`
	padding: 15px;
	display: grid;
	gap: 15px;
	overflow-wrap: anywhere;
`;
export const HighlightNote = styled(Status)`
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	background: ${(props) => props.theme.colors.container.alt1.background};
`;
export const Pagination = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	padding: 10px;
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};
`;
