import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	height: calc(100vh - (${STYLING.dimensions.nav.height} * 2));
	width: ${STYLING.dimensions.nav.width};
	position: sticky;
	top: ${STYLING.dimensions.nav.height};
	left: 0;
	z-index: 4;
	overflow-y: auto;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		min-height: 0;
		height: auto;
		width: calc(100% - 0px);
		top: 15px;
		left: 50%;
		transform: translate(-50%, 0);
		position: absolute;
		z-index: 0;
		background: transparent;
		border-right: none;
		box-shadow: none;
	}
`;

export const NWrapper = styled.div`
	height: fit-content;
	width: 100%;
	overflow-y: auto;
`;

export const NContent = styled.div`
	height: 100%;
	width: 100%;
	z-index: 1;
	padding: 25px 25px 25px 0;
	@media (max-width: ${STYLING.cutoffs.initial}) {
		position: relative;
		top: auto;
		padding: 0 15px;
		max-height: none;
		background: ${(props) => props.theme.colors.container.alt1.background};
		border: 1px solid ${(props) => props.theme.colors.border.primary};
		border-radius: ${STYLING.dimensions.radius.primary};
	}
`;

export const NTitle = styled.div`
	width: 100%;
	display: flex;
	justify-content: flex-start;
	align-items: center;
	margin: 0 0 20px 0;
	display: none;
	p {
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-size: 22px !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		color: ${(props) => props.theme.colors.font.primary} !important;
	}
`;

export const NTitleMobile = styled.button<{ open: boolean }>`
	height: 50px;
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;
	&:hover {
		cursor: pointer;
	}

	&:focus {
		outline: 0;
	}
	@media (max-width: ${STYLING.cutoffs.initial}) {
		height: 40px;
	}
	p {
		font-family: ${(props) => props.theme.typography.family.primary};
		font-size: ${(props) => props.theme.typography.size.small} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		color: ${(props) => props.theme.colors.font.primary} !important;
	}
	svg {
		height: 12.5px;
		width: 12.5px;
		margin: 3.5px 0 0 0;
		transform: rotate(${(props) => (props.open ? '180deg' : '0deg')});
		fill: ${(props) => props.theme.colors.font.primary};
		color: ${(props) => props.theme.colors.font.primary};
	}
`;

export const NList = styled.ul`
	width: 100%;
	overflow: auto;
	display: flex;
	flex-direction: column;
	gap: 4.5px;
	a {
		width: fit-content;
		text-decoration: none;
		display: block;
		width: 100%;
		&:hover {
			color: ${(props) => props.theme.colors.font.alt1} !important;
		}
	}
`;

export const NSubList = styled.div`
	border-left: 1px solid ${(props) => props.theme.colors.border.primary};
`;

export const NListItem = styled.li<{ disabled: boolean; active: boolean }>`
	width: 100%;
	pointer-events: ${(props) => (props.disabled ? 'none' : 'default')};
	text-align: center;
	display: flex;
	align-items: center;
	cursor: pointer;
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	color: ${(props) => (props.active ? props.theme.colors.font.primary : props.theme.colors.font.alt1)};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	margin: 0 0 12px 0;
	padding: 0 0 0 10px;
	line-height: 1.75;
	text-align: left;
	border-left: 2px solid ${(props) => (props.active ? props.theme.colors.border.alt5 : 'transparent')};
	transition: all 100ms;

	&:hover {
		color: ${(props) => props.theme.colors.font.primary};
		border-left: 2px solid ${(props) => props.theme.colors.border.alt5};
	}
`;

export const NGroup = styled.div`
	@media (max-width: ${STYLING.cutoffs.initial}) {
		margin: 0 0 12.5px 0;
	}
`;

export const NSubHeader = styled(NTitle)`
	height: auto;
	justify-content: flex-start;
	font-size: ${(props) => props.theme.typography.size.small};
	border-top-left-radius: 0;
	border-top-right-radius: 0;
	margin: 0 0 10px 0;
	display: block;
	p {
		font-family: ${(props) => props.theme.typography.family.primary};
		font-size: ${(props) => props.theme.typography.size.xxSmall} !important;
		color: ${(props) => props.theme.colors.font.alt2} !important;
		letter-spacing: 0.85px;
	}
`;
