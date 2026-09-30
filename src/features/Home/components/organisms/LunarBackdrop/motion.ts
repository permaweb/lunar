export function observeLunarScene(
	canvas: HTMLCanvasElement,
	scene: { resize: (width: number, height: number) => void; render: (elapsed: number) => void }
) {
	const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
	let frame: number | null = null;
	let elapsed = 0;
	let previousTime = 0;
	let isVisible = true;
	let hasContext = true;
	let isDisposed = false;
	const canRender = () => !isDisposed && isVisible && !document.hidden && hasContext;

	function stop() {
		if (frame !== null) cancelAnimationFrame(frame);
		frame = null;
		previousTime = 0;
	}
	function animate(time: number) {
		frame = null;
		if (!canRender() || motion.matches) return;
		if (!previousTime || time - previousTime >= 1000 / 30) {
			elapsed += previousTime ? Math.min((time - previousTime) / 1000, 0.1) : 0;
			previousTime = time;
			scene.render(elapsed);
		}
		frame = requestAnimationFrame(animate);
	}
	function synchronize() {
		stop();
		if (!canRender()) return;
		scene.render(elapsed);
		if (!motion.matches) frame = requestAnimationFrame(animate);
	}
	function resize() {
		const { width, height } = canvas.getBoundingClientRect();
		if (width <= 0 || height <= 0) return;
		scene.resize(width, height);
		synchronize();
	}
	function handleContextLost(event: Event) {
		event.preventDefault();
		hasContext = false;
		stop();
	}
	function handleContextRestored() {
		hasContext = true;
		resize();
	}
	const resizeObserver = new ResizeObserver(resize);
	resizeObserver.observe(canvas);
	const intersectionObserver = new IntersectionObserver(([entry]) => {
		isVisible = entry.isIntersecting;
		synchronize();
	});
	intersectionObserver.observe(canvas);
	motion.addEventListener('change', synchronize);
	document.addEventListener('visibilitychange', synchronize);
	canvas.addEventListener('webglcontextlost', handleContextLost);
	canvas.addEventListener('webglcontextrestored', handleContextRestored);
	resize();

	return () => {
		isDisposed = true;
		stop();
		resizeObserver.disconnect();
		intersectionObserver.disconnect();
		motion.removeEventListener('change', synchronize);
		document.removeEventListener('visibilitychange', synchronize);
		canvas.removeEventListener('webglcontextlost', handleContextLost);
		canvas.removeEventListener('webglcontextrestored', handleContextRestored);
	};
}
