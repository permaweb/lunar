import styled from 'styled-components';

export const DOWN_PATH = 'M6 9 L12 15 L18 9';
export const UP_PATH = 'M6 15 L12 9 L18 15';

export const Icon = styled.svg<{ $size: number }>`
	display: block;
	flex: 0 0 auto;
	width: ${(props) => props.$size}px;
	height: ${(props) => props.$size}px;
	overflow: visible;
`;

export const Path = styled.path<{ $isOpen: boolean }>`
	d: path('${(props) => (props.$isOpen ? UP_PATH : DOWN_PATH)}');
	fill: none;
	stroke: currentColor;
	stroke-width: 1.5;
	stroke-linecap: round;
	stroke-linejoin: round;
	transition: d 320ms cubic-bezier(0.22, 1, 0.36, 1);

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`;
