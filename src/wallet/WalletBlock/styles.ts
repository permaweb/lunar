import styled from 'styled-components';

import { open, transition3 } from 'helpers/animations';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	margin: 40px auto 0 auto;
	padding: 20px;
	animation: ${open} ${transition3};
	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		text-align: center;
	}
	button {
		margin: 25px 0 0 0;
	}
`;

export const Icon = styled.div`
	height: 125px;
	width: 125px;
	display: flex;
	justify-content: center;
	align-items: center;
	background: ${(props) => props.theme.colors.container.alt1.background};
	border: 1px solid ${(props) => props.theme.colors.border.alt1};
	border-radius: 50%;
	margin: 0 0 20px 0;
	svg {
		height: 75px;
		width: 75px;
		color: ${(props) => props.theme.colors.icon.primary.fill};
		fill: ${(props) => props.theme.colors.icon.primary.fill};
		margin: 13.5px 0 0 0;
	}
`;

export const WCWrapper = styled.div`
	height: auto;
`;
