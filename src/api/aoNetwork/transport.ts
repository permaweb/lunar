import { cacheMetadata, createAo } from 'ao.js';
import JSONbig from 'json-bigint';

import { type AoNetworkSettings, restoreAoNetwork } from 'helpers/aoNetwork';
import { AO_EXTENSION_RETRY_MS, AO_READ_TIMEOUT_MS } from 'helpers/config';

import { type AoNetworkStatus, AoReadError, type AoReadResult, type InjectedAoFetch } from './types';

const losslessJson = JSONbig({ storeAsString: true, protoAction: 'error', constructorAction: 'error' });
type ReadOptions = RequestInit & { timeoutMs?: number };

export function createAoReadTransport(
	settings: AoNetworkSettings,
	dependencies: {
		fetch?: typeof fetch;
		injected?: () => InjectedAoFetch | undefined;
		timeoutMs?: number;
		now?: () => number;
	} = {}
) {
	const config = restoreAoNetwork(settings);
	const timeoutMs = dependencies.timeoutMs ?? AO_READ_TIMEOUT_MS;
	const now = dependencies.now ?? Date.now;
	const injected = dependencies.injected ?? (() => (typeof window === 'undefined' ? undefined : window.aoFetch));
	const nodes = config.peers.map((prefix) => ({
		prefix,
		'rate-limit': dependencies.fetch ? (false as const) : ('discover' as const),
	}));
	const clients = new Map<number, ReturnType<typeof createAo>>();
	function getClient(requestTimeoutMs: number) {
		const existing = clients.get(requestTimeoutMs);
		if (existing) return existing;
		// Isolate routes and deadlines so a short read cannot shorten the full-state budget.
		const client = createAo(
			{
				nodes,
				requestTimeoutMs,
				routes: ['GET', 'HEAD'].map((method) => ({
					template: { method },
					nodes,
					strategy: 'By-Base' as const,
					choose: nodes.length,
					'admissible-status': [200, 201, 202, 204, 206, 304],
					'fallback-on-cooldown': true,
				})),
			},
			dependencies.fetch
		);
		clients.set(requestTimeoutMs, client);
		return client;
	}
	let failedUntil = 0;
	let policy: Pick<AoNetworkStatus, 'processPeers' | 'schedulePeers' | 'linkedStatePeers'> | undefined;
	let policyRevision = 0;
	const listeners = new Set<() => void>();
	const getExtension = () => (config.preferPermawebOS && typeof injected() === 'function' ? injected() : undefined);
	let snapshot: AoNetworkStatus;

	function updateStatus() {
		const available = typeof injected() === 'function';
		const source = getExtension() ? (failedUntil > now() ? 'fallback' : 'permawebos') : 'peers';
		const peers = source === 'permawebos' ? parseProviderList(injected()?.peers) : config.peers;
		const next: AoNetworkStatus = {
			source,
			extensionAvailable: available,
			...(source === 'permawebos' && policy
				? policy
				: { processPeers: peers, schedulePeers: peers, linkedStatePeers: peers }),
		};
		if (JSON.stringify(next) === JSON.stringify(snapshot)) return;
		snapshot = next;
		listeners.forEach((listener) => listener());
	}

	async function refreshExtension() {
		const revision = ++policyRevision;
		failedUntil = 0;
		policy = undefined;
		updateStatus();
		const extension = getExtension();
		if (!extension) return;
		try {
			const value = await bounded(
				async () => {
					await extension.ready?.();
					return extension.networkPolicy?.();
				},
				undefined,
				timeoutMs
			);
			if (revision !== policyRevision || extension !== getExtension()) return;
			if (isRecord(value) && isRecord(value.ao)) {
				policy = {
					processPeers: parseProviderList(value.ao.processReads),
					schedulePeers: parseProviderList(value.ao.scheduleReads),
					linkedStatePeers: parseProviderList(value.ao.linkedStateReads),
				};
			}
			updateStatus();
		} catch {
			// Discovery is optional. Actual reads still try the extension and enforce fallback policy.
		}
	}

	async function read<T>(
		path: string,
		consume: (response: Response) => Promise<T>,
		options: ReadOptions = {}
	): Promise<AoReadResult<T>> {
		const { timeoutMs: requestTimeoutMs = timeoutMs, ...init } = options;
		if (!Number.isFinite(requestTimeoutMs) || requestTimeoutMs <= 0) throw new AoReadError('invalid-input');
		if (!path.startsWith('/') || path.startsWith('//') || !['GET', 'HEAD'].includes(init.method ?? 'GET')) {
			throw new AoReadError('invalid-input');
		}
		if (init.signal?.aborted) throw new AoReadError('cancelled');
		updateStatus();
		const extension = getExtension();
		if (extension && (failedUntil <= now() || !config.fallbackToPeers)) {
			try {
				const result = await bounded(
					async (signal) => {
						const response = await extension(path, { ...init, signal });
						if (!response.ok) throw new AoReadError('unavailable');
						const data = await consume(response);
						return {
							data,
							provider: responseOrigin(response) || extension.cacheMetadata?.(response)?.origin || 'PermawebOS',
							source: 'permawebos' as const,
						};
					},
					init.signal,
					requestTimeoutMs
				);
				failedUntil = 0;
				updateStatus();
				return result;
			} catch (error) {
				if (init.signal?.aborted) throw new AoReadError('cancelled');
				if (!config.fallbackToPeers) throw normalizeError(error);
				failedUntil = now() + AO_EXTENSION_RETRY_MS;
				updateStatus();
			}
		}
		try {
			return await bounded(
				async (signal) => {
					const response = await getClient(requestTimeoutMs).fetch(path, { ...init, signal });
					if (!response.ok) throw new AoReadError('unavailable');
					return {
						data: await consume(response),
						provider: responseOrigin(response) || cacheMetadata(response)?.origin || '',
						source: extension ? ('fallback' as const) : ('peers' as const),
					};
				},
				init.signal,
				requestTimeoutMs * config.peers.length
			);
		} catch (error) {
			throw init.signal?.aborted ? new AoReadError('cancelled') : normalizeError(error);
		}
	}

	updateStatus();
	return {
		readResponse: read,
		readHeaders: <T>(path: string, init: ReadOptions, parse: (headers: Headers) => T) =>
			read(path, async (response) => parse(response.headers), { ...init, method: 'HEAD' }),
		readJson: <T = unknown>(path: string, init?: ReadOptions, parse?: (value: unknown) => T) =>
			read(
				path,
				async (response) => {
					try {
						const value: unknown = losslessJson.parse(await response.text());
						return parse ? parse(value) : (value as T);
					} catch {
						throw new AoReadError('invalid-response');
					}
				},
				init
			),
		readText: <T = string>(path: string, init?: ReadOptions, parse?: (value: string) => T) =>
			read(
				path,
				async (response) => {
					const value = await response.text();
					return parse ? parse(value) : (value as T);
				},
				init
			),
		getStatus: () => snapshot,
		subscribe(listener: () => void) {
			listeners.add(listener);
			if (listeners.size === 1) {
				globalThis.window?.addEventListener('aoFetchLoaded', refreshExtension);
				void refreshExtension();
			}
			return () => {
				listeners.delete(listener);
				if (!listeners.size) {
					++policyRevision;
					globalThis.window?.removeEventListener('aoFetchLoaded', refreshExtension);
				}
			};
		},
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

function parseProviderList(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((entry) => {
		const url = typeof entry === 'string' ? entry : isRecord(entry) ? entry.url : undefined;
		if (typeof url !== 'string') return [];
		try {
			return ['http:', 'https:'].includes(new URL(url).protocol) ? [new URL(url).origin] : [];
		} catch {
			return [];
		}
	});
}

function responseOrigin(response: Response): string {
	try {
		return new URL(response.url).origin;
	} catch {
		return '';
	}
}

function normalizeError(error: unknown): AoReadError {
	return error instanceof AoReadError ? error : new AoReadError('unavailable');
}

async function bounded<T>(
	operation: (signal: AbortSignal) => Promise<T>,
	parent: AbortSignal | null | undefined,
	timeoutMs: number
): Promise<T> {
	const controller = new AbortController();
	let timer: ReturnType<typeof setTimeout>;
	let onAbort: () => void;
	const cancelled = new Promise<never>((_, reject) => {
		onAbort = () => {
			controller.abort();
			reject(new AoReadError('cancelled'));
		};
		if (parent?.aborted) onAbort();
		else parent?.addEventListener('abort', onAbort, { once: true });
		timer = setTimeout(() => {
			controller.abort();
			reject(new AoReadError('timeout'));
		}, timeoutMs);
	});
	try {
		return await Promise.race([cancelled, operation(controller.signal)]);
	} finally {
		clearTimeout(timer);
		parent?.removeEventListener('abort', onAbort);
	}
}
