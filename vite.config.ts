import react from '@vitejs/plugin-react';
import path from 'path';
import polyfillNode from 'rollup-plugin-polyfill-node';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
	plugins: [
		nodePolyfills({
			protocolImports: true,
		}),
		react(),
	],
	resolve: {
		alias: {
			react: path.resolve(__dirname, 'node_modules/react'),
			app: path.resolve(__dirname, 'src/app/'),
			arweave: path.resolve(__dirname, 'node_modules/arweave'),
			assets: path.resolve(__dirname, 'src/assets'),
			components: path.resolve(__dirname, 'src/components'),
			helpers: path.resolve(__dirname, 'src/helpers'),
			hooks: path.resolve(__dirname, 'src/hooks'),
			navigation: path.resolve(__dirname, 'src/navigation'),
			providers: path.resolve(__dirname, 'src/providers'),
			root: path.resolve(__dirname, 'src/root'),
			routes: path.resolve(__dirname, 'src/routes'),
			store: path.resolve(__dirname, 'src/store'),
			views: path.resolve(__dirname, 'src/views'),
			wallet: path.resolve(__dirname, 'src/wallet'),
			wrappers: path.resolve(__dirname, 'src/wrappers'),
			process: 'vite-plugin-node-polyfills/polyfills/process-es6',
			buffer: 'vite-plugin-node-polyfills/polyfills/buffer',
			crypto: 'vite-plugin-node-polyfills/polyfills/crypto',
			stream: 'vite-plugin-node-polyfills/polyfills/stream',
			util: 'vite-plugin-node-polyfills/polyfills/util',
			path: 'vite-plugin-node-polyfills/polyfills/path',
			events: 'vite-plugin-node-polyfills/polyfills/events',
			timers: 'vite-plugin-node-polyfills/polyfills/timers',
			http: 'vite-plugin-node-polyfills/polyfills/http',
			https: 'vite-plugin-node-polyfills/polyfills/http',
			os: 'vite-plugin-node-polyfills/polyfills/os',
			assert: 'vite-plugin-node-polyfills/polyfills/assert',
			zlib: 'vite-plugin-node-polyfills/polyfills/zlib',
			constants: 'vite-plugin-node-polyfills/polyfills/constants',
		},
	},
	optimizeDeps: {
		include: ['buffer', 'process', 'crypto', 'stream', 'util'],
	},
	build: {
		outDir: 'dist',
		sourcemap: false,
		rollupOptions: {
			plugins: [
				polyfillNode(),
				{
					name: 'copy-service-worker',
					writeBundle() {
						const fs = require('fs');
						const swPath = path.resolve(__dirname, 'public/service-worker.js');
						const outPath = path.resolve(__dirname, 'dist/service-worker.js');
						if (fs.existsSync(swPath)) {
							fs.copyFileSync(swPath, outPath);
							console.log('Service worker copied to dist');
						}
					},
				},
			],
			output: {
				manualChunks: (id: string) => {
					if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
						return 'vendor';
					}
					if (id.includes('@permaweb/aoconnect')) {
						return 'ao-connect';
					}
					if (id.includes('@permaweb/libs') || id.includes('arweave')) {
						return 'permaweb-libs';
					}
					if (id.includes('@stripe/')) {
						return 'stripe';
					}
					if (
						id.includes('html-react-parser') ||
						id.includes('react-markdown') ||
						id.includes('react-svg') ||
						id.includes('webfontloader')
					) {
						return 'utils';
					}

					return undefined;
				},
			},
		},
	},
	server: {
		port: 3000,
		open: false,
		strictPort: true,
		hmr: true,
	},
});
