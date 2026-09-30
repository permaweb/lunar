import React from 'react';
import { useTheme } from 'styled-components';

import * as S from './styles';

export default function LunarBackdrop() {
	const theme = useTheme();
	const canvasRef = React.useRef<HTMLCanvasElement>(null);
	const palette = theme.colors.lunar;

	React.useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !window.WebGL2RenderingContext) return;
		let isDisposed = false;
		let disposeScene: (() => void) | undefined;
		// Keep the search immediately usable while the decorative renderer loads separately.
		import('./scene')
			.then(({ mountLunarScene }) => {
				if (!isDisposed) disposeScene = mountLunarScene(canvas, palette, theme.scheme === 'dark');
			})
			.catch((error: unknown) => {
				console.warn('Lunar background unavailable; keeping the page background.', error);
			});
		return () => {
			isDisposed = true;
			disposeScene?.();
		};
	}, [palette, theme.scheme]);

	return (
		<S.Wrapper aria-hidden="true">
			<S.Canvas ref={canvasRef} />
		</S.Wrapper>
	);
}
