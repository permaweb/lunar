import styled from 'styled-components';

import { PrimitiveButton } from 'components/atoms/PrimitiveButton';
import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	position: relative;
	display: flex;
`;

export const Trigger = styled(PrimitiveButton)`
	height: 30px;
	width: 30px;
	padding: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: transparent;
	border: 1px solid transparent;
	border-radius: 50%;
	color: ${(props) => props.theme.colors.font.primary};
	cursor: pointer;
	transition: background 100ms, border-color 100ms;

	&:hover,
	&:focus-visible {
		background: ${(props) => props.theme.colors.button.primary.active.background};
		border-color: ${(props) => props.theme.colors.button.primary.active.border};
	}

	svg {
		display: block;
		height: 16px;
		width: 16px;
	}
`;

export const Menu = styled.div`
	position: absolute;
	z-index: 4;
	top: calc(100% + 8.5px);
	right: -1.5px;
	width: 220px;
	max-width: 75vw;
	max-height: 65vh;
	padding: 11.5px 10px;
	overflow-y: auto;
	overscroll-behavior: none;
`;

export const Item = styled(PrimitiveButton)`
	width: 100%;
	height: 40px;
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 0 7.5px;
	text-align: left;
	background: transparent;
	border: 1px solid transparent;
	border-radius: ${STYLING.dimensions.radius.alt2};
	color: ${(props) => props.theme.colors.font.primary};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	cursor: pointer;
	transition: background 100ms;

	&:hover,
	&:focus-visible {
		background: ${(props) => props.theme.colors.container.primary.active};
	}

	svg {
		display: block;
		height: 12px;
		width: 12px;
		color: ${(props) => props.theme.colors.font.alt2};
		fill: ${(props) => props.theme.colors.font.alt2};
	}
`;
