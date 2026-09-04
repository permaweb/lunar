import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			api: path.resolve(__dirname, 'src/api'),
			components: path.resolve(__dirname, 'src/components'),
			features: path.resolve(__dirname, 'src/features'),
			helpers: path.resolve(__dirname, 'src/helpers'),
			hooks: path.resolve(__dirname, 'src/hooks'),
			providers: path.resolve(__dirname, 'src/providers'),
			store: path.resolve(__dirname, 'src/store'),
			wrappers: path.resolve(__dirname, 'src/wrappers'),
		},
	},
	test: {
		environment: 'node',
	},
});
