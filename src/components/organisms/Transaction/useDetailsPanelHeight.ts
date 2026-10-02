import React from 'react';

// Keep the panel visible even when the grid's bottom enters the viewport.
export default function useDetailsPanelHeight(active: boolean, stickyTop: number) {
	const [panel, setPanel] = React.useState<HTMLElement | null>(null);

	React.useLayoutEffect(() => {
		const container = panel?.parentElement;
		if (!active || !panel || !container) return;
		let frame: number | null = null;

		const updateHeight = () => {
			if (!panel.getClientRects().length) return;
			const style = getComputedStyle(panel);
			if (style.position !== 'sticky') {
				panel.style.removeProperty('--details-panel-available-height');
				return;
			}

			const bounds = container.getBoundingClientRect();
			const fullscreenContainer = document.fullscreenElement;
			const scrollPadding = fullscreenContainer?.contains(panel)
				? parseFloat(getComputedStyle(fullscreenContainer).paddingTop) || 0
				: 0;
			const top = Math.max(bounds.top, (parseFloat(style.top) || 0) + scrollPadding);
			const bottom = Math.min(window.innerHeight - 25, bounds.bottom);
			panel.style.setProperty('--details-panel-available-height', `${Math.max(0, bottom - top)}px`);
		};
		const handleLayoutChange = () => {
			if (frame !== null) return;
			frame = requestAnimationFrame(() => {
				frame = null;
				updateHeight();
			});
		};

		updateHeight();
		const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(handleLayoutChange);
		observer?.observe(container);
		observer?.observe(panel);
		window.addEventListener('resize', handleLayoutChange);
		window.addEventListener('scroll', handleLayoutChange, { capture: true, passive: true });
		document.addEventListener('fullscreenchange', handleLayoutChange);
		return () => {
			observer?.disconnect();
			if (frame !== null) cancelAnimationFrame(frame);
			window.removeEventListener('resize', handleLayoutChange);
			window.removeEventListener('scroll', handleLayoutChange, true);
			document.removeEventListener('fullscreenchange', handleLayoutChange);
			panel.style.removeProperty('--details-panel-available-height');
		};
	}, [panel, active, stickyTop]);

	return setPanel;
}
