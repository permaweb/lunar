import styled from 'styled-components';

import { PrimitiveButton } from 'components/atoms/PrimitiveButton';
import { BlockListStyles } from 'components/molecules/BlockList';
import { STYLING } from 'helpers/config';

export const FIELD_COLUMNS = 'minmax(0, 1.1fr) repeat(3, minmax(0, 1fr))';
export const METADATA_COLUMNS = 'minmax(0, 1.1fr) repeat(2, minmax(0, 1fr))';

export const Section = styled.section`
	min-width: 0;
	width: 100%;
`;

export const Header = styled(BlockListStyles.Header)<{ $nested: boolean }>`
	gap: 15px;
	border-top-left-radius: ${(props) => (props.$nested ? '0' : STYLING.dimensions.radius.alt1)};
	border-top-right-radius: ${(props) => (props.$nested ? '0' : STYLING.dimensions.radius.alt1)};
	background: ${(props) => props.theme.colors.container.primary.background};
`;

export const Title = styled(BlockListStyles.HeaderMain)<{ $nested: boolean }>`
	min-width: 0;
	&& h3 {
		margin: 0;
		font-size: ${(props) => (props.$nested ? props.theme.typography.size.xSmall : props.theme.typography.size.lg)};
	}
`;

export const HeaderDetails = styled.div`
	min-width: 0;
	max-width: 100%;
	margin-left: auto;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	flex-wrap: wrap;
	gap: 15px;
	text-align: right;
`;

export const Count = styled.span`
	color: ${(props) => props.theme.colors.font.alt1};
	margin-left: 7.5px;
`;

export const Device = styled.span`
	min-width: 0;
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	color: ${(props) => props.theme.colors.font.alt1};
	overflow-wrap: anywhere;
`;

export const Actions = BlockListStyles.HeaderActions;

export const Coverage = styled.p`
	min-width: 0;
	color: ${(props) => props.theme.colors.font.alt1} !important;
`;

export const Value = styled.div`
	min-width: 0;
	max-width: 100%;
`;

export const Expand = styled(PrimitiveButton)`
	display: inline-flex;
	align-items: center;
	gap: 7.5px;
	max-width: 100%;
	min-width: 0;
	padding: 0;
	border: 0;
	background: transparent;
	color: ${(props) => props.theme.colors.link.color};
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	span {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	> div {
		flex-shrink: 0;
	}
	svg {
		transition: transform 150ms ease-in-out;
	}
	&[aria-expanded='true'] svg {
		transform: rotate(180deg);
	}
	@media (prefers-reduced-motion: reduce) {
		svg {
			transition: none;
		}
	}
	&:hover {
		text-decoration: underline;
	}
	&:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 3px;
	}
`;

export const Child = styled.div`
	min-width: 0;
	border: 1px solid ${(props) => props.theme.colors.border.alt1};
	overflow: hidden;
`;

export const Status = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 15px;
	padding: 15px;
	background: ${(props) => props.theme.colors.container.primary.background};
	font-size: ${(props) => props.theme.typography.size.xSmall};
`;

export const Source = styled(Status)`
	padding: 10px 15px;
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	color: ${(props) => props.theme.colors.font.alt1};
	background: ${(props) => props.theme.colors.container.alt1.background};
	overflow-wrap: anywhere;
`;

export const Empty = styled(Status)<{ $nested: boolean }>`
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-top: 0;
	border-radius: 0 0 ${(props) => (props.$nested ? '0' : STYLING.dimensions.radius.alt1)}
		${(props) => (props.$nested ? '0' : STYLING.dimensions.radius.alt1)};
`;

export const Loading = styled(BlockListStyles.UpdateWrapper)<{ $nested: boolean }>`
	border-bottom-left-radius: ${(props) => (props.$nested ? '0' : STYLING.dimensions.radius.alt1)};
	border-bottom-right-radius: ${(props) => (props.$nested ? '0' : STYLING.dimensions.radius.alt1)};
`;
