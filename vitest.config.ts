import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			app: path.resolve(__dirname, 'src/app'),
			api: path.resolve(__dirname, 'src/api'),
			components: path.resolve(__dirname, 'src/components'),
			features: path.resolve(__dirname, 'src/features'),
			helpers: path.resolve(__dirname, 'src/helpers'),
			providers: path.resolve(__dirname, 'src/providers'),
			store: path.resolve(__dirname, 'src/store'),
			hooks: path.resolve(__dirname, 'src/hooks'),
			wrappers: path.resolve(__dirname, 'src/wrappers'),
		},
	},
	test: {
		environment: 'node',
	},
});
