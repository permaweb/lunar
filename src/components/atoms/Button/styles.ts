import styled from 'styled-components';

import { STYLING } from 'helpers/config';

function getHeight(height: number | undefined) {
	if (height) {
		return `${height.toString()}px`;
	} else {
		return STYLING.dimensions.button.height;
	}
}

function getWidth(_noMinWidth: boolean | undefined, width: number | undefined, fullWidth: boolean | undefined) {
	if (fullWidth) {
		return `100%`;
	} else if (width) {
		return `${width}px`;
	} else return 'fit-content';
}

export const Tooltip = styled.div<{ useBottom: boolean }>`
	position: absolute;
	top: ${(props) => (props.useBottom ? 'auto' : '-32.5px')};
	bottom: ${(props) => (props.useBottom ? '-32.5px' : 'auto')};
	left: 50%;
	transform: translate(-50%, 0);
	z-index: 2;
	display: none;
`;

export const Wrapper = styled.div`
	position: relative;
	width: fit-content;
	&:hover {
		${Tooltip} {
			display: block;
		}
	}

	.info {
		padding: 0px 10px 3.5px 10px !important;
	}
`;

export const Primary = styled.button<{
	useMaxWidth: boolean | undefined;
	noMinWidth: boolean | undefined;
	width: number | undefined;
	fullWidth: boolean | undefined;
	height: number | undefined;
	active: boolean | undefined;
	warning: boolean | undefined;
}>`
	position: relative;
	background: ${(props) =>
		props.warning
			? props.theme.colors.warning.primary
			: props.active
			? props.theme.colors.button.primary.active.background
			: props.theme.colors.button.primary.background};
	min-height: ${(props) => getHeight(props.height)};
	height: ${(props) => getHeight(props.height)};
	min-width: ${(props) => getWidth(props.noMinWidth, props.width, props.fullWidth)};
	width: ${(props) => getWidth(props.noMinWidth, props.width, props.fullWidth)};
	max-width: ${(props) => (props.useMaxWidth ? STYLING.dimensions.button.width : '100%')};
	overflow: hidden;
	text-overflow: ellipsis;
	padding: 0 17.5px;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1px solid
		${(props) =>
			props.warning
				? props.theme.colors.warning.primary
				: props.active
				? props.theme.colors.button.primary.active.border
				: props.theme.colors.button.primary.border};
	border-radius: 36px;
	&:hover {
		background: ${(props) =>
			props.warning ? props.theme.colors.warning.alt1 : props.theme.colors.button.primary.active.background};
		border: 1px solid
			${(props) => (props.warning ? props.theme.colors.warning.alt1 : props.theme.colors.button.primary.active.border)};
		span {
			color: ${(props) =>
				props.warning ? props.theme.colors.font.light1 : props.theme.colors.button.primary.active.color} !important;
		}
		svg {
			fill: ${(props) =>
				props.warning ? props.theme.colors.font.light1 : props.theme.colors.button.primary.active.color} !important;
			color: ${(props) =>
				props.warning ? props.theme.colors.font.light1 : props.theme.colors.button.primary.active.color} !important;
		}
	}
	&:focus {
		background: ${(props) =>
			props.warning ? props.theme.colors.warning.alt1 : props.theme.colors.button.primary.active.background};
		border: 1px solid
			${(props) => (props.warning ? props.theme.colors.warning.alt1 : props.theme.colors.button.primary.active.border)};
		span {
			color: ${(props) =>
				props.warning ? props.theme.colors.font.light1 : props.theme.colors.button.primary.active.color} !important;
		}
		svg {
			fill: ${(props) =>
				props.warning ? props.theme.colors.font.light1 : props.theme.colors.button.primary.active.color} !important;
			color: ${(props) =>
				props.warning ? props.theme.colors.font.light1 : props.theme.colors.button.primary.active.color} !important;
		}
	}
	&:disabled {
		background: ${(props) => props.theme.colors.button.primary.disabled.background};
		border: 1px solid ${(props) => props.theme.colors.button.primary.disabled.border};
		span {
			color: ${(props) => props.theme.colors.button.primary.disabled.color} !important;
		}
		svg {
			fill: ${(props) => props.theme.colors.button.primary.disabled.color} !important;
			color: ${(props) => props.theme.colors.button.primary.disabled.color} !important;
		}
	}

	span {
		width: fit-content;
		text-overflow: ellipsis;
		overflow: hidden;
		font-size: ${(props) => props.theme.typography.size.xxSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		font-family: ${(props) => props.theme.typography.family.primary} !important;
		letter-spacing: 0.5px;
		color: ${(props) =>
			props.warning
				? props.theme.colors.font.light1
				: props.active
				? props.theme.colors.button.primary.active.color
				: props.theme.colors.button.primary.color} !important;
	}
`;

