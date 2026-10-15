import { AoReadError } from 'api/aoNetwork';
import { getGraphQLEndpoint, normalizeGraphQLEndpoint } from 'api/graphql';
import { requestRemote } from 'api/http';
import { createRequestQueue } from 'api/http/requestQueue';

import { checkValidAddress, checkValidEthereumAddress } from 'helpers/utils';

import type { HolderLastTransaction } from './types';

const BATCH_SIZE = 10;
const CONCURRENCY = 2;
const TIMEOUT_MS = 15_000;
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { updatedAt: number; transaction: HolderLastTransaction }>();
const SELECTION = '{ edges { node { id } } }';
const enqueue = createRequestQueue(4, () => new AoReadError('cancelled'));

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function query(endpoint: string, name: string, fields: string[], signal?: AbortSignal) {
	if (signal?.aborted) throw new AoReadError('cancelled');
	const controller = new AbortController();
	const handleAbort = () => controller.abort();
	signal?.addEventListener('abort', handleAbort, { once: true });
	let timedOut = false;
	const timeout = setTimeout(() => {
		timedOut = true;
		controller.abort();
	}, TIMEOUT_MS);
	try {
		const response = await requestRemote(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'Codec-Device': 'json@1.0' },
			body: JSON.stringify({ query: `query ${name} { ${fields.join('\n')} }` }),
			signal: controller.signal,
		});
		if (!response.ok) throw new AoReadError('unavailable');
		const payload: unknown = await response.json();
		if (
			!isRecord(payload) ||
			!isRecord(payload.data) ||
			(payload.errors !== undefined && (!Array.isArray(payload.errors) || payload.errors.length > 0)) ||
			(isRecord(payload.extensions) &&
				Array.isArray(payload.extensions.warnings) &&
				payload.extensions.warnings.length > 0)
		)
			throw new AoReadError('invalid-response');
		return payload.data;
	} catch (error) {
		if (signal?.aborted) throw new AoReadError('cancelled');
		if (timedOut) throw new AoReadError('timeout');
		if (error instanceof AoReadError) throw error;
		throw new AoReadError(error instanceof SyntaxError ? 'invalid-response' : 'unavailable');
	} finally {
		clearTimeout(timeout);
		signal?.removeEventListener('abort', handleAbort);
	}
}

function readTransaction(connection: unknown): string | null {
	if (!isRecord(connection) || !Array.isArray(connection.edges) || connection.edges.length > 1)
		throw new AoReadError('invalid-response');
	if (connection.edges.length === 0) return null;
	const edge = connection.edges[0];
	if (!isRecord(edge) || !isRecord(edge.node) || typeof edge.node.id !== 'string' || !checkValidAddress(edge.node.id))
		throw new AoReadError('invalid-response');
	return edge.node.id;
}

async function readBatch(endpoint: string, addresses: string[], signal?: AbortSignal) {
	const fields = addresses.flatMap((address, index) => {
		const wallet = JSON.stringify([address]);
		return [
			`incoming${index}: transactions(first:1, sort:HEIGHT_DESC, recipients:${wallet}) ${SELECTION}`,
			`outgoing${index}: transactions(first:1, sort:HEIGHT_DESC, owners:${wallet}) ${SELECTION}`,
		];
	});
	const data = await query(endpoint, 'LatestHolderTransactions', fields, signal);
	const result: Record<string, HolderLastTransaction> = {};
	const candidates = new Map<number, string[]>();
	for (let index = 0; index < addresses.length; index++) {
		try {
			const ids = [...new Set(['incoming', 'outgoing'].map((key) => readTransaction(data[`${key}${index}`])))].filter(
				(id): id is string => id !== null
			);
			if (ids.length > 1) candidates.set(index, ids);
			else result[addresses[index]] = ids.length ? { status: 'found', transactionId: ids[0] } : { status: 'empty' };
		} catch {
			result[addresses[index]] = { status: 'error' };
		}
	}
	if (candidates.size) {
		try {
			// Let the index compare directions using its complete ordering, including transactions in the same block.
			const newest = await query(
				endpoint,
				'LatestHolderTransactionsById',
				[...candidates].map(
					([index, ids]) =>
						`latest${index}: transactions(first:1, sort:HEIGHT_DESC, ids:${JSON.stringify(ids)}) ${SELECTION}`
				),
				signal
			);
			for (const [index, ids] of candidates) {
				try {
					const id = readTransaction(newest[`latest${index}`]);
					result[addresses[index]] =
						id && ids.includes(id) ? { status: 'found', transactionId: id } : { status: 'error' };
				} catch {
					result[addresses[index]] = { status: 'error' };
				}
			}
		} catch (error) {
			if (signal?.aborted) throw error;
			for (const index of candidates.keys()) result[addresses[index]] = { status: 'error' };
		}
	}
	return result;
}

/** Latest indexed transactions owned by or addressed to each wallet, independent of the token balance snapshot. */
export async function getLatestHolderTransactions(options: {
	addresses: string[];
	endpoint?: string;
	signal?: AbortSignal;
	onUpdate?: (transactions: Record<string, HolderLastTransaction>) => void;
}): Promise<Record<string, HolderLastTransaction>> {
	const endpoint = normalizeGraphQLEndpoint(options.endpoint ?? getGraphQLEndpoint());
	const signal = options.signal ?? new AbortController().signal;
	if (
		!endpoint ||
		options.addresses.length > 100 ||
		options.addresses.some((address) => !checkValidAddress(address) && !checkValidEthereumAddress(address))
	)
		throw new AoReadError('invalid-input');
	if (options.signal?.aborted) throw new AoReadError('cancelled');
	const addresses = [...new Set(options.addresses)];
	const result: Record<string, HolderLastTransaction> = {};
	const missing: string[] = [];
	for (const address of addresses) {
		// Owner filters use the ANS-104 address, not a derived Ethereum account.
		if (!checkValidAddress(address)) {
			result[address] = { status: 'unsupported' };
			continue;
		}
		const saved = cache.get(`${endpoint}:${address}`);
		if (saved && Date.now() >= saved.updatedAt && Date.now() - saved.updatedAt < CACHE_TTL_MS)
			result[address] = saved.transaction;
		else missing.push(address);
	}
	options.onUpdate?.({ ...result });
	const batches = Array.from({ length: Math.ceil(missing.length / BATCH_SIZE) }, (_, index) =>
		missing.slice(index * BATCH_SIZE, (index + 1) * BATCH_SIZE)
	);
	let next = 0;
	await Promise.all(
		Array.from({ length: Math.min(CONCURRENCY, batches.length) }, async () => {
			while (next < batches.length) {
				if (options.signal?.aborted) throw new AoReadError('cancelled');
				const batch = batches[next++];
				let transactions: Record<string, HolderLastTransaction>;
				try {
					transactions = await enqueue(() => readBatch(endpoint, batch, signal), signal);
				} catch (error) {
					if (options.signal?.aborted) throw error;
					transactions = Object.fromEntries(batch.map((address) => [address, { status: 'error' }]));
				}
				if (options.signal?.aborted) throw new AoReadError('cancelled');
				for (const [address, transaction] of Object.entries(transactions)) {
					result[address] = transaction;
					if (transaction.status !== 'error')
						cache.set(`${endpoint}:${address}`, { updatedAt: Date.now(), transaction });
				}
				while (cache.size > 1000) cache.delete(cache.keys().next().value);
				options.onUpdate?.({ ...result });
			}
		})
	);
	return result;
}
