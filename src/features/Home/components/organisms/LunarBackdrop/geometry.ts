export type LunarPalette = {
	background: string;
	light: string;
	accent: string;
};

function seededRandom(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
		return state / 4294967296;
	};
}

// Seeded, irregular positions keep the field calm across remounts without a visible dot grid.
export function createStarField(count: number): {
	positions: Float32Array;
	brightness: Float32Array;
	sizes: Float32Array;
	phases: Float32Array;
	glints: Float32Array;
} {
	const positions = new Float32Array(count * 3);
	const brightness = new Float32Array(count);
	const sizes = new Float32Array(count);
	const phases = new Float32Array(count);
	const glints = new Float32Array(count);
	const random = seededRandom(19690720);
	for (let i = 0; i < count; i++) {
		positions.set([random() * 2 - 1, random() * 2 - 1, 0], i * 3);
		brightness[i] = 0.22 + random() * 0.38;
		glints[i] = random() > 0.975 ? 1 : 0;
		sizes[i] = glints[i] ? 7 : 2.4 + random() * 2.2;
		phases[i] = random() * Math.PI * 2;
	}
	return { positions, brightness, sizes, phases, glints };
}

export function createDriftingShapes(count: number): {
	positions: Float32Array;
	sizes: Float32Array;
	phases: Float32Array;
	speeds: Float32Array;
	kinds: Float32Array;
} {
	const positions = new Float32Array(count * 3);
	const sizes = new Float32Array(count);
	const phases = new Float32Array(count);
	const speeds = new Float32Array(count);
	const kinds = new Float32Array(count);
	const random = seededRandom(19721207);
	for (let i = 0; i < count; i++) {
		positions.set([random() * 2 - 1, random() * 1.7 - 0.85, 0.1], i * 3);
		sizes[i] = 12 + random() * 8;
		phases[i] = random() * Math.PI * 2;
		speeds[i] = 0.018 + random() * 0.025;
		kinds[i] = Math.floor(random() * 8);
	}
	return { positions, sizes, phases, speeds, kinds };
}
