import styled from 'styled-components';

import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Container = styled.div`
	scroll-margin-top: ${CSS_DIMENSIONS.px80};
`;

export const Header = styled.div`
	padding: ${CSS_DIMENSIONS.px15};
	margin: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: ${CSS_DIMENSIONS.px40};
	border-top: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-right: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-left: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-top-right-radius: ${STYLING.dimensions.radius.alt1};
	border-top-left-radius: ${STYLING.dimensions.radius.alt1};

	@media (max-width: ${STYLING.cutoffs.tablet}) {
		align-items: flex-start;
		flex-direction: column;
		gap: ${CSS_DIMENSIONS.px15};
	}
`;

export const HeaderMain = styled.div`
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px20};

	p {
		font-size: ${(props) => props.theme.typography.size.lg};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}

	.loader {
		> div {
			height: fit-content;
			width: fit-content;
		}
	}
`;

export const HeaderActions = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: ${CSS_DIMENSIONS.px12_5};
`;

export const Divider = styled.div`
	height: ${CSS_DIMENSIONS.px20};
	width: ${CSS_DIMENSIONS.px1};
	border-right: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		display: none;
	}
`;

export const Wrapper = styled.div`
	width: 100%;
	overflow: auto;
	background: ${(props) => props.theme.colors.container.primary.background};
`;

export const HeaderWrapper = styled.div`
	height: ${CSS_DIMENSIONS.px40};
	min-width: 100%;
	width: fit-content;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: ${CSS_DIMENSIONS.px15};
	padding: 0 ${CSS_DIMENSIONS.px15};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	background: ${(props) => props.theme.colors.container.alt1.background};

	div,
	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const BodyWrapper = styled.div`
	width: 100%;

	> *:last-child {
		border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary} !important;
	}

	.block-list-element {
		border-left: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
		border-right: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
		border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	}
`;

export const ElementWrapper = styled.div`
	height: ${CSS_DIMENSIONS.px40};
	min-width: 100%;
	width: fit-content;
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: ${CSS_DIMENSIONS.px15};
	padding: 0 ${CSS_DIMENSIONS.px15};
	cursor: pointer;
	transition: all 75ms;
	background: ${(props) => props.theme.colors.container.primary.background};

	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	&:hover {
		background: ${(props) => props.theme.colors.container.primary.active};
		border-left: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.alt4} !important;
		border-right: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.alt4} !important;
		border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.alt4} !important;
	}

	&:hover::after {
		content: '';
		position: absolute;
		height: ${CSS_DIMENSIONS.px1};
		width: calc(100% + ${CSS_DIMENSIONS.px2});
		top: -${CSS_DIMENSIONS.px1};
		left: -${CSS_DIMENSIONS.px1};
		right: 0;
		bottom: 0;
		border-top: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.alt4};
		transition: all 100ms;
	}
`;

export const ElementItem = styled.div`
	display: flex;
	align-items: center;
`;

export const Height = styled(ElementItem)`
	min-width: ${CSS_DIMENSIONS.px120};
	width: ${CSS_DIMENSIONS.px120};
`;

export const ID = styled(ElementItem)`
	min-width: ${CSS_DIMENSIONS.px250};
	width: ${CSS_DIMENSIONS.px250};
`;

export const Previous = styled(ElementItem)`
	min-width: ${CSS_DIMENSIONS.px250};
	width: ${CSS_DIMENSIONS.px250};
`;

export const Size = styled(ElementItem)`
	min-width: ${CSS_DIMENSIONS.px115};
	width: ${CSS_DIMENSIONS.px115};
	justify-content: flex-end;

	p {
		text-align: right;
	}
`;

export const Miner = styled(ElementItem)`
	min-width: ${CSS_DIMENSIONS.px165};
	width: ${CSS_DIMENSIONS.px165};
`;

export const Bundles = styled(ElementItem)`
	min-width: ${CSS_DIMENSIONS.px95};
	width: ${CSS_DIMENSIONS.px95};
	justify-content: flex-end;

	p {
		text-align: right;
	}
`;

export const Transactions = styled(ElementItem)`
	min-width: ${CSS_DIMENSIONS.px125};
	width: ${CSS_DIMENSIONS.px125};
	justify-content: flex-end;

	p {
		text-align: right;
	}
`;

export const Time = styled(ElementItem)`
	min-width: ${CSS_DIMENSIONS.px185};
	width: ${CSS_DIMENSIONS.px185};
	justify-content: flex-end;

	p {
		text-align: right;
	}
`;

export const FooterWrapper = styled.div`
	width: 100%;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	justify-content: space-between;
	gap: ${CSS_DIMENSIONS.px15};
	padding: ${CSS_DIMENSIONS.px15};
	background: ${(props) => props.theme.colors.container.alt1.background};
	border-left: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-right: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary} !important;
	border-bottom-left-radius: ${STYLING.dimensions.radius.alt1};
	border-bottom-right-radius: ${STYLING.dimensions.radius.alt1};
`;

export const PageCounter = styled.div`
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px7_5};

	p,
	label,
	input {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const DPageCounter = styled(PageCounter)`
	display: flex;

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		display: none;
	}
`;

export const MPageCounter = styled(PageCounter)`
	display: none;

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		display: flex;
	}
`;

export const UpdateWrapper = styled.div`
	padding: 0 ${CSS_DIMENSIONS.px15} ${CSS_DIMENSIONS.px15} ${CSS_DIMENSIONS.px15};
	border-left: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-right: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary} !important;
	background: ${(props) => props.theme.colors.container.primary.background};

	p {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		text-transform: uppercase;
	}
`;
