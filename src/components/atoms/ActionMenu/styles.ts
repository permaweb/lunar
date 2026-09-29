import styled from 'styled-components';

import { PrimitiveButton } from 'components/atoms/PrimitiveButton';
import { dropdownItemStyles, dropdownSurfaceStyles } from 'components/atoms/Select';
import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	position: relative;
	display: flex;
`;

export const PlainTrigger = styled(PrimitiveButton)`
	height: 32px;
	padding: 0;
	display: flex;
	align-items: center;
	gap: 5px;
	background: transparent;
	border: none;
	border-radius: ${STYLING.dimensions.radius.alt2};
	color: ${(props) => props.theme.colors.font.alt1};
	font-family: ${(props) => props.theme.typography.family.alt1};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	cursor: pointer;

	&:hover,
	&:focus-visible,
	&[aria-expanded='true'] {
		color: ${(props) => props.theme.colors.font.primary};
	}

	&:focus-visible {
		outline: 2px solid ${(props) => props.theme.colors.border.alt4};
		outline-offset: 4px;
	}
`;

export const Menu = styled.div<{ $alignStart?: boolean; $offset?: number }>`
	${dropdownSurfaceStyles}
	top: calc(100% + ${(props) => props.$offset ?? 8.5}px);
	${(props) => (props.$alignStart ? 'left: 0;' : 'right: -1.5px;')}
	width: 220px;
	overscroll-behavior: none;
`;

export const Item = styled(PrimitiveButton)`
	${dropdownItemStyles}
	width: 100%;
	justify-content: flex-start;

	span {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	svg {
		display: block;
		height: 12px;
		width: 12px;
		color: currentColor;
		fill: currentColor;
	}
`;
