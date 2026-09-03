import styled from 'styled-components';

export const Icon = styled.div<{ $size: number }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: ${(props) => `${props.$size}px`};
	height: ${(props) => `${props.$size}px`};
	flex: 0 0 auto;

	div,
	svg {
		display: block;
		width: 100%;
		height: 100%;
	}

	svg {
		color: currentColor;
		fill: currentColor;
	}
`;
