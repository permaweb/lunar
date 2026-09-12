import styled from 'styled-components';

import { BlockListStyles } from 'components/molecules/BlockList';
import { STYLING } from 'helpers/config';

export const Container = BlockListStyles.Container;

export const Header = BlockListStyles.Header;

export const HeaderMain = styled.div`
	display: flex;
	align-items: center;
	gap: 20px;

	p {
		display: flex;
		align-items: center;
		gap: 12px;
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

export const HeaderActions = BlockListStyles.HeaderActions;

export const Divider = BlockListStyles.Divider;

export const Wrapper = BlockListStyles.Wrapper;

export const HeaderWrapper = BlockListStyles.HeaderWrapper;

export const BodyWrapper = styled.div<{ $preview?: boolean }>`
	width: 100%;
	overflow: ${(props) => (props.$preview ? 'hidden' : 'visible')};

	> *:last-child {
		border-bottom: 1px solid ${(props) => props.theme.colors.border.primary} !important;
		border-bottom-left-radius: ${(props) => (props.$preview ? STYLING.dimensions.radius.alt1 : '0')};
		border-bottom-right-radius: ${(props) => (props.$preview ? STYLING.dimensions.radius.alt1 : '0')};
	}

	> *:first-child::after {
		top: ${(props) => (props.$preview ? '0' : '-1px')};
	}

	.transaction-list-element {
		border-left: 1px solid ${(props) => props.theme.colors.border.primary};
		border-right: 1px solid ${(props) => props.theme.colors.border.primary};
		border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	}
`;

export const ElementWrapper = styled(BlockListStyles.ElementWrapper)`
	&:focus-visible {
		background: ${(props) => props.theme.colors.container.primary.active};
		border-left: 1px solid ${(props) => props.theme.colors.border.alt4} !important;
		border-right: 1px solid ${(props) => props.theme.colors.border.alt4} !important;
		border-bottom: 1px solid ${(props) => props.theme.colors.border.alt4} !important;
		outline: 1px solid ${(props) => props.theme.colors.border.alt4};
		outline-offset: -1px;
	}
`;

export const ElementItem = BlockListStyles.ElementItem;

export const ID = styled(ElementItem)<{ $preview?: boolean }>`
	min-width: ${(props) => (props.$preview ? '0' : '200px')};
	width: ${(props) => (props.$preview ? 'auto' : '200px')};
`;

export const Type = styled(ElementItem)<{ $preview?: boolean }>`
	min-width: ${(props) => (props.$preview ? '0' : '215px')};
	width: ${(props) => (props.$preview ? 'auto' : '215px')};
	justify-content: flex-start;
`;

export const TypeValue = styled(Type)<{ background?: string; $preview?: boolean }>`
	position: relative;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	gap: 7.5px;

	.type-indicator {
		height: 10px;
		width: 10px;
		border-radius: 50%;
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		background: ${(props) => (props.background ? props.background : props.theme.colors.container.alt8.background)};
		opacity: 0.85;
	}

	p {
		min-width: 0;
		flex: 0 1 auto;
		max-width: 100%;
		color: ${(props) => props.theme.colors.font.primary} !important;
		font-size: ${(props) => props.theme.typography.size.xSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.medium} !important;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
`;

export const Owner = styled(ElementItem)`
	min-width: 165px;
	width: 165px;
	justify-content: flex-start;

	p {
		text-align: left;
	}
`;

export const Recipient = styled(ElementItem)`
	min-width: 165px;
	width: 165px;
	justify-content: flex-start;

	p {
		text-align: left;
	}
`;

export const Size = styled(ElementItem)<{ $preview?: boolean }>`
	min-width: ${(props) => (props.$preview ? '0' : '115px')};
	width: ${(props) => (props.$preview ? 'auto' : '115px')};
	justify-content: ${(props) => (props.$preview ? 'flex-start' : 'flex-end')};

	p {
		text-align: ${(props) => (props.$preview ? 'left' : 'right')};
	}
`;

export const Time = BlockListStyles.Time;

export const LinkLabel = styled.div`
	max-width: 100%;

	a,
	button {
		max-width: 100%;
		display: inline-flex;
		align-items: center;
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

export const LabeledAddress = styled.div`
	display: flex;
	align-items: center;
	gap: 12.5px;
	min-width: 0;
`;

export const AddressLabel = styled.small`
	width: fit-content;
	padding: 1px 5px;
	border-radius: ${STYLING.dimensions.radius.alt2};
	background: ${(props) => props.theme.colors.container.alt8.background};
	color: ${(props) => props.theme.colors.font.light1};
	font-size: ${(props) => props.theme.typography.size.xxxxSmall};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	white-space: nowrap;
`;

export const FooterWrapper = BlockListStyles.FooterWrapper;

export const PageCounter = BlockListStyles.PageCounter;

export const DPageCounter = BlockListStyles.DPageCounter;

export const MPageCounter = BlockListStyles.MPageCounter;

export const UpdateWrapper = BlockListStyles.UpdateWrapper;

export const Count = styled.span`
	font-size: ${(props) => props.theme.typography.size.small};
	color: ${(props) => props.theme.colors.font.alt1};
`;
