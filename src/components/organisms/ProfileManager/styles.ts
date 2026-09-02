import styled from 'styled-components';

import { PrimitiveButton } from 'components/atoms/PrimitiveButton';
import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div``;

export const Header = styled.div`
	display: flex;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: ${CSS_DIMENSIONS.px15};
	h4 {
		color: ${(props) => props.theme.colors.font.primary};
		font-size: clamp(${CSS_DIMENSIONS.px18}, 3.25vw, ${CSS_DIMENSIONS.px24});
		font-weight: ${(props) => props.theme.typography.weight.bold};
		line-height: 1.5;
	}
`;

export const Body = styled.div`
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	gap: ${CSS_DIMENSIONS.px10};
	padding: 0 ${CSS_DIMENSIONS.px20};
`;

export const Form = styled.div`
	height: fit-content;
	width: 100%;
	@media (max-width: calc(${STYLING.cutoffs.initial} + ${CSS_DIMENSIONS.px105})) {
		min-width: 0;
		width: 100%;
		flex: none;
	}
`;

export const TForm = styled.div`
	margin: ${CSS_DIMENSIONS.px40} 0 ${CSS_DIMENSIONS.px30} 0;
	> * {
		&:last-child {
			margin: ${CSS_DIMENSIONS.px20} 0 0 0;
		}
	}
`;

export const PWrapper = styled.div`
	height: fit-content;
	min-width: ${CSS_DIMENSIONS.px500};
	width: calc(50% - ${CSS_DIMENSIONS.px20});
	flex: 1;
	input {
		display: none;
	}
	@media (max-width: ${STYLING.cutoffs.initial}) {
		min-width: 0;
		width: 100%;
		flex: none;
	}
`;

export const CWrapper = styled.div`
	display: flex;
	align-items: center;
	span {
		font-size: ${(props) => props.theme.typography.size.xSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		display: block;
		max-width: 75%;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.c-wrapper-checkbox {
		margin: ${CSS_DIMENSIONS.px4_5} 0 0 ${CSS_DIMENSIONS.px7_5};
	}
`;

export const FileInputWrapper = styled.div`
	width: 100%;
	position: relative;
`;

export const BInput = styled(PrimitiveButton)<{ hasBanner: boolean }>`
	height: ${CSS_DIMENSIONS.px200};
	width: 100%;
	background: ${(props) => props.theme.colors.container.primary.background};
	border: ${(props) =>
		props.hasBanner ? `none` : `${CSS_DIMENSIONS.px1} dashed ${props.theme.colors.border.primary}`};
	border-radius: ${STYLING.dimensions.radius.primary};
	overflow: hidden;
	span {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}
	svg {
		height: ${CSS_DIMENSIONS.px35};
		width: ${CSS_DIMENSIONS.px35};
		margin: 0 0 ${CSS_DIMENSIONS.px10} 0;
		color: ${(props) => props.theme.colors.icon.primary.fill};
		fill: ${(props) => props.theme.colors.icon.primary.fill};
	}
	img {
		height: ${CSS_DIMENSIONS.px200};
		width: 100%;
		object-fit: cover;
	}
	&:hover {
		border: ${CSS_DIMENSIONS.px1} dashed ${(props) => props.theme.colors.border.alt2};
		background: ${(props) => props.theme.colors.container.primary.active};
	}
	&:focus {
		opacity: 1;
	}
	&:disabled {
		background: ${(props) => props.theme.colors.button.primary.disabled.background};
		border: ${CSS_DIMENSIONS.px1} dashed ${(props) => props.theme.colors.button.primary.disabled.border};
		span {
			color: ${(props) => props.theme.colors.button.primary.disabled.color};
		}
		svg {
			fill: ${(props) => props.theme.colors.button.primary.disabled.color};
			color: ${(props) => props.theme.colors.button.primary.disabled.color};
			g {
				.svg-primary-fill {
					fill: ${(props) => props.theme.colors.button.primary.disabled.color};
					color: ${(props) => props.theme.colors.button.primary.disabled.color};
				}
			}
		}
	}
	${(props) =>
		props.hasBanner && !props.disabled
			? `
        pointer-events: all;
        ::after {
            content: "";
            position: absolute;
            height: ${CSS_DIMENSIONS.px200};
            width: 100%;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: ${props.theme.colors.overlay.alt1};
			border-radius: ${STYLING.dimensions.radius.primary};
            opacity: 0;
            transition: all 100ms;
        }
        
        &:hover::after {
            opacity: 1;
        }
        &:focus::after {
            opacity: 1;
        }
        &:hover {
            cursor: pointer;
            border: none;
        }
    `
			: ''}
`;

