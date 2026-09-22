import styled, { DefaultTheme } from 'styled-components';

function getBackground(theme: DefaultTheme, status: 'pending' | 'success' | 'failure') {
	switch (status) {
		case 'pending':
			return theme.colors.warning.caution;
		case 'success':
			return theme.colors.indicator.active;
		default:
			return theme.colors.warning.primary;
	}
}

// Whole-pixel sizes keep the icon exactly centered: an 18px circle with a 1px border leaves 16px for a 10px icon.
export const Wrapper = styled.div<{ $status: 'pending' | 'success' | 'failure' }>`
	height: 18px;
	width: 18px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: ${(props) => getBackground(props.theme, props.$status)};
	border: 1px solid ${(props) => props.theme.colors.border.primary};

	/* ReactSVG wraps the icon in block divs that would otherwise place it on the inherited text baseline. */
	div {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	svg {
		display: block;
		height: 10px;
		width: 10px;
		color: ${(props) => props.theme.colors.font.light1};
		fill: ${(props) => props.theme.colors.font.light1};
	}
`;
