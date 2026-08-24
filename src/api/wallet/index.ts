export type BrowserWalletId = 'permaweb-os' | 'wander';

export type BrowserWallet = {
	connect(permissions: string[]): Promise<void>;
	disconnect?(): Promise<void>;
	getActiveAddress(): Promise<string>;
	getPermissions?(): Promise<string[]>;
	[key: string]: unknown;
};

type BrowserWalletScope = {
	arweaveWallet?: unknown;
	permawebConnect?: unknown;
};

const ARWEAVE_ADDRESS = /^[A-Za-z0-9_-]{43}$/;
let rememberedWanderWallet: BrowserWallet | undefined;

function isBrowserWallet(value: unknown): value is BrowserWallet {
	return Boolean(
		value &&
			typeof value === 'object' &&
			typeof (value as BrowserWallet).connect === 'function' &&
			typeof (value as BrowserWallet).getActiveAddress === 'function'
	);
}

export function resolveBrowserWallet(scope: BrowserWalletScope, walletId: BrowserWalletId) {
	if (walletId === 'permaweb-os') {
		if (isBrowserWallet(scope.arweaveWallet) && scope.arweaveWallet !== scope.permawebConnect) {
			rememberedWanderWallet = scope.arweaveWallet;
		}
		return isBrowserWallet(scope.permawebConnect) ? scope.permawebConnect : undefined;
	}
	if (isBrowserWallet(scope.arweaveWallet) && scope.arweaveWallet !== scope.permawebConnect) {
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
	if (!wallet) throw new Error(`${walletId === 'permaweb-os' ? 'PermawebOS' : 'Wander'} wallet was not found`);
	await wallet.connect(permissions);
	const address = await wallet.getActiveAddress();
	if (!ARWEAVE_ADDRESS.test(address)) throw new Error('The wallet returned an invalid active address');
	return { address, wallet };
}

export async function restoreBrowserWallet(
	scope: BrowserWalletScope,
	walletId: BrowserWalletId,
	permissions: string[]
) {
	const wallet = resolveBrowserWallet(scope, walletId);
	if (!wallet) return undefined;
	if (walletId === 'permaweb-os' && wallet.getPermissions) {
		const granted: string[] = await wallet.getPermissions().catch(() => []);
		if (!permissions.every((permission) => granted.includes(permission))) return undefined;
	}
	const address = await wallet.getActiveAddress().catch(() => undefined);
	return address && ARWEAVE_ADDRESS.test(address) ? { address, wallet } : undefined;
}
