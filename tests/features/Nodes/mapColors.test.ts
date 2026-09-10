import { topojson } from 'chartjs-chart-geo';
import type { GeometryCollection, Topology } from 'topojson-specification';
import { expect, it } from 'vitest';
import atlas from 'world-atlas/countries-110m.json';

import { getCountryColors } from '../../../src/features/Nodes/model/mapColors';
import { darkTheme, darkThemeAlt1, lightTheme } from '../../../src/helpers/themes';

const topology = atlas as unknown as Topology<{ countries: GeometryCollection }>;
const geometries = topology.objects.countries.geometries;
const ids = geometries.map((country) => String(country.id));
const neighbors = topojson.neighbors(geometries);

it.each([darkTheme, lightTheme, darkThemeAlt1])(
	'separates neighboring countries using the $scheme editor palette',
	(theme) => {
		const palette = Object.values(theme.editor);
		const colors = getCountryColors(ids, neighbors, palette);
		expect(colors).toHaveLength(ids.length);
		expect(colors.every((color) => palette.includes(color))).toBe(true);
		for (const [first, second] of [
			['840', '124'],
			['643', '156'],
		]) {
			const a = colors[ids.indexOf(first)];
			const b = colors[ids.indexOf(second)];
			const channels = (color: string) =>
				color
					.slice(1)
					.match(/../g)
					.map((channel) => Number.parseInt(channel, 16));
			const distance = channels(a).reduce((sum, value, index) => sum + (value - channels(b)[index]) ** 2, 0);
			expect(distance).toBeGreaterThanOrEqual(90 ** 2);
		}
		expect(getCountryColors(ids, neighbors, palette)).toEqual(colors);
		expect(new Set(colors).size).toBeGreaterThanOrEqual(5);
	}
);
