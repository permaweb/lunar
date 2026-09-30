import * as THREE from 'three';

import type { LunarPalette } from './geometry';
import { createDriftingShapes, createStarField } from './geometry';
import { observeLunarScene } from './motion';

// Distances use the hero's height so the ripples stay circular at every viewport width.
const RIPPLE_SHADER = `
	uniform float elapsed;
	uniform float aspect;
	uniform float strength;
	float ripple(vec2 uv, vec2 origin, float phase, float width) {
		float radius = phase * 3.2;
		float distance = length((uv - origin) * vec2(aspect, 1.0));
		float offset = (distance - radius) / width;
		float envelope = smoothstep(0.0, 0.12, phase) * (1.0 - smoothstep(0.65, 1.0, phase));
		return exp(-offset * offset) * envelope;
	}
	float scan(vec2 uv, float width) {
		// Launch each illumination wave at the center and let it travel out through the particles.
		// Start with a visible ring, including when reduced motion freezes the first frame.
		return ripple(uv, vec2(0.5, 0.5), fract(elapsed * 0.065 + 0.1), width)
			+ ripple(uv, vec2(0.5, 0.5), fract(elapsed * 0.065 + 0.6), width);
	}
	float fieldFade(vec2 uv) {
		float vertical = smoothstep(0.0, 0.55, uv.y) * (1.0 - smoothstep(0.78, 1.0, uv.y));
		float horizontal = smoothstep(0.0, 0.04, uv.x) * (1.0 - smoothstep(0.96, 1.0, uv.x));
		return horizontal * vertical * strength;
	}
`;
const STAR_VERTEX = `
	attribute float brightness;
	attribute float size;
	attribute float phase;
	attribute float glint;
	uniform float pixelRatio;
	varying float intensity;
	varying float illumination;
	varying float sparkle;
	${RIPPLE_SHADER}
	void main() {
		vec2 uv = position.xy * 0.5 + 0.5;
		illumination = scan(uv, 0.15);
		float shimmer = 0.9 + sin(elapsed * 0.38 + phase) * 0.1;
		intensity = (brightness * shimmer + illumination * 0.5) * fieldFade(uv);
		sparkle = glint;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		gl_PointSize = (size + illumination * 1.2) * pixelRatio;
	}
`;
const STAR_FRAGMENT = `
	uniform vec3 accent;
	uniform vec3 light;
	varying float intensity;
	varying float illumination;
	varying float sparkle;
	void main() {
		vec2 point = gl_PointCoord - vec2(0.5);
		float core = exp(-dot(point, point) * 32.0);
		float rays = exp(-abs(point.x) * 65.0 - abs(point.y) * 10.0)
			+ exp(-abs(point.y) * 65.0 - abs(point.x) * 10.0);
		float alpha = max(core, rays * sparkle * 0.5) * intensity;
		if (alpha < 0.01) discard;
		vec3 color = mix(accent, light, min(0.8, 0.2 + illumination * 0.45 + sparkle * 0.3));
		gl_FragColor = vec4(color, alpha);
		#include <colorspace_fragment>
	}
`;
const RIPPLE_VERTEX = `
	varying vec2 fieldUv;
	void main() {
		fieldUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;
const RIPPLE_FRAGMENT = `
	uniform vec3 accent;
	uniform vec3 light;
	uniform vec3 background;
	uniform float hazeStrength;
	varying vec2 fieldUv;
	${RIPPLE_SHADER}
	void main() {
		float rings = scan(fieldUv, 0.008) * 0.075 + scan(fieldUv, 0.07) * 0.018;
		vec2 offset = (fieldUv - vec2(0.5, 0.55)) * vec2(0.8, 2.0);
		float haze = exp(-dot(offset, offset) * 2.0) * hazeStrength;
		float fade = fieldFade(fieldUv);
		float blend = (haze + rings) * fade;
		gl_FragColor = vec4(background, 1.0);
		#include <colorspace_fragment>
		vec3 tint = linearToOutputTexel(vec4(accent, 1.0)).rgb;
		vec3 ringTint = linearToOutputTexel(vec4(light, 1.0)).rgb;
		// Keep the rings legible independently of the low-contrast background haze.
		gl_FragColor.rgb = mix(gl_FragColor.rgb, tint, haze * fade);
		gl_FragColor.rgb = mix(gl_FragColor.rgb, ringTint, rings * fade);
		// Dither the final opaque color, rather than quantizing several low-alpha layers.
		// Keep this grain static and below one display level so it does not shimmer.
		float grain = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) - 0.5;
		gl_FragColor.rgb += grain / 255.0 * smoothstep(0.0, 0.006, blend);
	}
