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
          margin-bottom: 5px;
        `;
			case 'bottom':
				return `
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 5px;
        `;
			case 'left':
				return `
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-right: 5px;
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
          margin-bottom: 5px;
        `;
			case 'top-right':
				return `
          bottom: 100%;
          right: 0;
          margin-bottom: 5px;
        `;
			case 'bottom-left':
				return `
          top: 100%;
          left: 0;
          margin-top: 5px;
        `;
			case 'bottom-right':
				return `
          top: 100%;
          right: 0;
          margin-top: 5px;
        `;
			default:
				return `
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 5px;
        `;
		}
	}}

	span {
		display: block;
		line-height: 1.65;
	}
`;

export const Wrapper = styled.div`
	position: relative;
	height: fit-content;
	width: fit-content;
	&:hover {
		${Tooltip} {
			display: block;
		}
	}
`;

export const Primary = styled.button<{
	dimensions: { wrapper: number; icon: number } | undefined;
	sm: boolean | undefined;
	warning: boolean | undefined;
	disabled: boolean | undefined;
	active: boolean | undefined;
}>`
	height: ${(props) => (props.dimensions ? `${props.dimensions.wrapper.toString()}px` : `42.5px`)};
	width: ${(props) => (props.dimensions ? `${props.dimensions.wrapper.toString()}px` : `42.5px`)};
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 4.5px 0 0 0 !important;
	pointer-events: ${(props) => (props.disabled ? 'none' : 'all')};
	border-radius: 50%;
	cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')} !important;

	svg {
		height: ${(props) => (props.dimensions ? `${props.dimensions.icon.toString()}px` : `24.5px`)};
		width: ${(props) => (props.dimensions ? `${props.dimensions.icon.toString()}px` : `24.5px`)};
		color: ${(props) =>
			props.disabled
				? props.theme.colors.icon.primary.disabled
				: props.active
				? props.theme.colors.icon.primary.fill
				: props.theme.colors.icon.primary.fill};
		fill: ${(props) =>
			props.disabled
				? props.theme.colors.icon.primary.disabled
				: props.active
				? props.theme.colors.icon.primary.fill
				: props.theme.colors.icon.primary.fill};
	}
	&:hover {
		background: ${(props) => props.theme.colors.icon.primary.active};
	}
`;

export const Alt1 = styled(Primary)`
	background: ${(props) =>
		props.active
			? props.theme.colors.button.primary.active.background
			: props.disabled
			? props.theme.colors.button.primary.disabled.background
			: props.theme.colors.button.primary.background};
	border: 1px solid
		${(props) =>
			props.active
				? props.theme.colors.button.primary.active.border
				: props.disabled
				? props.theme.colors.button.primary.disabled.border
				: props.theme.colors.button.primary.border};
	svg {
		height: ${(props) => (props.dimensions ? `${props.dimensions.icon.toString()}px` : `24.5px`)};
		width: ${(props) => (props.dimensions ? `${props.dimensions.icon.toString()}px` : `24.5px`)};
		color: ${(props) =>
			props.active
				? props.theme.colors.font.light1
				: props.disabled
				? props.theme.colors.button.primary.disabled.color
				: props.theme.colors.button.primary.color};
		fill: ${(props) =>
			props.active
				? props.theme.colors.font.light1
				: props.disabled
				? props.theme.colors.button.primary.disabled.color
				: props.theme.colors.button.primary.color};
	}

	&:hover {
		background: ${(props) =>
			props.disabled
				? props.theme.colors.button.primary.disabled.background
				: props.theme.colors.button.primary.active.background};

		svg {
			color: ${(props) =>
				props.active
					? props.theme.colors.font.light1
					: props.disabled
					? props.theme.colors.button.primary.disabled.color
					: props.theme.colors.button.primary.active.color};
			fill: ${(props) =>
				props.active
					? props.theme.colors.font.light1
					: props.disabled
					? props.theme.colors.button.primary.disabled.color
					: props.theme.colors.button.primary.active.color};
		}
	}
`;
