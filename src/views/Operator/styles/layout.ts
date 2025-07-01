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
	gap: 10px;
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
	flex-wrap: wrap;
	gap: 10px;
	margin-bottom: 10px;
	padding: 10px;
`;

export const PipelineMainGrid = styled.div`
	width: 100%;
	display: grid;
	grid-template-columns: 320px 500px 1fr;
	grid-template-areas: 'actions pipeline results';
	gap: 10px;
	margin-bottom: 10px;
	padding: 10px;

	/* Responsive breakpoints */
	@media (max-width: 1400px) {
		grid-template-columns: 320px 1fr;
		grid-template-areas:
			'actions pipeline'
			'results results';
	}

	@media (max-width: 900px) {
		grid-template-columns: 1fr;
		grid-template-areas:
			'actions'
			'pipeline'
			'results';
	}
`;

export const ConfigurationMainGrid = styled.div`
	width: 100%;
	display: grid;
	grid-template-columns: 320px 1fr;
	grid-template-areas: 'devices configure';
	gap: 10px;
	margin-bottom: 10px;
	padding: 10px;

	@media (max-width: 1200px) {
		grid-template-columns: 1fr;
		grid-template-areas:
			'devices'
			'configure';
	}
`;

export const GridSection = styled.div<{ area: string }>`
	display: flex;
	flex-direction: column;
	grid-area: ${(props) => props.area};
	min-width: ${(props) => (props.area === 'devices' || props.area === 'actions' ? '320px' : '0px')};
	min-height: ${(props) => (props.area === 'configure' ? '640px' : '0px')};
`;

export const Section = styled.div<{ className?: string }>`
	display: flex;
	flex-direction: column;
	flex: 1 1 100%;
	&:not(.Small) {
		min-width: 420px;
	}
	&.Small {
		flex: 1 1 320px;
	}
	&.Medium {
		flex: 10 0 500px;
	}
	&.Full {
		flex: 10 1 100%;
	}
	&.Fill {
		flex: 10 1 100%;
		overflow: hidden;
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
	gap: 10px;
`;

export const Content = styled.div`
	display: flex;
	padding: 10px;
	flex-direction: column;
	a {
		color: ${(props) => props.theme.colors.font.primary};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-size: ${(props) => props.theme.typography.size.small};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		padding: 10px;
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
