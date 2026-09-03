import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Container = styled.div<{ $preview?: boolean }>`
	scroll-margin-top: 80px;
	height: ${(props) => (props.$preview ? '100%' : 'auto')};
	display: flex;
	flex-direction: column;
`;

export const Header = styled.div`
	padding: 15px;
	margin: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 40px;
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};
	border-left: 1px solid ${(props) => props.theme.colors.border.primary};
	border-top-right-radius: ${STYLING.dimensions.radius.alt1};
	border-top-left-radius: ${STYLING.dimensions.radius.alt1};

	@media (max-width: ${STYLING.cutoffs.tablet}) {
		align-items: flex-start;
		flex-direction: column;
		gap: 15px;
	}
`;

export const HeaderMain = styled.div`
	display: flex;
	align-items: center;
	gap: 20px;

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
	gap: 12.5px;
`;

export const Divider = styled.div`
	height: 20px;
	width: 1px;
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		display: none;
	}
`;

export const Wrapper = styled.div<{ $preview?: boolean }>`
	width: 100%;
	flex: ${(props) => (props.$preview ? '1' : 'initial')};
	overflow: auto;
	background: ${(props) => props.theme.colors.container.primary.background};
`;

export const HeaderWrapper = styled.div<{ $preview?: boolean }>`
	height: 40px;
	min-width: 100%;
	width: fit-content;
	display: ${(props) => (props.$preview ? 'grid' : 'flex')};
	grid-template-columns: ${(props) => (props.$preview ? 'repeat(4, minmax(0, 1fr))' : 'none')};
	align-items: center;
	justify-content: space-between;
	gap: 15px;
	padding: 0 15px;
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	background: ${(props) => props.theme.colors.container.alt1.background};

	div,
	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const BodyWrapper = styled.div<{ $preview?: boolean }>`
	width: 100%;
	overflow: ${(props) => (props.$preview ? 'hidden' : 'visible')};

	> *:last-child {
		border-bottom: 1px solid ${(props) => props.theme.colors.border.primary} !important;
		border-bottom-left-radius: ${(props) => (props.$preview ? STYLING.dimensions.radius.alt1 : '0')};
		border-bottom-right-radius: ${(props) => (props.$preview ? STYLING.dimensions.radius.alt1 : '0')};
	}

	> *:first-child:hover {
		box-shadow: inset 0 1px 0 ${(props) => props.theme.colors.border.alt4};
	}

	.block-list-element {
		border-left: 1px solid ${(props) => props.theme.colors.border.primary};
		border-right: 1px solid ${(props) => props.theme.colors.border.primary};
		border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	}
`;

export const ElementWrapper = styled.div<{ $preview?: boolean }>`
	height: 40px;
	min-width: 100%;
	width: fit-content;
	position: relative;
	display: ${(props) => (props.$preview ? 'grid' : 'flex')};
	grid-template-columns: ${(props) => (props.$preview ? 'repeat(4, minmax(0, 1fr))' : 'none')};
	align-items: center;
	justify-content: space-between;
	gap: 15px;
	padding: 0 15px;
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
		border-left: 1px solid ${(props) => props.theme.colors.border.alt4} !important;
		border-right: 1px solid ${(props) => props.theme.colors.border.alt4} !important;
		border-bottom: 1px solid ${(props) => props.theme.colors.border.alt4} !important;
	}

	&:hover::after {
		content: '';
		position: absolute;
		height: 1px;
		width: calc(100% + 2px);
		top: -1px;
		left: -1px;
		right: 0;
		bottom: 0;
		border-top: 1px solid ${(props) => props.theme.colors.border.alt4};
		transition: all 100ms;
	}
`;

export const ElementItem = styled.div`
	display: flex;
	align-items: center;
`;

export const Height = styled(ElementItem)<{ $preview?: boolean }>`
	min-width: ${(props) => (props.$preview ? '0' : '120px')};
	width: ${(props) => (props.$preview ? 'auto' : '120px')};
`;

export const ID = styled(ElementItem)<{ $preview?: boolean }>`
	min-width: ${(props) => (props.$preview ? '0' : '250px')};
	width: ${(props) => (props.$preview ? 'auto' : '250px')};
	justify-content: flex-start;
`;

export const Previous = styled(ElementItem)`
	min-width: 250px;
	width: 250px;
`;

export const Size = styled(ElementItem)`
	min-width: 115px;
	width: 115px;
	justify-content: flex-end;

	p {
		text-align: right;
	}
`;

export const Miner = styled(ElementItem)`
	min-width: 165px;
	width: 165px;
`;

export const Bundles = styled(ElementItem)`
	min-width: 95px;
	width: 95px;
	justify-content: flex-end;

	p {
		text-align: right;
	}
`;

export const Transactions = styled(ElementItem)<{ $preview?: boolean }>`
	min-width: ${(props) => (props.$preview ? '0' : '125px')};
	width: ${(props) => (props.$preview ? 'auto' : '125px')};
	justify-content: ${(props) => (props.$preview ? 'flex-start' : 'flex-end')};

	p {
		text-align: ${(props) => (props.$preview ? 'left' : 'right')};
	}
`;

export const Time = styled(ElementItem)<{ $preview?: boolean }>`
	min-width: ${(props) => (props.$preview ? '0' : '185px')};
	width: ${(props) => (props.$preview ? 'auto' : '185px')};
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
	gap: 15px;
	padding: 15px;
	background: ${(props) => props.theme.colors.container.alt1.background};
	border-left: 1px solid ${(props) => props.theme.colors.border.primary};
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary} !important;
	border-bottom-left-radius: ${STYLING.dimensions.radius.alt1};
	border-bottom-right-radius: ${STYLING.dimensions.radius.alt1};
`;

export const PageCounter = styled.div`
	display: flex;
	align-items: center;
	gap: 7.5px;

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

export const UpdateWrapper = styled.div<{ $preview?: boolean }>`
	height: ${(props) => (props.$preview ? '40px' : 'auto')};
	padding: ${(props) => (props.$preview ? '0 15px' : '0 15px 15px 15px')};
	display: ${(props) => (props.$preview ? 'flex' : 'block')};
	align-items: center;
	border-left: 1px solid ${(props) => props.theme.colors.border.primary};
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary} !important;
	border-bottom-left-radius: ${(props) => (props.$preview ? STYLING.dimensions.radius.alt1 : '0')};
	border-bottom-right-radius: ${(props) => (props.$preview ? STYLING.dimensions.radius.alt1 : '0')};
	background: ${(props) => props.theme.colors.container.primary.background};

	p {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		text-transform: ${(props) => (props.$preview ? 'none' : 'uppercase')};
	}
`;
