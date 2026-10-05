import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	min-width: 0;
	min-height: 0;
	display: flex;
	flex-direction: column;
`;

export const List = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 25px;
	flex-shrink: 0;
	padding: 0 0 12.5px;
	margin: -2.5px 0 0 0;
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
`;

export const Tab = styled.button`
	position: relative;
	/* min-height: 30px; */
	padding: 0;
	border: none;
	background: transparent;
	color: ${(props) => props.theme.colors.font.alt1};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	cursor: pointer;

	&[aria-selected='true'],
	&:hover:not(:disabled) {
		color: ${(props) => props.theme.colors.font.primary};
	}

	&::after {
		content: '';
		position: absolute;
		bottom: -12.5px;
		left: 0;
		height: 2.5px;
		width: 100%;
		background: ${(props) => props.theme.colors.border.alt4};
		border-radius: ${STYLING.dimensions.radius.primary};
		pointer-events: none;
		transform: scaleX(0);
		transform-origin: center;
		transition: transform 0.15s ease;
	}

	&[aria-selected='true']::after,
	&:hover:not(:disabled)::after,
	&:focus-visible:not(:disabled)::after {
		transform: scaleX(1);
	}

	&:focus-visible {
		outline: 2px solid ${(props) => props.theme.colors.border.alt4};
		outline-offset: 1px;
	}

	&:disabled {
		color: ${(props) => props.theme.colors.button.primary.disabled.color};
		cursor: default;
	}

	@media (prefers-reduced-motion: reduce) {
		&::after {
			transition: none;
		}
	}
`;

export const Content = styled.div`
	min-height: 0;
	margin-top: 12.5px;
`;

export const Panel = styled.div`
	&[hidden] {
		display: none;
	}
`;
