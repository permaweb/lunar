import { describe, expect, it } from 'vitest';

import {
	darkTheme,
	darkThemeAlt1,
	darkThemeAlt2,
	darkThemeAlt3,
	lightTheme,
	lightThemeAlt1,
	lightThemeAlt2,
	lightThemeAlt3,
	theme,
} from '../../src/helpers/themes';

const palettes = [
	['Light Default', lightTheme],
	['Sunlit', lightThemeAlt1],
	['Daybreak', lightThemeAlt2],
	['Light Muted', lightThemeAlt3],
	['Dark Default', darkTheme],
	['Eclipse', darkThemeAlt1],
	['Midnight', darkThemeAlt2],
	['Dark Muted', darkThemeAlt3],
] as const;

function relativeLuminance(color: string) {
	const channels = color
		.slice(1)
		.match(/.{2}/g)!
		.map((channel) => Number.parseInt(channel, 16) / 255)
		.map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));

	return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(first: string, second: string) {
	const firstLuminance = relativeLuminance(first);
	const secondLuminance = relativeLuminance(second);
	const lighter = Math.max(firstLuminance, secondLuminance);
	const darker = Math.min(firstLuminance, secondLuminance);

	return (lighter + 0.05) / (darker + 0.05);
}

describe('theme palettes', () => {
	it('anchors Dark Default to a neutral #161616 base', () => {
		expect(darkTheme.neutral1).toBe('#161616');
	});

	it.each(palettes)('%s keeps its secondary surface close to its base', (_name, palette) => {
		expect(contrastRatio(palette.neutral1, palette.neutral2)).toBeLessThanOrEqual(1.035);
	});

	it.each(palettes)('%s uses progressive neutral ramps', (_name, palette) => {
		const surfaceRamp = [
			palette.neutral1,
			palette.neutral2,
			palette.neutral3,
			palette.neutral4,
			palette.neutral5,
			palette.neutral6,
			palette.neutral7,
			palette.neutral8,
			palette.neutral9,
		].map(relativeLuminance);
		const textRamp = [
			palette.neutralA1,
			palette.neutralA2,
			palette.neutralA3,
			palette.neutralA4,
			palette.neutralA5,
			palette.neutralA6,
			palette.neutralA7,
		].map(relativeLuminance);

		for (let index = 1; index < surfaceRamp.length; index += 1) {
			if (palette.scheme === 'light') {
				expect(surfaceRamp[index - 1]).toBeGreaterThan(surfaceRamp[index]);
			} else {
				expect(surfaceRamp[index - 1]).toBeLessThan(surfaceRamp[index]);
			}
		}

		for (let index = 1; index < textRamp.length; index += 1) {
			if (palette.scheme === 'light') {
				expect(textRamp[index - 1]).toBeLessThan(textRamp[index]);
			} else {
				expect(textRamp[index - 1]).toBeGreaterThan(textRamp[index]);
			}
		}
	});

	it.each(palettes)('%s keeps standard text and links readable', (name, palette) => {
		const selectedTheme = theme(palette, name);
		const background = selectedTheme.colors.view.background;
		const foregrounds = [
			selectedTheme.colors.font.primary,
			selectedTheme.colors.font.alt1,
			selectedTheme.colors.font.alt2,
			selectedTheme.colors.font.alt5,
			selectedTheme.colors.link.color,
			selectedTheme.colors.link.active,
		];

		for (const foreground of foregrounds) {
			expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
		}
	});

	it.each(palettes.filter(([, palette]) => palette.scheme === 'light'))(
		'%s keeps primary action labels readable',
		(name, palette) => {
			const selectedTheme = theme(palette, name);

			expect(
				contrastRatio(selectedTheme.colors.button.alt1.color, selectedTheme.colors.button.alt1.background)
			).toBeGreaterThanOrEqual(4.5);
			expect(
				contrastRatio(selectedTheme.colors.button.alt1.active.color, selectedTheme.colors.button.alt1.active.background)
			).toBeGreaterThanOrEqual(4.5);
		}
	);
});
