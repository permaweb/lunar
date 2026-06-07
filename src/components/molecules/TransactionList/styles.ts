import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Container = styled.div`
	scroll-margin-top: 80px;
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

export const Wrapper = styled.div`
	width: 100%;
	overflow: auto;
	background: ${(props) => props.theme.colors.container.primary.background};
`;

export const HeaderWrapper = styled.div`
	height: 40px;
	min-width: 100%;
	width: fit-content;
	display: flex;
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

export const BodyWrapper = styled.div`
	width: 100%;

	> *:last-child {
		border-bottom: 1px solid ${(props) => props.theme.colors.border.primary} !important;
	}

	.transaction-list-element {
		border-left: 1px solid ${(props) => props.theme.colors.border.primary};
		border-right: 1px solid ${(props) => props.theme.colors.border.primary};
		border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	}
`;

export const ElementWrapper = styled.div`
	height: 40px;
	min-width: 100%;
	width: fit-content;
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 15px;
	padding: 0 15px;
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
	}
`;

export const ElementItem = styled.div`
	display: flex;
	align-items: center;
`;

export const ID = styled(ElementItem)`
	min-width: 200px;
	width: 200px;
`;

export const Type = styled(ElementItem)`
	min-width: 215px;
	width: 215px;
`;

export const TypeValue = styled(Type)<{ background?: string }>`
	min-width: 215px;
	width: 215px;
	position: relative;

	.type-indicator {
		position: relative;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2.15px 7.5px;
		background: ${(props) => (props.background ? props.background : props.theme.colors.container.alt8.background)};
		border-radius: ${STYLING.dimensions.radius.alt2};

		p {
			font-size: ${(props) => props.theme.typography.size.xSmall};
			font-family: ${(props) => props.theme.typography.family.primary};
			font-weight: ${(props) => props.theme.typography.weight.bold};
			color: ${(props) => props.theme.colors.font.primary};
		}
	}
`;

export const Owner = styled(ElementItem)`
	min-width: 165px;
	width: 165px;
`;

export const Recipient = styled(ElementItem)`
	min-width: 165px;
	width: 165px;
`;

export const Size = styled(ElementItem)`
	min-width: 115px;
	width: 115px;
	justify-content: flex-end;

	p {
		text-align: right;
	}
`;

export const Time = styled(ElementItem)`
	min-width: 185px;
	width: 185px;
	justify-content: flex-end;

	p {
		text-align: right;
	}
`;

export const LinkLabel = styled.div`
	max-width: 100%;

	a,
	button {
		max-width: 100%;
		display: block;
	}

	p {
		color: ${(props) => props.theme.colors.link.color};
	}

	a:hover p,
	button:hover p {
		color: ${(props) => props.theme.colors.link.active};
		text-decoration: underline;
		text-decoration-thickness: 1.25px;
	}

	button {
		text-align: left;
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

export const UpdateWrapper = styled.div`
	padding: 0 15px 15px 15px;
	border-left: 1px solid ${(props) => props.theme.colors.border.primary};
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary} !important;
	background: ${(props) => props.theme.colors.container.primary.background};

	p {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		text-transform: uppercase;
	}
`;
