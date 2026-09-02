import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			api: path.resolve(__dirname, 'src/api'),
			components: path.resolve(__dirname, 'src/components'),
			helpers: path.resolve(__dirname, 'src/helpers'),
			providers: path.resolve(__dirname, 'src/providers'),
		},
	},
	test: {
		environment: 'node',
	},
});
