import type { BrowserWallet } from 'api/wallet';

declare global {
	interface Window {
		permawebConnect?: BrowserWallet;
	}

	interface ImportMetaEnv {
		readonly VITE_PERMAWEBOS_WALLET_URL?: string;
	}

	interface ImportMeta {
		readonly env: ImportMetaEnv;
	}
}

export {};
