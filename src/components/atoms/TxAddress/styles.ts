import styled from 'styled-components';

import { PrimitiveButton } from '../PrimitiveButton';

export const Tooltip = styled.div<{ position: string }>`
	position: absolute;
	z-index: 2;
	display: none;
	white-space: nowrap;

	${(props) => {
		switch (props.position) {
			case 'top':
				return `
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
        `;
			case 'bottom':
				return `
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
        `;
			case 'left':
				return `
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
        `;
			case 'right':
				return `
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
		  margin-left: 5px;
        `;
			case 'top-left':
				return `
          bottom: 100%;
          left: 0;
        `;
			case 'top-right':
				return `
          bottom: 100%;
          right: 0;
        `;
			case 'bottom-left':
				return `
          top: 100%;
          left: 0;
        `;
			case 'bottom-right':
				return `
          top: 100%;
          right: 0;
        `;
			default:
				return `
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
        `;
		}
	}}

	span {
		max-width: 100% !important;
		display: block !important;
		line-height: 1.1 !important;
		overflow: visible !important;
	}
`;

export const IconWrapper = styled.div`
	position: relative;
	flex-shrink: 0;
	height: fit-content;
	width: fit-content;
	&:hover {
		${Tooltip} {
			display: block;
		}
	}
`;

export const Wrapper = styled.div<{ $copied: boolean }>`
	display: flex;
	min-width: 0;
	max-width: 100%;
	align-items: center;
	gap: 6.5px;
	pointer-events: all !important;
	p,
	button > span {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: ${(props) => (props.$copied ? props.theme.colors.font.alt1 : props.theme.colors.link.color)} !important;
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		max-width: 100% !important;
		transition: all 100ms;
	}

	svg {
		height: 14px;
		width: 14px;
		margin: 5.5px 0 0 0;
		color: ${(props) => (props.$copied ? props.theme.colors.font.alt1 : props.theme.colors.link.color)} !important;
		fill: ${(props) => (props.$copied ? props.theme.colors.font.alt1 : props.theme.colors.link.color)} !important;
	}

	&:hover,
	&:focus-within {
		cursor: ${(props) => (props.$copied ? 'default' : 'pointer')};
		p,
		button > span {
			color: ${(props) => (props.$copied ? props.theme.colors.font.alt1 : props.theme.colors.link.active)} !important;
			text-decoration: ${(props) => (props.$copied ? 'none' : 'underline')};
			text-decoration-thickness: 1.25px;
		}
		svg {
			color: ${(props) => (props.$copied ? props.theme.colors.font.alt1 : props.theme.colors.link.active)} !important;
			fill: ${(props) => (props.$copied ? props.theme.colors.font.alt1 : props.theme.colors.link.active)} !important;
		}

		${Tooltip} {
			display: block;
		}
	}
`;

export const CopyControl = styled(PrimitiveButton)<{ $icon?: boolean }>`
	display: flex;
	align-items: center;
	min-width: 0;
	max-width: 100%;
	flex: ${(props) => (props.$icon ? '0 0 auto' : '0 1 auto')};
	padding: 0;
	border: none;
	background: transparent;
	cursor: pointer;
	text-align: inherit;
	&:focus-visible {
		outline: 1px solid ${(props) => props.theme.colors.link.color};
		outline-offset: 3px;
	}
`;
