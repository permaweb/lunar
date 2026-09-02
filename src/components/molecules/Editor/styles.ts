import styled from 'styled-components';

import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div`
	height: 100%;
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px7_5};
`;

export const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: ${CSS_DIMENSIONS.px15};
	padding: ${CSS_DIMENSIONS.px15} ${CSS_DIMENSIONS.px15} ${CSS_DIMENSIONS.px12_5} ${CSS_DIMENSIONS.px15};
	p {
		color: ${(props) => props.theme.colors.font.primary};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		font-size: ${(props) => props.theme.typography.size.lg};
	}
`;

export const EditorWrapper = styled.div<{ useFixedHeight: boolean }>`
	min-height: ${CSS_DIMENSIONS.px125};
	max-height: ${(props) => (props.useFixedHeight ? '100%' : `calc(100vh - ${CSS_DIMENSIONS.px190})`)};
	width: 100%;
	min-width: 0;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	position: relative;
`;

export const Editor = styled.div<{ $hasHeader?: boolean }>`
	height: 100%;
	width: 100%;
	min-width: 0;
	flex: 1;
	position: relative;
	padding: ${(props) =>
		props.$hasHeader ? `0 0 ${CSS_DIMENSIONS.px15} 0` : `${CSS_DIMENSIONS.px18_5} 0 ${CSS_DIMENSIONS.px15} 0`};
	background: ${(props) => props.theme.colors.container.alt1.background};

	> div {
		height: 100% !important;
		background: ${(props) => props.theme.colors.container.alt1.background} !important;
	}

	> * {
		font-family: ${(props) => props.theme.typography.family.alt2} !important;
	}
`;

export const ActionsWrapper = styled.div`
	width: fit-content;
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px20};
	position: absolute;
	bottom: ${CSS_DIMENSIONS.px20};
	right: ${CSS_DIMENSIONS.px32_5};
	z-index: 1;
	pointer-events: none;

	button {
		padding: ${CSS_DIMENSIONS.px3_5} 0 0 0 !important;
		pointer-events: auto;
	}
`;

export const SubmitWrapper = styled.div`
	button {
		padding: 0 ${CSS_DIMENSIONS.px17_5} !important;
		pointer-events: auto;
	}
`;

export const ErrorWrapper = styled.div`
	span {
		color: ${(props) => props.theme.colors.warning.primary};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		font-size: ${(props) => props.theme.typography.size.xxSmall};
	}
`;
