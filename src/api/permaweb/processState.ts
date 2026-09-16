import { AoReadError, type AoReadResult, type getAoReadTransport } from 'api/aoNetwork';

import { AO_STATE_READ_TIMEOUT_MS } from 'helpers/config';
import { checkValidAddress } from 'helpers/utils';

type StateRecord = Record<string, unknown>;
type Link = { id: string; key: string; target: StateRecord; ancestors: ReadonlySet<string>; depth: number };
type DeferredValue = {
	value: unknown;
	assign: (value: unknown) => void;
	ancestors: ReadonlySet<string>;
	depth: number;
};

export type ProcessStateProgress = AoReadResult<unknown> & { completedLinks: number; totalLinks: number };
export type ProcessStateLoadOptions = {
	signal?: AbortSignal;
	onProgress?: (progress: ProcessStateProgress) => void;
};
export type ProcessStateResult = AoReadResult<unknown> & {
	/** Present when traversal paused; continues the same snapshot without reading /now again. */
	loadMore?: (options?: ProcessStateLoadOptions) => Promise<ProcessStateResult>;
};

const LINK_CONCURRENCY = 4;
const MAX_LINKS = 256;
const MAX_DEPTH = 64;
const TRANSPORT_HEADERS = new Set([
	'accept-ranges',
	'access-control-allow-headers',
	'access-control-allow-methods',
	'access-control-allow-origin',
	'access-control-expose-headers',
	'age',
	'cache-control',
	'connection',
	'content-digest',
	'content-length',
	'date',
	'etag',
	'keep-alive',
	'location',
	'server',
	'signature',
	'signature-input',
	'transfer-encoding',
	'vary',
	'via',
]);

export function linkedStatePath(id: string): string {
	if (!checkValidAddress(id)) throw new AoReadError('invalid-input');
	// The cache read preserves the linked message's device and avoids gateway ID redirects.
	return `/~cache@1.0/read=${id}?require-codec=json%401.0&accept-bundle=true`;
}

/** HTTP-Sig puts scalar state in headers and nested messages in +link fields. */
export function parseStateHeaders(headers: Headers): StateRecord {
	const entries: [string, string][] = [];
	headers.forEach((value, encodedName) => {
		let name = encodedName;
		try {
			name = decodeURIComponent(encodedName);
		} catch {
			// A literal percent sign is allowed in an HTTP field name.
		}
		if (['__proto__', 'constructor', 'prototype'].includes(name)) throw new AoReadError('invalid-response');
		if (!TRANSPORT_HEADERS.has(name.toLowerCase())) entries.push([name, value]);
	});
	if (!entries.some(([key]) => key !== 'content-type') || headers.get('content-type')?.startsWith('text/html'))
		throw new AoReadError('invalid-response');
	// Keep scalar strings intact, including token quantities larger than MAX_SAFE_INTEGER.
	return Object.fromEntries(entries);
}

