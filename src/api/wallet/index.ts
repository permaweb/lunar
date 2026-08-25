import {
	createWebWalletClientProvider,
	openWebWallet as openPackageWebWallet,
	resolveWebWalletConnectionUrl as resolvePackageWebWalletConnectionUrl,
	type WebWalletLocation,
} from '@permawebos/web-wallet';

import { PERMAWEBOS_WALLET_URL } from 'helpers/config';

import type { BrowserWallet, BrowserWalletId, BrowserWalletScope } from './types';

export type { BrowserWallet, BrowserWalletId, BrowserWalletScope, WalletAppInfo, WalletGatewayConfig } from './types';
export {
	createWebWalletClientProvider,
	type WebWalletClientProvider,
	WebWalletError,
	type WebWalletPresentationState,
} from '@permawebos/web-wallet';

export const webWalletClientProvider = createWebWalletClientProvider({
	walletUrl: PERMAWEBOS_WALLET_URL,
});

export function resolveWebWalletConnectionUrl(
	location: WebWalletLocation,
	walletUrl: string | URL = PERMAWEBOS_WALLET_URL
): URL {
	return resolvePackageWebWalletConnectionUrl(location, walletUrl);
}

const ARWEAVE_ADDRESS = /^[A-Za-z0-9_-]{43}$/;
const LUNAR_APP_INFO = { name: 'Lunar' };
let rememberedWanderWallet: BrowserWallet | undefined;

export function isArweaveAddress(value: unknown): value is string {
	return typeof value === 'string' && ARWEAVE_ADDRESS.test(value);
}

function isBrowserWallet(value: unknown): value is BrowserWallet {
	return Boolean(
		value &&
			typeof value === 'object' &&
			typeof (value as BrowserWallet).connect === 'function' &&
			typeof (value as BrowserWallet).getActiveAddress === 'function'
	);
}

export function hasInjectedPermawebWallet(scope: BrowserWalletScope): boolean {
	return isBrowserWallet(scope.permawebConnect);
}

export function isEmbeddedBrowserWallet(wallet: BrowserWallet | null | undefined): boolean {
	return wallet === webWalletClientProvider;
}

export function openEmbeddedWebWallet(): void {
	openPackageWebWallet(webWalletClientProvider);
}

export function resolveBrowserWallet(scope: BrowserWalletScope, walletId: BrowserWalletId): BrowserWallet | undefined {
	if (walletId === 'permaweb-os') {
		if (
			isBrowserWallet(scope.arweaveWallet) &&
			scope.arweaveWallet !== scope.permawebConnect &&
			scope.arweaveWallet !== webWalletClientProvider
		) {
			rememberedWanderWallet = scope.arweaveWallet;
		}
		return isBrowserWallet(scope.permawebConnect) ? scope.permawebConnect : webWalletClientProvider;
	}
	if (
		isBrowserWallet(scope.arweaveWallet) &&
		scope.arweaveWallet !== scope.permawebConnect &&
		scope.arweaveWallet !== webWalletClientProvider
	) {
		rememberedWanderWallet = scope.arweaveWallet;
	}
	return rememberedWanderWallet;
}

export async function connectBrowserWallet(
	scope: BrowserWalletScope,
	walletId: BrowserWalletId,
	permissions: string[]
) {
	const wallet = resolveBrowserWallet(scope, walletId);
	if (!wallet) {
		throw new Error(`${walletId === 'permaweb-os' ? 'PermawebOS' : 'Wander'} wallet was not found`);
	}
	if (walletId === 'permaweb-os') await wallet.connect(permissions, LUNAR_APP_INFO);
	else await wallet.connect(permissions);
	const address = await wallet.getActiveAddress();
	if (!isArweaveAddress(address)) throw new Error('The wallet returned an invalid active address');
	return { address, wallet, isEmbedded: isEmbeddedBrowserWallet(wallet) };
}

export async function restoreBrowserWallet(
	scope: BrowserWalletScope,
	walletId: BrowserWalletId,
	permissions: string[]
) {
	const wallet = resolveBrowserWallet(scope, walletId);
	if (!wallet) return undefined;
	if (walletId === 'permaweb-os' && wallet.getPermissions) {
		const granted = await wallet.getPermissions().catch(() => [] as string[]);
		if (!permissions.every((permission) => granted.includes(permission))) return undefined;
	}
	const address = await wallet.getActiveAddress().catch(() => undefined);
	return isArweaveAddress(address) ? { address, wallet, isEmbedded: isEmbeddedBrowserWallet(wallet) } : undefined;
}
