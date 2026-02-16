import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 25px;
`;

export const HeaderWrapper = styled.div`
	width: 100%;
	background: ${(props) => props.theme.colors.container.alt1.background};
`;

export const TabsWrapper = styled.div`
	width: 100%;
	display: flex;
	align-items: center;
	position: relative;
	margin: 30px 0 0 0;
`;

export const BodyWrapper = styled.div`
	width: 100%;
`;

export const TabsContent = styled.div`
	width: 100%;
	display: flex;
	align-items: center;
	position: relative;
	z-index: 0;
	white-space: nowrap;
	overflow-x: auto;
	overflow-y: hidden;
	padding: 0 1px 1.5px 1px;
`;

export const TabDivider = styled.div`
	height: 22.5px;
	width: 1px;
	margin: 3.5px 0 0 0;
	border-left: 1px solid ${(props) => props.theme.colors.border.primary};
`;

export const DeleteAction = styled.div`
	display: none;
	position: absolute;
	right: 4.5px;
	right: 0;
	bottom: 50%;
	transform: translate(0, 25%);
	svg {
		margin: 3.5px 0 0 0 !important;
	}

	&:hover {
		button {
			background: transparent !important;
		}
		svg {
			color: ${(props) => props.theme.colors.warning.primary} !important;
			fill: ${(props) => props.theme.colors.warning.primary} !important;
		}
	}
`;

export const TabAction = styled.div<{ active: boolean }>`
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	font-family: ${(props) => props.theme.typography.family.primary};
	color: ${(props) => (props.active ? props.theme.colors.font.primary : props.theme.colors.font.alt3)};
	cursor: pointer;
	position: relative;
	z-index: 1;
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 12.5px;
	padding: 12.5px 25.5px 10.5px 21.5px;
	margin: 0 0 -1.5px 0;
	background: ${(props) => (props.active ? props.theme.colors.view.background : 'transparent')};
	border-bottom: 1px solid ${(props) => (props.active ? 'transparent' : props.theme.colors.border.primary)};
	border-top: 2px solid ${(props) => (props.active ? props.theme.colors.border.alt5 : 'transparent')};

	white-space: nowrap;
	transition: all 100ms;

	.icon-wrapper {
		position: relative;
		width: 12.5px;
		height: 12.5px;
	}

	.normal-icon,
	.delete-icon {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		transition: all 100ms;
	}

	.normal-icon {
		svg {
			margin: 0 0 2.5px 0;
		}
	}

	.delete-icon {
		display: none;
		margin: 1.5px 0 0 0;
	}

	&:hover .normal-icon {
		display: none;
	}

	&:hover .delete-icon {
		display: block;

		button {
			background: transparent !important;

			&:hover {
				svg {
					color: ${(props) => props.theme.colors.warning.primary} !important;
					fill: ${(props) => props.theme.colors.warning.primary} !important;
				}
			}
		}
	}

	svg {
		height: 12.5px;
		width: 12.5px;
		color: ${(props) => (props.active ? props.theme.colors.font.primary : props.theme.colors.font.alt3)};
		fill: ${(props) => (props.active ? props.theme.colors.font.primary : props.theme.colors.font.alt3)};
	}

	&:hover {
		color: ${(props) => props.theme.colors.font.primary};

		svg {
			color: ${(props) => props.theme.colors.font.primary};
			fill: ${(props) => props.theme.colors.font.primary};
		}
	}

	&:before {
		display: block;
		content: '';
		height: calc(100% + 3px);
		width: 1px;
		position: absolute;
		z-index: 1;
		left: 0;
		transform: translate(-50%, 0);
		top: -2px;
		background: ${(props) => (props.active ? props.theme.colors.border.primary : 'transparent')};
		pointer-events: none;
	}

	&:after {
		display: block;
		content: '';
		height: calc(100% + 3px);
		width: 1px;
		position: absolute;
		z-index: 1;
		right: -1px;
		transform: translate(-50%, 0);
		top: -2px;
		background: ${(props) => (props.active ? props.theme.colors.border.primary : 'transparent')};
		pointer-events: none;
	}
`;

export const TabActiveIndicator = styled.div`
	height: 1px;
	width: calc(100% + 1px);
	position: absolute;
	left: -0.5px;
	z-index: 2;
	top: -2px;
	border-top: 2px solid ${(props) => props.theme.colors.border.alt5};
`;

export const NewTab = styled(TabAction)`
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary} !important;

	svg {
		margin: 0 1.5px -1.5px 0;
	}
`;

export const Placeholder = styled.div`
	height: 1px;
	flex: 1;
	margin: auto 0 -1.5px 0;
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
`;

export const PlaceholderFull = styled(Placeholder)`
	margin: auto -26.5px 0 -26.5px;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		margin: auto -14.5px 0 -14.5px;

		&[id='placeholder-start'] {
			margin: auto -15.5px 0 0;
		}

		&[id='placeholder-end'] {
			margin: auto 0 0 -15.5px;
		}
	}
`;

export const PlaygroundWrapper = styled.div<{ active: boolean }>`
	display: block;
	visibility: ${(props) => (props.active ? 'visible' : 'hidden')};
	height: ${(props) => (props.active ? 'auto' : '0')};
	overflow: ${(props) => (props.active ? 'visible' : 'hidden')};
	position: ${(props) => (props.active ? 'relative' : 'absolute')};
	pointer-events: ${(props) => (props.active ? 'auto' : 'none')};
`;

export const ModalWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 0 20px 20px 20px !important;
`;

export const ModalBodyWrapper = styled.div`
	p {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		font-family: ${(props) => props.theme.typography.family.primary} !important;
	}
`;

export const ModalBodyElements = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.5px;
	margin: 15px 0 0 0;
`;

export const ModalBodyElement = styled.div`
	span {
		color: ${(props) => props.theme.colors.font.primary};
		font-size: ${(props) => props.theme.typography.size.xSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		font-family: ${(props) => props.theme.typography.family.primary} !important;
		text-transform: uppercase;
	}
`;

export const ModalActionsWrapper = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	flex-wrap: wrap;
	gap: 15px;
`;
