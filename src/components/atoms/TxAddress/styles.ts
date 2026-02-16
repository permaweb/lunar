import styled from 'styled-components';

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
		line-height: 1.65 !important;
		overflow: visible !important;
	}
`;

export const IconWrapper = styled.div`
	position: relative;
	height: fit-content;
	width: fit-content;
	&:hover {
		${Tooltip} {
			display: block;
		}
	}
`;

export const Wrapper = styled.div<{ disabled: boolean }>`
	display: flex;
	align-items: center;
	gap: 6.5px;
	p {
		color: ${(props) => (props.disabled ? props.theme.colors.font.alt1 : props.theme.colors.link.color)} !important;
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		max-width: 100% !important;
		transition: all 100ms;
	}

	svg {
		height: 12.5px;
		width: 12.5px;
		margin: 7.5px 0 0 0;
		color: ${(props) => (props.disabled ? props.theme.colors.font.alt1 : props.theme.colors.link.color)} !important;
		fill: ${(props) => (props.disabled ? props.theme.colors.font.alt1 : props.theme.colors.link.color)} !important;
	}

	&:hover {
		cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
		p {
			color: ${(props) => (props.disabled ? props.theme.colors.font.alt1 : props.theme.colors.link.active)} !important;
		}
		svg {
			color: ${(props) => (props.disabled ? props.theme.colors.font.alt1 : props.theme.colors.link.active)} !important;
			fill: ${(props) => (props.disabled ? props.theme.colors.font.alt1 : props.theme.colors.link.active)} !important;
		}
	}
`;
