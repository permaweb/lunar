import type { WalletAppInfo, WalletEventHandler, WalletEventName, WalletGatewayConfig } from '@permawebos/web-wallet';

export type { WalletAppInfo, WalletGatewayConfig } from '@permawebos/web-wallet';

export type BrowserWalletId = 'permaweb-os' | 'wander';

export interface BrowserWallet {
	readonly walletName?: string;
	readonly walletVersion?: string;
	readonly events?: {
		on(type: WalletEventName | '*', handler: WalletEventHandler): void;
		off(type: WalletEventName | '*', handler?: WalletEventHandler): void;
	};
	connect(permissions: string[], appInfo?: WalletAppInfo, gateway?: WalletGatewayConfig): Promise<void>;
	disconnect?(): Promise<void>;
	getActiveAddress(): Promise<string>;
	getPermissions?(): Promise<string[]>;
}

export type BrowserWalletScope = {
	arweaveWallet?: unknown;
	permawebConnect?: unknown;
};