`;

const SHAPE_VERTEX = `
	attribute float size;
	attribute float phase;
	attribute float speed;
	attribute float kind;
	uniform float pixelRatio;
	varying float shapeKind;
	varying float rotation;
	varying float intensity;
	${RIPPLE_SHADER}
	void main() {
		vec2 uv = position.xy * 0.5 + 0.5;
		// Wrap beyond the faded edges, with a little vertical drift rather than rigid lanes.
		uv.x = mod(uv.x + 0.12 + elapsed * speed / aspect, 1.24) - 0.12;
		uv.y += sin(elapsed * 0.16 + phase) * 0.085;
		float fade = fieldFade(uv);
		intensity = (0.18 + scan(uv, 0.18) * 0.2) * fade;
		rotation = phase + elapsed * (0.035 + speed) * (mod(kind, 2.0) * 2.0 - 1.0);
		shapeKind = kind;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(uv * 2.0 - 1.0, position.z, 1.0);
		gl_PointSize = size * pixelRatio;
	}
`;
const SHAPE_FRAGMENT = `
	uniform vec3 accent;
	uniform vec3 light;
	varying float shapeKind;
	varying float rotation;
	varying float intensity;
	float segment(vec2 point, vec2 start, vec2 end) {
		vec2 edge = end - start;
		float along = clamp(dot(point - start, edge) / dot(edge, edge), 0.0, 1.0);
		return length(point - start - edge * along);
	}
	float polygon(vec2 point, float sides, float radius) {
		float sector = 6.2831853 / sides;
		float angle = atan(point.y, point.x) + 1.5707963;
		float edgeAngle = floor(0.5 + angle / sector) * sector - angle;
		return abs(cos(edgeAngle) * length(point) - radius);
	}
	float box(vec2 point, vec2 center, float size) {
		vec2 offset = abs(point - center) - size;
		return abs(length(max(offset, 0.0)) + min(max(offset.x, offset.y), 0.0));
	}
	void main() {
		vec2 point = gl_PointCoord - 0.5;
		float c = cos(rotation);
		float s = sin(rotation);
		point = mat2(c, -s, s, c) * point;
		float distance;
		if (shapeKind < 0.5) {
			distance = abs(length(point) - 0.3);
		} else if (shapeKind < 1.5) {
			distance = polygon(point, 3.0, 0.18);
		} else if (shapeKind < 2.5) {
			distance = abs(abs(point.x) + abs(point.y) - 0.34) * 0.7071068;
		} else if (shapeKind < 3.5) {
			distance = polygon(point, 6.0, 0.27);
		} else if (shapeKind < 4.5) {
			distance = min(segment(point, vec2(-0.31, 0.0), vec2(0.31, 0.0)),
				segment(point, vec2(0.0, -0.31), vec2(0.0, 0.31)));
		} else if (shapeKind < 5.5) {
			vec2 quadrant = abs(point);
			distance = min(segment(quadrant, vec2(0.0, 0.36), vec2(0.08, 0.08)),
				segment(quadrant, vec2(0.08, 0.08), vec2(0.36, 0.0)));
		} else if (shapeKind < 6.5) {
			distance = min(box(point, vec2(-0.055, 0.055), 0.21), box(point, vec2(0.055, -0.055), 0.21));
			vec2 corner = sign(point) * 0.21;
			distance = min(distance, segment(point, corner + vec2(-0.055, 0.055), corner + vec2(0.055, -0.055)));
		} else {
			distance = min(segment(point, vec2(-0.26, -0.29), vec2(0.26, 0.29)),
				segment(point, vec2(0.26, -0.29), vec2(-0.26, 0.29)));
			distance = min(distance, segment(abs(point), vec2(0.0, 0.29), vec2(0.26, 0.29)));
		}
		float edge = max(fwidth(distance), 0.012);
		float alpha = (1.0 - smoothstep(0.014, 0.014 + edge, distance)) * intensity;
		if (alpha < 0.005) discard;
		gl_FragColor = vec4(mix(accent, light, 0.6), alpha);
		#include <colorspace_fragment>
	}