export const IconPrimary = styled.div<{
	active: boolean;
	disabled: boolean;
	leftAlign: boolean;
	warning?: boolean;
}>`
	svg {
		height: 15.5px;
		width: 15.5px;
		padding: 2px 0 0 0;
		margin: ${(props) => (props.leftAlign ? '2.5px 9.5px 0 0' : '2.5px 0 0 9.5px')};
		color: ${(props) =>
			props.warning
				? props.theme.colors.font.light1
				: props.disabled
				? props.theme.colors.button.primary.disabled.color
				: props.active
				? props.theme.colors.button.primary.active.color
				: props.theme.colors.button.primary.color};
		fill: ${(props) =>
			props.warning
				? props.theme.colors.font.light1
				: props.disabled
				? props.theme.colors.button.primary.disabled.color
				: props.active
				? props.theme.colors.button.primary.active.color
				: props.theme.colors.button.primary.color};
	}
`;

export const Alt1 = styled(Primary)`
	background: ${(props) =>
		props.active ? props.theme.colors.button.alt1.active.background : props.theme.colors.button.alt1.background};
	border: 1px solid
		${(props) => (props.active ? props.theme.colors.button.alt1.active.border : props.theme.colors.button.alt1.border)};
	&:hover {
		background: ${(props) => props.theme.colors.button.alt1.active.background};
		border: 1px solid ${(props) => props.theme.colors.button.alt1.active.border};
		span {
			color: ${(props) => props.theme.colors.button.alt1.active.color} !important;
		}
		svg {
			fill: ${(props) => props.theme.colors.button.alt1.active.color} !important;
			color: ${(props) => props.theme.colors.button.alt1.active.color} !important;
		}
	}
	&:focus {
		background: ${(props) =>
			props.active
				? props.theme.colors.button.alt1.active.background
				: props.theme.colors.button.alt1.active.background};
		border: 1px solid ${(props) => props.theme.colors.button.alt1.active.border};
		span {
			color: ${(props) => props.theme.colors.button.alt1.active.color} !important;
		}
		svg {
			fill: ${(props) => props.theme.colors.button.alt1.active.color} !important;
			color: ${(props) => props.theme.colors.button.alt1.active.color} !important;
		}
	}
	&:disabled {
		background: ${(props) => props.theme.colors.button.alt1.disabled.background};
		border: 1px solid ${(props) => props.theme.colors.button.alt1.disabled.border};
		span {
			color: ${(props) => props.theme.colors.button.alt1.disabled.color} !important;
		}
		svg {
			fill: ${(props) => props.theme.colors.button.alt1.disabled.color} !important;
			color: ${(props) => props.theme.colors.button.alt1.disabled.color} !important;
		}
	}

	span {
		width: fit-content;
		text-overflow: ellipsis;
		overflow: hidden;
		color: ${(props) => props.theme.colors.button.alt1.color} !important;
	}
`;

