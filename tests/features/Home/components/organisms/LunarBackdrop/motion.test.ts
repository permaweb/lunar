// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { observeLunarScene } from '../../../../../../src/features/Home/components/organisms/LunarBackdrop/motion';

let canvas: HTMLCanvasElement;
let reducedMotion: boolean;
let isHidden: boolean;
let motionChange: () => void;
let intersectionChange: (entries: { isIntersecting: boolean }[]) => void;
let resize: () => void;
let stop: () => void;
let frameId: number;
const frames = new Map<number, FrameRequestCallback>();
const render = vi.fn();
const resizeScene = vi.fn();
const disconnect = vi.fn();
const removeMotionListener = vi.fn();

beforeEach(() => {
	vi.clearAllMocks();
	reducedMotion = false;
	isHidden = false;
	frameId = 0;
	frames.clear();
	canvas = document.createElement('canvas');
	vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({ width: 1200, height: 420 } as DOMRect);
	vi.spyOn(document, 'hidden', 'get').mockImplementation(() => isHidden);
	vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
		frames.set(++frameId, callback);
		return frameId;
	});
	vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
	vi.stubGlobal('matchMedia', () => ({
		get matches() {
			return reducedMotion;
		},
		addEventListener: (_event: string, callback: () => void) => {
			motionChange = callback;
		},
		removeEventListener: removeMotionListener,
	}));
	vi.stubGlobal(
		'ResizeObserver',
		class {
			constructor(callback: () => void) {
				resize = callback;
			}
			observe() {}
			disconnect = disconnect;
		}
	);
	vi.stubGlobal(
		'IntersectionObserver',
		class {
			constructor(callback: typeof intersectionChange) {
				intersectionChange = callback;
			}
			observe() {}
			disconnect = disconnect;
		}
	);
});
afterEach(() => {
	stop?.();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});
function advance(time: number) {
	const callbacks = [...frames.values()];
	frames.clear();
	callbacks.forEach((callback) => callback(time));
}
it('renders once for reduced motion, including resize, without scheduling an animation loop', () => {
	reducedMotion = true;
	stop = observeLunarScene(canvas, { render, resize: resizeScene });
	expect(render).toHaveBeenCalledOnce();
	expect(frames.size).toBe(0);
	resize();
	expect(resizeScene).toHaveBeenLastCalledWith(1200, 420);
	expect(frames.size).toBe(0);
	reducedMotion = false;
	motionChange();
	expect(frames.size).toBe(1);
});
it('pauses offscreen and in hidden tabs, then resumes without jumping ahead', () => {
	stop = observeLunarScene(canvas, { render, resize: resizeScene });
	advance(100);
	advance(140);
	const elapsed = render.mock.lastCall[0];
	intersectionChange([{ isIntersecting: false }]);
	expect(frames.size).toBe(0);
	intersectionChange([{ isIntersecting: true }]);
	advance(30000);
	expect(render.mock.lastCall[0]).toBe(elapsed);
	isHidden = true;
	document.dispatchEvent(new Event('visibilitychange'));
	expect(frames.size).toBe(0);
	isHidden = false;
	document.dispatchEvent(new Event('visibilitychange'));
	expect(frames.size).toBe(1);
});
it('stops on context loss and releases observers, listeners, and scheduled frames on disposal', () => {
	stop = observeLunarScene(canvas, { render, resize: resizeScene });
	canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
	expect(frames.size).toBe(0);
	canvas.dispatchEvent(new Event('webglcontextrestored'));
	expect(frames.size).toBe(1);
	stop();
	expect(frames.size).toBe(0);
	expect(disconnect).toHaveBeenCalledTimes(2);
	expect(removeMotionListener).toHaveBeenCalledOnce();
	render.mockClear();
	document.dispatchEvent(new Event('visibilitychange'));
	canvas.dispatchEvent(new Event('webglcontextrestored'));
	expect(render).not.toHaveBeenCalled();
	stop = undefined;
});
