import styled from 'styled-components';

import { PrimitiveInput } from 'components/atoms/PrimitiveInput';
import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px25};
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
	margin: ${CSS_DIMENSIONS.px30} 0 0 0;
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
	padding: 0 ${CSS_DIMENSIONS.px1} ${CSS_DIMENSIONS.px1_5} ${CSS_DIMENSIONS.px1};
	overscroll-behavior-x: none;
`;

export const TabDivider = styled.div`
	height: ${CSS_DIMENSIONS.px22_5};
	width: ${CSS_DIMENSIONS.px1};
	margin: ${CSS_DIMENSIONS.px3_5} 0 0 0;
	border-left: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
`;

export const DeleteAction = styled.div`
	display: none;
	position: absolute;
	right: ${CSS_DIMENSIONS.px4_5};
	right: 0;
	bottom: 50%;
	transform: translate(0, 25%);
	svg {
		margin: ${CSS_DIMENSIONS.px3_5} 0 0 0 !important;
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

export const TabAction = styled.div<{ active: boolean; disabled?: boolean }>`
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	font-family: ${(props) => props.theme.typography.family.primary};
	color: ${(props) =>
		props.active && !props.disabled ? props.theme.colors.font.primary : props.theme.colors.font.alt3};
	cursor: pointer;
	position: relative;
	z-index: 1;
	display: flex;
	justify-content: center;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px12_5};
	padding: ${CSS_DIMENSIONS.px12_5} ${CSS_DIMENSIONS.px25_5} ${CSS_DIMENSIONS.px10_5} ${CSS_DIMENSIONS.px21_5};
	margin: 0 0 -${CSS_DIMENSIONS.px1_5} 0;
	background: ${(props) => (props.active ? props.theme.colors.view.background : 'transparent')};
	border-bottom: ${CSS_DIMENSIONS.px1} solid
		${(props) => (props.active ? 'transparent' : props.theme.colors.border.primary)};
	border-top: ${CSS_DIMENSIONS.px2} solid ${(props) => (props.active ? props.theme.colors.border.alt3 : 'transparent')};
	cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};

	white-space: nowrap;
	transition: all 100ms;

	&[draggable='true']:active {
		background: ${(props) => props.theme.colors.container.alt1.background};
		border-top: ${CSS_DIMENSIONS.px2} solid ${(props) => props.theme.colors.border.alt1};
	}

	.icon-wrapper {
		position: relative;
		width: ${CSS_DIMENSIONS.px12_5};
		height: ${CSS_DIMENSIONS.px12_5};
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
			margin: 0 0 ${CSS_DIMENSIONS.px2_5} 0;
		}
	}

	.delete-icon {
		display: none;
		margin: ${CSS_DIMENSIONS.px1_5} 0 0 0;

		button {
			border: none !important;
		}
	}

	&:hover .normal-icon {
		display: ${(props) => (props.disabled ? 'block' : 'none')};
	}

	&:hover .delete-icon {
		display: ${(props) => (props.disabled ? 'none' : 'block')};

		button {
			background: transparent !important;

			&:not(:disabled):hover {
				svg {
					color: ${(props) => props.theme.colors.warning.primary} !important;
					fill: ${(props) => props.theme.colors.warning.primary} !important;
				}
			}

			&:disabled {
				cursor: default;

				svg {
					color: ${(props) => props.theme.colors.button.primary.disabled.color} !important;
					fill: ${(props) => props.theme.colors.button.primary.disabled.color} !important;
				}
			}
		}
	}

	svg {
		height: ${CSS_DIMENSIONS.px12_5};
		width: ${CSS_DIMENSIONS.px12_5};
		color: ${(props) =>
			props.active && !props.disabled ? props.theme.colors.font.primary : props.theme.colors.font.alt3};
		fill: ${(props) =>
			props.active && !props.disabled ? props.theme.colors.font.primary : props.theme.colors.font.alt3};
	}

	&:hover {
		color: ${(props) => (props.disabled ? props.theme.colors.font.alt3 : props.theme.colors.font.primary)};

		svg {
			color: ${(props) => (props.disabled ? props.theme.colors.font.alt3 : props.theme.colors.font.primary)};
			fill: ${(props) => (props.disabled ? props.theme.colors.font.alt3 : props.theme.colors.font.primary)};
		}
	}

	&:before {
		display: block;
		content: '';
		height: calc(100% + ${CSS_DIMENSIONS.px3});
		width: ${CSS_DIMENSIONS.px1};
		position: absolute;
		z-index: 1;
		left: 0;
		transform: translate(-50%, 0);
		top: -${CSS_DIMENSIONS.px2};
		background: ${(props) => (props.active ? props.theme.colors.border.primary : 'transparent')};
		pointer-events: none;
	}

	&:after {
		display: block;
		content: '';
		height: calc(100% + ${CSS_DIMENSIONS.px3});
		width: ${CSS_DIMENSIONS.px1};
		position: absolute;
		z-index: 1;
		right: -${CSS_DIMENSIONS.px1};
		transform: translate(-50%, 0);
		top: -${CSS_DIMENSIONS.px2};
		background: ${(props) => (props.active ? props.theme.colors.border.primary : 'transparent')};
		pointer-events: none;
	}
`;

export const TabTitle = styled.span`
	display: block;
	max-width: ${CSS_DIMENSIONS.px240};
	overflow: hidden;
	text-overflow: ellipsis;
`;

export const TabTitleInput = styled(PrimitiveInput)`
	width: ${CSS_DIMENSIONS.px98};
	max-width: ${CSS_DIMENSIONS.px98};
	min-width: ${CSS_DIMENSIONS.px98};
	padding: 0;
	border: none;
	border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.form.valid.outline};
	color: ${(props) => props.theme.colors.font.primary};
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	outline: none;
`;

export const TabActiveIndicator = styled.div`
	height: ${CSS_DIMENSIONS.px1};
	width: calc(100% + ${CSS_DIMENSIONS.px1});
	position: absolute;
	left: -${CSS_DIMENSIONS.px0_5};
	z-index: 2;
	top: -${CSS_DIMENSIONS.px2};
	border-top: ${CSS_DIMENSIONS.px2} solid ${(props) => props.theme.colors.border.primary};
`;

export const DropIndicator = styled.div<{ side: 'left' | 'right' }>`
	position: absolute;
	top: -${CSS_DIMENSIONS.px2};
	${(props) => (props.side === 'left' ? `left: -${CSS_DIMENSIONS.px2}` : `right: -${CSS_DIMENSIONS.px2}`)};
	height: calc(100% + ${CSS_DIMENSIONS.px3});
	width: ${CSS_DIMENSIONS.px2_5};
	background: ${(props) => props.theme.colors.border.alt4};
	z-index: 3;
	pointer-events: none;
`;

export const NewTab = styled(TabAction)`
	border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary} !important;

	svg {
		margin: 0 ${CSS_DIMENSIONS.px1_5} -${CSS_DIMENSIONS.px1_5} 0;
	}
`;

export const Placeholder = styled.div`
	height: ${CSS_DIMENSIONS.px1};
	flex: 1;
	margin: auto 0 -${CSS_DIMENSIONS.px1_5} 0;
	border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
`;

export const PlaceholderFull = styled(Placeholder)`
	margin: auto -${CSS_DIMENSIONS.px26_5} 0 -${CSS_DIMENSIONS.px26_5};

	@media (max-width: ${STYLING.cutoffs.initial}) {
		margin: auto -${CSS_DIMENSIONS.px14_5} 0 -${CSS_DIMENSIONS.px14_5};

		&[id='placeholder-start'] {
			margin: auto -${CSS_DIMENSIONS.px15_5} 0 0;
		}

		&[id='placeholder-end'] {
			margin: auto 0 0 -${CSS_DIMENSIONS.px15_5};
		}
	}
`;

export const ContentWrapper = styled.div<{ active: boolean }>`
	display: ${(props) => (props.active ? 'block' : 'none')};
	position: relative;
	width: 100%;
	/* Avoid expensive painting on hidden tabs while keeping active tab fully sized */
	contain: layout paint style;
`;

export const ModalWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px20};
	padding: 0 ${CSS_DIMENSIONS.px20} ${CSS_DIMENSIONS.px20} ${CSS_DIMENSIONS.px20} !important;
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
	gap: ${CSS_DIMENSIONS.px1_5};
	margin: ${CSS_DIMENSIONS.px15} 0 0 0;
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
	gap: ${CSS_DIMENSIONS.px15};
`;