export const IconAlt1 = styled(IconPrimary)`
	svg {
		color: ${(props) =>
			props.disabled
				? props.theme.colors.button.alt1.disabled.color
				: props.active
				? props.theme.colors.button.alt1.active.color
				: props.theme.colors.button.alt1.color};
	}
`;

export const Alt2 = styled(Alt1)`
	height: fit-content;
	min-height: 0;
	width: fit-content;
	min-width: 0;
	padding: 0;
	background: transparent !important;
	border: none !important;
	border-radius: 0;

	&:hover {
		span {
			color: ${(props) => props.theme.colors.button.alt2.active.color} !important;
		}

		svg {
			fill: ${(props) => props.theme.colors.button.alt2.active.color} !important;
			color: ${(props) => props.theme.colors.button.alt2.active.color} !important;
		}
	}
	&:focus {
		span {
			color: ${(props) => props.theme.colors.button.alt2.active.color} !important;
		}

		svg {
			fill: ${(props) => props.theme.colors.button.alt2.active.color} !important;
			color: ${(props) => props.theme.colors.button.alt2.active.color} !important;
		}
	}
	&:disabled {
		background: ${(props) => props.theme.colors.button.alt2.disabled.background};
		border: 1px solid ${(props) => props.theme.colors.button.alt2.disabled.border};
		span {
			color: ${(props) => props.theme.colors.button.alt2.disabled.color} !important;
		}
		svg {
			fill: ${(props) => props.theme.colors.button.alt2.disabled.color} !important;
			color: ${(props) => props.theme.colors.button.alt2.disabled.color} !important;
		}
	}

	span {
		width: fit-content;
		text-overflow: ellipsis;
		overflow: hidden;
		font-size: ${(props) => props.theme.typography.size.xxSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		color: ${(props) =>
			props.active ? props.theme.colors.button.alt2.active.color : props.theme.colors.button.alt2.color} !important;
	}
`;

export const IconAlt2 = styled(IconAlt1)`
	svg {
		margin: ${(props) => (props.leftAlign ? '3.5px 3.5px 0 0' : '3.5px 0 0 3.5px')};
		color: ${(props) =>
			props.disabled
				? props.theme.colors.button.alt2.disabled.color
				: props.active
				? props.theme.colors.button.alt2.active.color
				: props.theme.colors.button.alt2.color};
	}
`;

export const Alt3 = styled(Primary)`
	min-height: 25px !important;
	height: 25px !important;
	padding: 4.5px 20px !important;
	border-radius: ${STYLING.dimensions.radius.primary};
	border-radius: 20px;

	background: ${(props) =>
		props.warning
			? props.theme.colors.warning.primary
			: props.active
			? props.theme.colors.button.alt1.background
			: props.theme.colors.button.primary.background};
	border: 1px solid
		${(props) =>
			props.warning
				? props.theme.colors.warning.primary
				: props.active
				? props.theme.colors.button.alt1.border
				: props.theme.colors.button.primary.border};

	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		font-family: ${(props) => props.theme.typography.family.primary} !important;
		letter-spacing: 0.35px;
		color: ${(props) =>
			props.warning
				? props.theme.colors.font.light1
				: props.active
				? props.theme.colors.font.light1
				: props.theme.colors.button.primary.color} !important;
	}

	&:hover {
		background: ${(props) =>
			props.warning ? props.theme.colors.warning.alt1 : props.theme.colors.button.alt1.background};
		border: 1px solid
			${(props) => (props.warning ? props.theme.colors.warning.alt1 : props.theme.colors.button.alt1.border)};
		span {
			color: ${(props) =>
				props.warning ? props.theme.colors.font.light1 : props.theme.colors.button.alt1.color} !important;
		}
		svg {
			fill: ${(props) =>
				props.warning ? props.theme.colors.font.light1 : props.theme.colors.button.alt1.color} !important;
			color: ${(props) =>
				props.warning ? props.theme.colors.font.light1 : props.theme.colors.button.alt1.color} !important;
		}
	}
	&:focus {
		background: ${(props) =>
			props.warning ? props.theme.colors.warning.alt1 : props.theme.colors.button.alt1.background};
		border: 1px solid
			${(props) => (props.warning ? props.theme.colors.warning.alt1 : props.theme.colors.button.alt1.border)};
		span {
			color: ${(props) =>
				props.warning ? props.theme.colors.font.light1 : props.theme.colors.button.alt1.color} !important;
		}
		svg {
			fill: ${(props) =>
				props.warning ? props.theme.colors.font.light1 : props.theme.colors.button.alt1.color} !important;
			color: ${(props) =>
				props.warning ? props.theme.colors.font.light1 : props.theme.colors.button.alt1.color} !important;
		}
	}
	&:disabled {
		background: ${(props) => props.theme.colors.button.primary.disabled.background};
		border: 1px solid ${(props) => props.theme.colors.button.primary.disabled.border};
		span {
			color: ${(props) => props.theme.colors.button.primary.disabled.color} !important;
		}
		svg {
			fill: ${(props) => props.theme.colors.button.primary.disabled.color} !important;
			color: ${(props) => props.theme.colors.button.primary.disabled.color} !important;
		}
	}
`;

