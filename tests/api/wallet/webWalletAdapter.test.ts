// @vitest-environment jsdom

import {
	isWebWalletEventMessage,
	isWebWalletResponseMessage,
	WALLET_API_METHODS,
	WEB_WALLET_PROTOCOL_VERSION,
} from '@permaweb/web-wallet';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	connectBrowserWallet,
	createWebWalletClientProvider,
	hasInjectedPermawebWallet,
	isEmbeddedBrowserWallet,
	openEmbeddedWebWallet,
	resolveBrowserWallet,
	resolveWebWalletConnectionUrl,
	webWalletClientProvider,
} from '../../../src/api/wallet';
import type { BrowserWallet } from '../../../src/api/wallet/types';

function injectedWallet(): BrowserWallet {
	return {
		connect: vi.fn().mockResolvedValue(undefined),
		getActiveAddress: vi.fn().mockResolvedValue('A'.repeat(43)),
	};
}

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('web wallet fallback', () => {
	it('prefers the injected PermawebOS provider and otherwise returns the iframe provider', () => {
		const injected = injectedWallet();
		expect(hasInjectedPermawebWallet({ permawebConnect: injected })).toBe(true);
		expect(resolveBrowserWallet({ permawebConnect: injected }, 'permaweb-os')).toBe(injected);
		expect(resolveBrowserWallet({}, 'permaweb-os')).toBe(webWalletClientProvider);
		expect(isEmbeddedBrowserWallet(injected)).toBe(false);
		expect(isEmbeddedBrowserWallet(webWalletClientProvider)).toBe(true);
	});

	it('supplies Lunar application info when connecting PermawebOS', async () => {
		const injected = {
			...injectedWallet(),
			getPermissions: vi.fn().mockResolvedValue([]),
		};

		await connectBrowserWallet({ permawebConnect: injected }, 'permaweb-os', ['ACCESS_ADDRESS']);

		expect(injected.connect).toHaveBeenCalledWith(['ACCESS_ADDRESS'], { name: 'Lunar' });
	});

	it('fails quickly when an already-approved PermawebOS provider stops responding', async () => {
		vi.useFakeTimers();
		const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const injected = {
			...injectedWallet(),
			getPermissions: vi.fn().mockResolvedValue(['ACCESS_ADDRESS']),
			connect: vi.fn(() => new Promise<void>(() => undefined)),
		};
		const connection = connectBrowserWallet({ permawebConnect: injected }, 'permaweb-os', ['ACCESS_ADDRESS']);
		const rejection = expect(connection).rejects.toThrow('already-approved connection');

		await vi.advanceTimersByTimeAsync(10_000);
		await rejection;
		expect(warning).toHaveBeenCalledWith('[wallet-connection]', {
			wallet: 'PermawebOS',
			phase: 'connect',
			durationMs: 10_000,
			outcome: 'timed-out',
		});
	});

	it('keeps the longer deadline when PermawebOS still needs user approval', async () => {
		vi.useFakeTimers();
		vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		let approve!: () => void;
		const injected = {
			...injectedWallet(),
			getPermissions: vi.fn().mockResolvedValue([]),
			connect: vi.fn(
				() =>
					new Promise<void>((resolve) => {
						approve = resolve;
					})
			),
		};
		const connection = connectBrowserWallet({ permawebConnect: injected }, 'permaweb-os', ['ACCESS_ADDRESS']);
		let settled = false;
		void connection.then(
			() => {
				settled = true;
			},
			() => {
				settled = true;
			}
		);

		await vi.advanceTimersByTimeAsync(10_000);
		expect(settled).toBe(false);
		approve();
		await expect(connection).resolves.toMatchObject({ address: 'A'.repeat(43) });
	});

	it('opens the iframe wallet explicitly through the client adapter', () => {
		const presentations: string[] = [];
		const unsubscribe = webWalletClientProvider.subscribeToPresentation((state) => presentations.push(state.status));

		openEmbeddedWebWallet();

		expect(presentations).toEqual(['open']);
		unsubscribe();
	});

	it('builds an exact, secure, origin-bound iframe URL', () => {
		const url = resolveWebWalletConnectionUrl(
			{ href: 'https://lunar.example/#/', origin: 'https://lunar.example' },
			'https://wallet.example/'
		);

		expect(url.origin).toBe('https://wallet.example');
		expect(url.searchParams.get('permawebos-web-wallet')).toBe('1');
		expect(url.searchParams.get('client-origin')).toBe('https://lunar.example');
	});

	it('rejects insecure and same-origin production wallet URLs', () => {
		expect(() =>
			resolveWebWalletConnectionUrl(
				{ href: 'https://lunar.example/', origin: 'https://lunar.example' },
				'http://wallet.example/'
			)
		).toThrow('must use HTTPS');
		expect(() =>
			resolveWebWalletConnectionUrl(
				{ href: 'https://lunar.example/', origin: 'https://lunar.example' },
				'https://lunar.example/wallet/'
			)
		).toThrow('dedicated origin');
	});

	it('exposes the complete wallet API and requests presentation for interactive calls', async () => {
		const provider = createWebWalletClientProvider({ walletUrl: 'http://localhost:5173/' });
		const presentations: string[] = [];
		provider.subscribeToPresentation((state) => presentations.push(state.status));

		for (const method of WALLET_API_METHODS) {
			expect(typeof (provider as unknown as Record<string, unknown>)[method]).toBe('function');
		}
		await expect(provider.getPermissions()).resolves.toEqual([]);
		await expect(provider.connect(['ACCESS_ADDRESS'])).rejects.toMatchObject({
			code: 'frame-unavailable',
		});
		expect(presentations).toEqual(['approval', 'hidden']);
	});

	it('handshakes with the exact frame and origin before forwarding wallet requests', async () => {
		const provider = createWebWalletClientProvider({ walletUrl: 'http://localhost:5173/' });
		const source = resolveWebWalletConnectionUrl(window.location).href;
		const postMessage = vi.fn();
		const frameWindow = { postMessage } as unknown as WindowProxy;
		const frame = {
			src: source,
			isConnected: true,
			contentWindow: frameWindow,
		} as unknown as HTMLIFrameElement;

		provider.attachFrame(frame);
		const addressRequest = provider.getActiveAddress();
		const init = postMessage.mock.calls[0][0] as { sessionId: string };
		window.dispatchEvent(
			new MessageEvent('message', {
				origin: 'https://wrong-wallet.example',
				source: frameWindow,
				data: {
					type: 'PERMAWEBOS_WEB_WALLET_READY',
					protocolVersion: WEB_WALLET_PROTOCOL_VERSION,
					sessionId: init.sessionId,
					walletVersion: '0.1.0',
				},
			})
		);
		expect(postMessage).toHaveBeenCalledTimes(1);

		window.dispatchEvent(
			new MessageEvent('message', {
				origin: new URL(source).origin,
				source: frameWindow,
				data: {
					type: 'PERMAWEBOS_WEB_WALLET_READY',
					protocolVersion: WEB_WALLET_PROTOCOL_VERSION,
					sessionId: init.sessionId,
					walletVersion: '0.1.0',
				},
			})
		);

		await vi.waitFor(() =>
			expect(postMessage.mock.calls.some(([message]) => message.method === 'getActiveAddress')).toBe(true)
		);
		const request = postMessage.mock.calls.find(([message]) => message.method === 'getActiveAddress')?.[0] as {
			id: string;
			sessionId: string;
		};
		window.dispatchEvent(
			new MessageEvent('message', {
				origin: new URL(source).origin,
				source: frameWindow,
				data: {
					type: 'PERMAWEBOS_WEB_WALLET_RESPONSE',
					protocolVersion: WEB_WALLET_PROTOCOL_VERSION,
					sessionId: request.sessionId,
					id: request.id,
					result: 'A'.repeat(43),
				},
			})
		);

		await expect(addressRequest).resolves.toBe('A'.repeat(43));
		provider.detachFrame(frame);
	});

	it('rejects malformed protocol identifiers and unknown events', () => {
		const response = {
			type: 'PERMAWEBOS_WEB_WALLET_RESPONSE',
			protocolVersion: WEB_WALLET_PROTOCOL_VERSION,
			sessionId: crypto.randomUUID(),
			id: crypto.randomUUID(),
			result: 'ok',
		};
		expect(isWebWalletResponseMessage(response)).toBe(true);
		expect(isWebWalletResponseMessage({ ...response, id: 'short' })).toBe(false);
		expect(
			isWebWalletEventMessage({
				type: 'PERMAWEBOS_WEB_WALLET_EVENT',
				protocolVersion: WEB_WALLET_PROTOCOL_VERSION,
				sessionId: crypto.randomUUID(),
				event: { name: 'exportKeyfile', value: null },
			})
		).toBe(false);
	});
});