export async function readProcessState(
	transport: ReturnType<typeof getAoReadTransport>,
	path: string,
	options: ProcessStateLoadOptions & {
		field?: string;
		timeoutMs: number;
	}
): Promise<ProcessStateResult> {
	const links: Link[] = [];
	const deferred: DeferredValue[] = [];
	const messages = new Map<string, Promise<unknown>>();
	let linkCount = 0;
	let completedLinks = 0;
	let depthLimit = 0;
	let state: unknown;
	let response: AoReadResult<StateRecord>;
	let inFlight: Promise<ProcessStateResult> | undefined;
	const getData = () => (options.field ? (state as StateRecord)[options.field] : state);

	function loadMore(next: ProcessStateLoadOptions = {}): Promise<ProcessStateResult> {
		// Repeated clicks share the active batch and cannot extend its budget.
		if (inFlight) return inFlight;
		depthLimit += MAX_DEPTH;
		inFlight = readBatch(next).finally(() => {
			inFlight = undefined;
		});
		return inFlight;
	}

	async function readBatch(next: ProcessStateLoadOptions): Promise<ProcessStateResult> {
		const controller = new AbortController();
		let timedOut = false;
		const cancel = () => controller.abort();
		const signals = new Set([options.signal, next.signal]);
		for (const parent of signals) {
			parent?.addEventListener('abort', cancel, { once: true });
			if (parent?.aborted) cancel();
		}
		const timer = setTimeout(() => {
			timedOut = true;
			cancel();
		}, options.timeoutMs);
		const signal = controller.signal;
		const checkCancelled = () => {
			if (signal.aborted) throw new AoReadError(timedOut ? 'timeout' : 'cancelled');
		};
		const active = new Set<Promise<void>>();
		const failed: Link[] = [];

		function follow(visit: DeferredValue, discovered: Link[], suspended: DeferredValue[]) {
			checkCancelled();
			const { value, assign, ancestors, depth } = visit;
			if (value === null || typeof value !== 'object') return assign(value);
			if (depth > depthLimit) {
				// Inline values are already available; defer discovering their deeper links.
				assign(structuredClone(value));
				suspended.push(visit);
				return;
			}
			if (Array.isArray(value)) {
				const result: unknown[] = [];
				value.forEach((entry, index) =>
					follow(
						{ value: entry, assign: (child) => (result[index] = child), ancestors, depth: depth + 1 },
						discovered,
						suspended
					)
				);
				assign(result);
				return;
			}
			const entries = Object.entries(value);
			const result: StateRecord = Object.fromEntries(entries.filter(([key]) => !key.endsWith('+link')));
			for (const [name, entry] of entries) {
				if (!name.endsWith('+link')) {
					follow(
						{ value: entry, assign: (child) => (result[name] = child), ancestors, depth: depth + 1 },
						discovered,
						suspended
					);
					continue;
				}
				const key = name.slice(0, -5);
				if (!key || ['__proto__', 'constructor', 'prototype'].includes(key)) throw new AoReadError('invalid-response');
				if (Object.hasOwn(result, key)) continue;
				if (typeof entry !== 'string' || !checkValidAddress(entry) || ancestors.has(entry))
					throw new AoReadError('invalid-response');
				result[name] = entry;
				discovered.push({ id: entry, key, target: result, ancestors, depth });
			}
			assign(result);
		}

		const discover = (visit: DeferredValue) => {
			const discovered: Link[] = [];
			const suspended: DeferredValue[] = [];
			follow(visit, discovered, suspended);
			links.push(...discovered);
			deferred.push(...suspended);
			linkCount += discovered.length;
		};
		const publish = () => {
			checkCancelled();
			(next.onProgress ?? options.onProgress)?.({
				...response,
				data: structuredClone(getData()),
				completedLinks,
				totalLinks: linkCount,
			});
		};
		const hydrateLink = async (link: Link) => {
			let pending = messages.get(link.id);
			if (!pending) {
				pending = transport
					.readJson(linkedStatePath(link.id), { signal, timeoutMs: AO_STATE_READ_TIMEOUT_MS })
					.then((result) => result.data)
					.catch((error: unknown) => {
						messages.delete(link.id);
						throw error;
					});
				messages.set(link.id, pending);
			}
			discover({
				value: await pending,
				assign: (value) => (link.target[link.key] = value),
				ancestors: new Set([...link.ancestors, link.id]),
				depth: link.depth + 1,
			});
			delete link.target[`${link.key}+link`];
			completedLinks++;
			publish();
		};
		try {
			checkCancelled();
			if (!response) {
				response = await transport.readHeaders(
					path,
					{ signal, timeoutMs: AO_STATE_READ_TIMEOUT_MS },
					parseStateHeaders
				);
				const selected = options.field
					? Object.fromEntries(
							Object.entries(response.data).filter(([key]) => key === options.field || key === `${options.field}+link`)
					  )
					: response.data;
				discover({ value: selected, assign: (value) => (state = value), ancestors: new Set(), depth: 0 });
			}
			const pendingVisits = deferred.splice(0);
			for (let index = 0; index < pendingVisits.length; index++) {
				try {
					discover(pendingVisits[index]);
				} catch (error) {
					deferred.unshift(...pendingVisits.slice(index));
					throw error;
				}
			}
			publish();
			let started = 0;
			let failure: unknown;
			while (true) {
				checkCancelled();
				while (started < MAX_LINKS && active.size < LINK_CONCURRENCY) {
					const index = links.findIndex((link) => link.depth < depthLimit);
					if (index === -1) break;
					const [link] = links.splice(index, 1);
					started++;
					const pending = hydrateLink(link)
						.catch((error: unknown) => {
							failure ??= error;
							failed.push(link);
						})
						.finally(() => active.delete(pending));
					active.add(pending);
				}
				if (!active.size) break;
				await Promise.race(active);
			}
			checkCancelled();
			if (failure) throw failure;
			return {
				...response,
				data: structuredClone(getData()),
				...(links.length || deferred.length ? { loadMore } : {}),
			};
		} catch (error) {
			checkCancelled();
			throw error;
		} finally {
			clearTimeout(timer);
			for (const parent of signals) parent?.removeEventListener('abort', cancel);
			controller.abort();
			await Promise.allSettled(active);
			links.push(...failed);
		}
	}
	return loadMore();
}
