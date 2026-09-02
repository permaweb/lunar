import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Container = styled.div`
	height: fit-content;
	margin: auto 0 0 0;
	position: relative;
	padding: 0 7.5px;
`;

export const List = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 15px;
`;

export const Content = styled.div`
	height: calc(100% - 25px);
	position: relative;
`;

export const Tab = styled.div``;

export const AltTab = styled.div`
	position: relative;
	display: flex;
	justify-content: center;
`;

export const AltTabAction = styled.button<{ active: boolean; icon: boolean }>`
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	font-family: ${(props) => props.theme.typography.family.primary};
	color: ${(props) => (props.active ? props.theme.colors.font.primary : props.theme.colors.font.alt1)};
	cursor: pointer;

	&:hover {
		color: ${(props) => props.theme.colors.font.primary};
	}

	display: flex;
	justify-content: center;
	align-items: center;

	&:after {
		display: block;
		content: '';
		position: absolute;
		left: 50%;
		transform: translate(-50%, 0);
		bottom: -7.5px;
		background: ${(props) =>
			props.active ? props.theme.colors.tabs.active.background : props.theme.colors.transparent};
		height: 3.5px;
		border-radius: ${STYLING.dimensions.radius.primary};
		width: 100%;
		pointer-events: none;
	}
`;

export const Icon = styled.div<{ active: boolean }>`
	svg {
		height: 23.5px;
		width: 23.5px;
		padding: 3.5px 0 0 0;
		margin: 0 12.5px 0 0;
		color: ${(props) => props.theme.colors.font.primary};
	}
`;
