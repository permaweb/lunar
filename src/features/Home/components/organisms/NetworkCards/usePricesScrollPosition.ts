import React from 'react';

import { STYLING } from 'helpers/config';

export function usePricesScrollPosition(
	onChange?: (hasScrolledPast: boolean) => void
): React.MutableRefObject<(HTMLSpanElement | null)[]> {
	const priceRefs = React.useRef<(HTMLSpanElement | null)[]>([]);

	React.useLayoutEffect(() => {
		if (!onChange) return;
		const elements = priceRefs.current.filter((element): element is HTMLSpanElement => element !== null);
		if (!elements.length) return;
		const headerHeight = Number.parseFloat(STYLING.dimensions.nav.height);
		let previous: boolean | undefined;
		let frame: number | null = null;

		function measure() {
			frame = null;
			const hasScrolledPast = elements.every((element) => element.getBoundingClientRect().bottom <= headerHeight);
			if (hasScrolledPast !== previous) {
				previous = hasScrolledPast;
				onChange(hasScrolledPast);
			}
		}
		function handleScroll() {
			if (frame === null) frame = requestAnimationFrame(measure);
		}

		// Position checks also handle jumps past rows that start below the viewport.
		window.addEventListener('scroll', handleScroll, { passive: true });
		window.addEventListener('resize', handleScroll);
		const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(handleScroll);
		elements.forEach((element) => resizeObserver?.observe(element));
		measure();

		return () => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('resize', handleScroll);
			resizeObserver?.disconnect();
			if (frame !== null) cancelAnimationFrame(frame);
			onChange(false);
		};
	}, [onChange]);

	return priceRefs;
}