export const IconAlt3 = styled(IconPrimary)`
	svg {
		height: 13.5px;
		width: 13.5px;
		margin: ${(props) => (props.leftAlign ? '2.5px 6.5px 0 0' : '2.5px 0 0 6.5px')};
		color: ${(props) =>
			props.disabled
				? props.theme.colors.button.alt2.disabled.color
				: props.warning
				? props.theme.colors.font.light1
				: props.active
				? props.theme.colors.font.light1
				: props.theme.colors.button.primary.color};
		fill: ${(props) =>
			props.disabled
				? props.theme.colors.button.alt2.disabled.color
				: props.warning
				? props.theme.colors.font.light1
				: props.active
				? props.theme.colors.font.light1
				: props.theme.colors.button.primary.color};
	}
`;

export const Alt4 = styled(Primary)`
	min-height: 25px !important;
	height: 25px !important;
	padding: 0 10px !important;
	border-radius: 20px;

	background: ${(props) =>
		props.warning
			? props.theme.colors.warning.primary
			: props.active
			? props.theme.colors.button.alt1.active.background
			: props.theme.colors.button.alt1.background};
	border: 1px solid
		${(props) =>
			props.warning
				? props.theme.colors.warning.primary
				: props.active
				? props.theme.colors.button.alt1.active.border
				: props.theme.colors.button.alt1.border};

	span {
		font-size: ${(props) => props.theme.typography.size.xxxSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		color: ${(props) =>
			props.warning
				? props.theme.colors.font.light1
				: props.active
				? props.theme.colors.font.light1
				: props.theme.colors.button.alt1.color} !important;
	}

	&:hover {
		background: ${(props) =>
			props.warning ? props.theme.colors.warning.alt1 : props.theme.colors.button.alt1.active.background};
		border: 1px solid
			${(props) => (props.warning ? props.theme.colors.warning.alt1 : props.theme.colors.button.alt1.active.border)};
		span {
			color: ${(props) =>
				props.warning ? props.theme.colors.font.light1 : props.theme.colors.button.alt1.active.color} !important;
		}
		svg {
			fill: ${(props) =>
				props.warning ? props.theme.colors.font.light1 : props.theme.colors.button.alt1.active.color} !important;
			color: ${(props) =>
				props.warning ? props.theme.colors.font.light1 : props.theme.colors.button.alt1.active.color} !important;
		}
	}
	&:focus {
		background: ${(props) =>
			props.warning ? props.theme.colors.warning.alt1 : props.theme.colors.button.alt1.active.background};
		border: 1px solid
			${(props) => (props.warning ? props.theme.colors.warning.alt1 : props.theme.colors.button.alt1.active.border)};
		span {
			color: ${(props) =>
				props.warning ? props.theme.colors.font.light1 : props.theme.colors.button.alt1.active.color} !important;
		}
		svg {
			fill: ${(props) =>
				props.warning ? props.theme.colors.font.light1 : props.theme.colors.button.alt1.active.color} !important;
			color: ${(props) =>
				props.warning ? props.theme.colors.font.light1 : props.theme.colors.button.alt1.active.color} !important;
		}
	}
	&:disabled {
		background: ${(props) => props.theme.colors.button.alt1.disabled.background};
		border: 1px solid ${(props) => props.theme.colors.button.alt1.disabled.border};
		span {
			color: ${(props) => props.theme.colors.button.alt1.disabled.color} !important;
		}
		svg {
			fill: ${(props) => props.theme.colors.button.alt1.disabled.color} !important;
			color: ${(props) => props.theme.colors.button.alt1.disabled.color} !important;
		}
	}
`;

