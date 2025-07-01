import styled from 'styled-components';

import { STYLING } from 'helpers/config';

// Main layout and structural styles
export const Wrapper = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
`;

export const LayoutWrapper = styled.div`
	width: 100%;
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 25px;
	position: relative;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		grid-template-columns: repeat(1, 1fr);
	}
`;

export const SectionMain = styled.div`
	width: 100%;
	min-height: 500px;
	display: flex;
	flex-direction: row;
	gap: 20px;
	margin-bottom: 20px;
	padding: 20px;
`;

export const Section = styled.div<{ className?: string }>`
	display: flex;
	flex-direction: column;
	flex: 1;

	&.Small {
		flex: 0 0 320px;
	}
	&.Full {
		flex: 1 1 100%;
	}
	&.Fill {
		flex: 1;
	}
`;

export const Header = styled.div<{ className?: string }>`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: ${(props) => props.theme.typography.size.small};
	font-weight: 600;
	color: ${(props) => props.theme.colors.font.primary};
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	padding: 10px 0px;
	background: ${(props) => props.theme.colors.container.alt1.background};
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};
	border-left: 1px solid ${(props) => props.theme.colors.border.primary};
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.primary} ${STYLING.dimensions.radius.primary} 0px 0px;

	&.Split {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: 10px 10px;
	}

	.Device {
		text-transform: uppercase;
		color: ${(props) => props.theme.colors.link.color} !important;
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}
`;

export const Menu = styled.div`
	display: flex;
	flex-direction: column;
	min-height: 500px;
`;

export const HeaderWrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 20px;
`;

export const Content = styled.div`
	display: flex;
	padding: 16px;
	flex-direction: column;
	a {
		color: ${(props) => props.theme.colors.font.primary};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-size: ${(props) => props.theme.typography.size.small};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		padding: 15px;
		&:hover {
			color: ${(props) => props.theme.colors.font.primary};
			background: ${(props) => props.theme.colors.container.primary.active};
		}
	}
`;

export const LayoutContent = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	border-left: 1px solid ${(props) => props.theme.colors.border.primary};
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: 0px 0px ${STYLING.dimensions.radius.primary} ${STYLING.dimensions.radius.primary};
`;