export const AInput = styled(PrimitiveButton)<{ hasAvatar: boolean }>`
	height: ${CSS_DIMENSIONS.px115};
	width: ${CSS_DIMENSIONS.px115};
	background: ${(props) => props.theme.colors.container.primary.background};
	border: ${(props) =>
		props.hasAvatar ? `none` : `${CSS_DIMENSIONS.px1} dashed ${props.theme.colors.border.primary}`};
	border-radius: 50%;
	position: absolute;
	bottom: -${CSS_DIMENSIONS.px55};
	left: ${CSS_DIMENSIONS.px20};
	z-index: 1;
	overflow: hidden;
	span {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xxxxSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}
	svg {
		height: ${CSS_DIMENSIONS.px25};
		width: ${CSS_DIMENSIONS.px25};
		margin: 0 0 ${CSS_DIMENSIONS.px5} 0;
		color: ${(props) => props.theme.colors.icon.primary.fill};
		fill: ${(props) => props.theme.colors.icon.primary.fill};
	}
	img {
		height: 100%;
		width: 100%;
		border-radius: 50%;
		object-fit: cover;
	}
	&:hover {
		border: ${CSS_DIMENSIONS.px1} dashed ${(props) => props.theme.colors.border.alt2};
		background: ${(props) => props.theme.colors.container.primary.active};
	}
	&:focus {
		opacity: 1;
	}
	&:disabled {
		background: ${(props) => props.theme.colors.button.primary.disabled.background};
		border: ${CSS_DIMENSIONS.px1} dashed ${(props) => props.theme.colors.button.primary.disabled.border};
		span {
			color: ${(props) => props.theme.colors.button.primary.disabled.color};
		}
		svg {
			fill: ${(props) => props.theme.colors.button.primary.disabled.color};
			color: ${(props) => props.theme.colors.button.primary.disabled.color};
		}
	}
	${(props) =>
		props.hasAvatar && !props.disabled
			? `
        pointer-events: all;
        ::after {
            content: "";
            position: absolute;
            height: 100%;
            width: 100%;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: ${props.theme.colors.overlay.alt1};
			border-radius: ${STYLING.dimensions.radius.primary};
            opacity: 0;
            transition: all 100ms;
        }
        &:hover::after {
            opacity: 1;
        }
        &:focus::after {
            opacity: 1;
        }
        &:hover {
            cursor: pointer;
            border: none;
        }
    `
			: ''}
`;

export const PActions = styled.div`
	margin: ${CSS_DIMENSIONS.px20} 0 0 0;
	display: flex;
	justify-content: flex-end;
	flex-wrap: wrap;
	gap: ${CSS_DIMENSIONS.px15};
	@media (max-width: ${STYLING.cutoffs.secondary}) {
		margin: ${CSS_DIMENSIONS.px80} 0 0 0;
	}
`;

export const SAction = styled.div`
	width: 100%;
	display: flex;
	justify-content: flex-end;
	align-items: center;
	flex-wrap: wrap;
	gap: ${CSS_DIMENSIONS.px15};
	position: relative;
`;

export const MWrapper = styled.div`
	padding: 0 ${CSS_DIMENSIONS.px20};
`;

export const MInfo = styled.div`
	margin: 0 0 ${CSS_DIMENSIONS.px20} 0;
	span {
		color: ${(props) => props.theme.colors.font.primary};
		font-size: ${(props) => props.theme.typography.size.small};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		line-height: 1.5;
	}
`;

export const MActions = styled.div`
	margin: ${CSS_DIMENSIONS.px10} 0 0 0;
	display: flex;
	justify-content: flex-end;
	flex-wrap: wrap;
	gap: ${CSS_DIMENSIONS.px15};
`;