`;

export function mountLunarScene(canvas: HTMLCanvasElement, palette: LunarPalette, isDark: boolean): () => void {
	const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
	renderer.setClearColor(palette.background, 1);
	const scene = new THREE.Scene();
	const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
	camera.position.z = 2;
	const uniforms = {
		elapsed: { value: 0 },
		aspect: { value: 1 },
		pixelRatio: { value: 1 },
		strength: { value: 1 },
		hazeStrength: { value: isDark ? 0.04 : 0.14 },
		background: { value: new THREE.Color(palette.background) },
		accent: { value: new THREE.Color(palette.accent) },
		light: { value: new THREE.Color(palette.light) },
	};
	const stars = createStarField(2200);
	const starGeometry = new THREE.BufferGeometry();
	starGeometry.setAttribute('position', new THREE.BufferAttribute(stars.positions, 3));
	starGeometry.setAttribute('brightness', new THREE.BufferAttribute(stars.brightness, 1));
	starGeometry.setAttribute('size', new THREE.BufferAttribute(stars.sizes, 1));
	starGeometry.setAttribute('phase', new THREE.BufferAttribute(stars.phases, 1));
	starGeometry.setAttribute('glint', new THREE.BufferAttribute(stars.glints, 1));
	const starMaterial = new THREE.ShaderMaterial({
		uniforms,
		vertexShader: STAR_VERTEX,
		fragmentShader: STAR_FRAGMENT,
		transparent: true,
		depthWrite: false,
	});
	scene.add(new THREE.Points(starGeometry, starMaterial));
	const shapes = createDriftingShapes(48);
	const shapeGeometry = new THREE.BufferGeometry();
	shapeGeometry.setAttribute('position', new THREE.BufferAttribute(shapes.positions, 3));
	shapeGeometry.setAttribute('size', new THREE.BufferAttribute(shapes.sizes, 1));
	shapeGeometry.setAttribute('phase', new THREE.BufferAttribute(shapes.phases, 1));
	shapeGeometry.setAttribute('speed', new THREE.BufferAttribute(shapes.speeds, 1));
	shapeGeometry.setAttribute('kind', new THREE.BufferAttribute(shapes.kinds, 1));
	const shapeMaterial = new THREE.ShaderMaterial({
		uniforms,
		vertexShader: SHAPE_VERTEX,
		fragmentShader: SHAPE_FRAGMENT,
		transparent: true,
		depthWrite: false,
	});
	scene.add(new THREE.Points(shapeGeometry, shapeMaterial));
	const rippleGeometry = new THREE.PlaneGeometry(2, 2);
	const rippleMaterial = new THREE.ShaderMaterial({
		uniforms,
		vertexShader: RIPPLE_VERTEX,
		fragmentShader: RIPPLE_FRAGMENT,
		depthWrite: false,
	});
	const ripples = new THREE.Mesh(rippleGeometry, rippleMaterial);
	ripples.position.z = -0.1;
	scene.add(ripples);

	const stopObserving = observeLunarScene(canvas, {
		resize(width, height) {
			uniforms.strength.value = isDark ? (width < 600 ? 0.45 : 0.85) : width < 600 ? 0.6 : 0.95;
			starGeometry.setDrawRange(0, width < 600 ? 700 : 2200);
			shapeGeometry.setDrawRange(0, width < 600 ? 12 : 48);
			const ratio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(1800000 / (width * height)));
			renderer.setPixelRatio(ratio);
			renderer.setSize(width, height, false);
			uniforms.pixelRatio.value = ratio;
			uniforms.aspect.value = width / height;
		},
		render(elapsed) {
			uniforms.elapsed.value = elapsed;
			renderer.render(scene, camera);
		},
	});
	return () => {
		stopObserving();
		starGeometry.dispose();
		starMaterial.dispose();
		shapeGeometry.dispose();
		shapeMaterial.dispose();
		rippleGeometry.dispose();
		rippleMaterial.dispose();
		scene.clear();
		renderer.dispose();
	};
}
