import styled, { keyframes } from 'styled-components';

import { STYLING } from 'helpers/config';

import { PrimitiveButton } from '../PrimitiveButton';

const tooltipFadeIn = keyframes`
	from {
		opacity: 0;
		transform: translateY(3px);
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
`;

const tooltipFadeInBelow = keyframes`
	from {
		opacity: 0;
		transform: translateY(-3px);
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
`;

export const Value = styled(PrimitiveButton)<{
	$tooltipVisible?: boolean;
	$fullWidth?: boolean;
	$tone?: 'default' | 'accent' | 'muted';
}>`
	position: relative;
	max-width: ${(props) => (props.$fullWidth ? '100%' : '45%')};
	display: flex;
	justify-content: ${(props) => (props.$fullWidth ? 'flex-start' : 'flex-end')};
	padding: 0;
	background: transparent;
	border: none;
	cursor: pointer;
	${(props) => props.$tone === 'accent' && `&& p { color: ${props.theme.colors.editor.alt1}; }`}
	${(props) => props.$tone === 'muted' && `&& p { color: ${props.theme.colors.font.alt1}; }`}

	p {
		max-width: 100%;
		text-align: ${(props) => (props.$fullWidth ? 'left' : 'right')};
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	> div {
		opacity: ${(props) => (props.$tooltipVisible ? 1 : 0)};
		visibility: ${(props) => (props.$tooltipVisible ? 'visible' : 'hidden')};
		transform: ${(props) => (props.$tooltipVisible ? 'translateY(0)' : `translateY(3px)`)};
		transition-delay: ${(props) => (props.$tooltipVisible ? '0s' : '0s, 0s, 140ms')};
	}

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		max-width: 100%;
		justify-content: flex-start;

		p {
			text-align: left;
		}
	}
`;

export const Tooltip = styled.div<{
	$placement?: 'top' | 'bottom';
	$position?: {
		top?: number;
		bottom?: number;
		left?: number;
		right?: number;
		maxWidth: number;
	} | null;
}>`
	position: fixed;
	z-index: 1000;
	top: ${(props) => (props.$position?.top !== undefined ? `${props.$position.top}px` : 'auto')};
	bottom: ${(props) => (props.$position?.bottom !== undefined ? `${props.$position.bottom}px` : 'auto')};
	left: ${(props) => (props.$position?.left !== undefined ? `${props.$position.left}px` : 'auto')};
	right: ${(props) => (props.$position?.right !== undefined ? `${props.$position.right}px` : 'auto')};
	opacity: 1;
	visibility: visible;
	transform: translateY(0);
	width: max-content;
	max-width: ${(props) => (props.$position ? `${props.$position.maxWidth}px` : `400px`)};
	padding: 2.5px 5px;
	background: ${(props) => props.theme.colors.container.alt8.background};
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.alt2};
	box-shadow: ${(props) => props.theme.colors.shadow.primary} 0px 1px 2px 0.5px;
	color: ${(props) => props.theme.colors.font.light1};
	font-size: ${(props) => props.theme.typography.size.xxxSmall};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	line-height: 1.2;
	text-align: left;
	white-space: normal;
	overflow-wrap: anywhere;
	pointer-events: none;
	animation: ${(props) => (props.$placement === 'bottom' ? tooltipFadeInBelow : tooltipFadeIn)} 140ms ease;
	transition: opacity 140ms ease, transform 140ms ease, visibility 0s linear 140ms;
`;
