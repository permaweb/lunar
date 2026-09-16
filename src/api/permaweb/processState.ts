import { AoReadError, type AoReadResult, type getAoReadTransport } from 'api/aoNetwork';

import { AO_STATE_READ_TIMEOUT_MS } from 'helpers/config';
import { checkValidAddress } from 'helpers/utils';

type StateRecord = Record<string, unknown>;
type Link = { id: string; key: string; target: StateRecord; ancestors: ReadonlySet<string>; depth: number };

export type ProcessStateProgress = AoReadResult<unknown> & { completedLinks: number; totalLinks: number };

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
	options: {
		signal?: AbortSignal;
		field?: string;
		timeoutMs: number;
		onProgress?: (progress: ProcessStateProgress) => void;
	}
): Promise<AoReadResult<unknown>> {
	const controller = new AbortController();
	let timedOut = false;
	const cancel = () => controller.abort();
	options.signal?.addEventListener('abort', cancel, { once: true });
	if (options.signal?.aborted) cancel();
	const timer = setTimeout(() => {
		timedOut = true;
		cancel();
	}, options.timeoutMs);
	const signal = controller.signal;
	const checkCancelled = () => {
		if (signal.aborted) throw new AoReadError(timedOut ? 'timeout' : 'cancelled');
	};
	const links: Link[] = [];
	const messages = new Map<string, Promise<unknown>>();
	let linkCount = 0;
	let completedLinks = 0;

	function follow(value: unknown, ancestors: ReadonlySet<string>, depth: number, discovered: Link[]): unknown {
		checkCancelled();
		if (depth > MAX_DEPTH) throw new AoReadError('invalid-response');
		if (Array.isArray(value)) return value.map((entry) => follow(entry, ancestors, depth + 1, discovered));
		if (value === null || typeof value !== 'object') return value;
		const entries = Object.entries(value);
		const state = Object.fromEntries(
			entries
				.filter(([key]) => !key.endsWith('+link'))
				.map(([key, entry]) => [key, follow(entry, ancestors, depth + 1, discovered)])
		);
		for (const [name, id] of entries) {
			if (!name.endsWith('+link')) continue;
			const key = name.slice(0, -5);
			if (!key || ['__proto__', 'constructor', 'prototype'].includes(key)) throw new AoReadError('invalid-response');
			if (Object.hasOwn(state, key)) continue;
			if (typeof id !== 'string' || !checkValidAddress(id) || ancestors.has(id) || ++linkCount > MAX_LINKS)
				throw new AoReadError('invalid-response');
			// Keep unresolved references visible until their values arrive.
			state[name] = id;
			discovered.push({ id, key, target: state, ancestors, depth });
		}
		return state;
	}

	try {
		checkCancelled();
		const response = await transport.readHeaders(
			path,
			{ signal, timeoutMs: AO_STATE_READ_TIMEOUT_MS },
			parseStateHeaders
		);
		const selected = options.field
			? Object.fromEntries(
					Object.entries(response.data).filter(([key]) => key === options.field || key === `${options.field}+link`)
			  )
			: response.data;
		const state = follow(selected, new Set(), 0, links) as StateRecord;
		const getData = () =>
			options.field ? (Object.hasOwn(state, options.field) ? state[options.field] : undefined) : state;
		const publish = () => {
			checkCancelled();
			// Consumers retain snapshots while later requests continue mutating the working tree.
			options.onProgress?.({ ...response, data: structuredClone(getData()), completedLinks, totalLinks: linkCount });
		};
		const hydrateLink = async (link: Link) => {
			let pending = messages.get(link.id);
			if (!pending) {
				pending = transport
					.readJson(linkedStatePath(link.id), { signal, timeoutMs: AO_STATE_READ_TIMEOUT_MS })
					.then((result) => result.data);
				messages.set(link.id, pending);
			}
			const discovered: Link[] = [];
			const value = follow(await pending, new Set([...link.ancestors, link.id]), link.depth + 1, discovered);
			link.target[link.key] = value;
			delete link.target[`${link.key}+link`];
			links.push(...discovered);
			completedLinks++;
			publish();
		};
		publish();
		const active = new Set<Promise<void>>();
		let failure: unknown;
		while (links.length || active.size) {
			checkCancelled();
			// Start another value as soon as a slot opens; a slow link must not hold up an entire batch.
			while (links.length && active.size < LINK_CONCURRENCY) {
				const pending = hydrateLink(links.shift()!)
					.catch((error: unknown) => {
						failure ??= error;
					})
					.finally(() => active.delete(pending));
				active.add(pending);
			}
			await Promise.race(active);
		}
		checkCancelled();
		if (failure) throw failure;
		return {
			...response,
			data: getData(),
		};
	} catch (error) {
		checkCancelled();
		throw error;
	} finally {
		clearTimeout(timer);
		options.signal?.removeEventListener('abort', cancel);
		controller.abort();
	}
}
