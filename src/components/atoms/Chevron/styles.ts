import styled from 'styled-components';

export const DOWN_PATH = 'M6 9 L12 15 L18 9';
export const UP_PATH = 'M6 15 L12 9 L18 15';
export const RIGHT_PATH = 'M9 6 L15 12 L9 18';

export function getPath(isOpen: boolean, variant?: 'disclosure'): string {
	return variant === 'disclosure' ? RIGHT_PATH : isOpen ? UP_PATH : DOWN_PATH;
}

export const Icon = styled.svg<{ $size: number; $isOpen: boolean; $variant?: 'disclosure' }>`
	display: block;
	flex: 0 0 auto;
	width: ${(props) => props.$size}px;
	height: ${(props) => props.$size}px;
	overflow: visible;

	${(props) =>
		props.$variant === 'disclosure' &&
		`
			transform: rotate(${props.$isOpen ? 90 : 0}deg);
			transform-origin: center;
			transition: transform 180ms ease;
		`}

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`;

export const Path = styled.path<{ $isOpen: boolean; $variant?: 'disclosure' }>`
	d: path('${(props) => getPath(props.$isOpen, props.$variant)}');
	fill: none;
	stroke: currentColor;
	stroke-width: 2;
	stroke-linecap: round;
	stroke-linejoin: round;
	transition: ${(props) => (props.$variant === 'disclosure' ? 'none' : 'd 320ms cubic-bezier(0.22, 1, 0.36, 1)')};

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`;