export const IconAlt4 = styled(IconPrimary)`
	svg {
		height: 13.5px;
		width: 13.5px;
		margin: ${(props) => (props.leftAlign ? '2.5px 6.5px 0 0' : '2.5px 0 0 6.5px')};
		color: ${(props) =>
			props.disabled
				? props.theme.colors.button.alt2.disabled.color
				: props.warning
				? props.theme.colors.font.light1
				: props.active
				? props.theme.colors.font.light1
				: props.theme.colors.button.alt1.color};
		fill: ${(props) =>
			props.disabled
				? props.theme.colors.button.alt2.disabled.color
				: props.warning
				? props.theme.colors.font.light1
				: props.active
				? props.theme.colors.font.light1
				: props.theme.colors.button.alt1.color};
	}
`;

export const Warning = styled(Alt1)`
	background: ${(props) => (props.active ? props.theme.colors.warning.alt1 : props.theme.colors.warning.primary)};
	border: 1px solid ${(props) => (props.active ? props.theme.colors.warning.alt1 : props.theme.colors.warning.primary)};
	&:hover {
		background: ${(props) => props.theme.colors.warning.alt1};
		border: 1px solid ${(props) => props.theme.colors.warning.alt1};
		span {
			color: ${(props) => props.theme.colors.font.light1} !important;
		}
		svg {
			fill: ${(props) => props.theme.colors.font.light1} !important;
			color: ${(props) => props.theme.colors.font.light1} !important;
		}
	}
	&:focus {
		background: ${(props) => (props.active ? props.theme.colors.warning.alt1 : props.theme.colors.warning.alt1)};
		border: 1px solid ${(props) => props.theme.colors.warning.alt1};
		span {
			color: ${(props) => props.theme.colors.font.light1} !important;
		}
		svg {
			fill: ${(props) => props.theme.colors.font.light1} !important;
			color: ${(props) => props.theme.colors.font.light1} !important;
		}
	}
	&:disabled {
		background: ${(props) => props.theme.colors.button.alt1.disabled.background};
		border: 1px solid ${(props) => props.theme.colors.button.alt1.disabled.border};
		span {
			color: ${(props) => props.theme.colors.button.alt1.disabled.color} !important;
		}
		svg {
			fill: ${(props) => props.theme.colors.button.alt1.disabled.color} !important;
			color: ${(props) => props.theme.colors.button.alt1.disabled.color} !important;
		}
	}

	span {
		width: fit-content;
		text-overflow: ellipsis;
		overflow: hidden;
		color: ${(props) => props.theme.colors.font.light1} !important;
	}
`;

export const IconWarning = styled(IconPrimary)`
	svg {
		color: ${(props) =>
			props.disabled
				? props.theme.colors.button.alt1.disabled.color
				: props.active
				? props.theme.colors.font.light1
				: props.theme.colors.font.light1};
	}
`;
