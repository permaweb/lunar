import JSONbig from 'json-bigint';

import { normalizeArweaveNode } from 'helpers/arweaveNode';
import { checkValidAddress } from 'helpers/utils';

import { blockHash, integer, parseBlock, parseInfo, parsePending, parseTransaction, record } from './parsers';
import type { ArweaveNodeApi, NodeBlock } from './types';
import { ArweaveNodeError } from './types';

const RELAY_URL = 'https://arweave.net/~relay@1.0/call';
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RESPONSE_BYTES = 8_000_000;
const CONCURRENCY = 4;
const JSON_PARSER = JSONbig({ storeAsString: true, protoAction: 'error', constructorAction: 'error' });

/** One bounded queue per explorer, including visible wallet and mempool metadata. */
export function createArweaveNodeApi(relayUrl = RELAY_URL): ArweaveNodeApi {
	let running = 0;
	const waiting: (() => void)[] = [];
	async function request(node: string, path: string, signal: AbortSignal): Promise<string> {
		const origin = normalizeArweaveNode(node);
		if (!origin) throw new ArweaveNodeError('invalid-input');
		if (signal.aborted) throw new ArweaveNodeError('cancelled');
		await new Promise<void>((resolve, reject) => {
			const start = () => {
				signal.removeEventListener('abort', cancel);
				running++;
				resolve();
			};
			const cancel = () => {
				const index = waiting.indexOf(start);
				if (index >= 0) waiting.splice(index, 1);
				reject(new ArweaveNodeError('cancelled'));
			};
			if (running < CONCURRENCY) start();
			else {
				waiting.push(start);
				signal.addEventListener('abort', cancel, { once: true });
			}
		});
		const controller = new AbortController();
		const cancel = () => controller.abort();
		signal.addEventListener('abort', cancel, { once: true });
		const timer = setTimeout(cancel, REQUEST_TIMEOUT_MS);
		try {
			if (signal.aborted) throw new ArweaveNodeError('cancelled');
			const url = new URL(relayUrl);
			url.searchParams.set('relay-path', new URL(path, origin).href);
			url.searchParams.set('relay-method', 'GET');
			const response = await fetch(url.href, { signal: controller.signal, credentials: 'omit', cache: 'no-store' });
			if (!response.ok)
				throw new ArweaveNodeError(
					response.status === 429 ? 'rate-limited' : response.status === 404 ? 'not-found' : 'unavailable',
					response.status
				);
			// The relay may omit Content-Type; validate the body itself and bound streamed bytes.
			const reader = response.body?.getReader();
			if (!reader) throw new ArweaveNodeError('invalid-response');
			const decoder = new TextDecoder();
			let body = '';
			let size = 0;
			try {
				while (true) {
					const chunk = await reader.read();
					if (chunk.done) break;
					size += chunk.value.byteLength;
					if (size > MAX_RESPONSE_BYTES) {
						await reader.cancel();
						throw new ArweaveNodeError('invalid-response');
					}
					body += decoder.decode(chunk.value, { stream: true });
				}
				return body + decoder.decode();
			} finally {
				reader.releaseLock();
			}
		} catch (error) {
			if (signal.aborted) throw new ArweaveNodeError('cancelled');
			if (controller.signal.aborted) throw new ArweaveNodeError('timeout');
			throw error instanceof ArweaveNodeError ? error : new ArweaveNodeError('unavailable');
		} finally {
			clearTimeout(timer);
			signal.removeEventListener('abort', cancel);
			running--;
			waiting.shift()?.();
		}
	}
	async function json(node: string, path: string, signal: AbortSignal): Promise<unknown> {
		const body = await request(node, path, signal);
		try {
			return JSON_PARSER.parse(body);
		} catch {
			throw new ArweaveNodeError('invalid-response');
		}
	}
	async function block(node: string, hash: string, signal: AbortSignal): Promise<NodeBlock> {
		const result = parseBlock(await json(node, `/block/hash/${blockHash(hash)}`, signal));
		if (result.hash !== hash) throw new ArweaveNodeError('invalid-response');
		return result;
	}
	return {
		getInfo: async (node, signal) => parseInfo(await json(node, '/info', signal)),
		getPending: async (node, signal) => parsePending(await json(node, '/tx/pending', signal)),
		getBalance: async (node, address, signal) => {
			if (!checkValidAddress(address)) throw new ArweaveNodeError('invalid-input');
			return integer((await request(node, `/wallet/${address}/balance`, signal)).trim());
		},
		getTransaction: async (node, id, signal) => {
			if (!checkValidAddress(id)) throw new ArweaveNodeError('invalid-input');
			let value: unknown;
			try {
				value = await json(node, `/unconfirmed_tx/${id}`, signal);
			} catch (error) {
				if (!(error instanceof ArweaveNodeError) || error.code !== 'not-found') throw error;
				value = await json(node, `/tx/${id}`, signal);
			}
			return parseTransaction(value, id);
		},
		getBlocks: async (node, anchor, requested, signal) => {
			if (
				!Number.isSafeInteger(anchor.height) ||
				anchor.height < 0 ||
				!Number.isInteger(requested) ||
				requested < 1 ||
				requested > 100
			)
				throw new ArweaveNodeError('invalid-input');
			blockHash(anchor.hash);
			const count = Math.min(requested, anchor.height + 1);
			let hashes: string[] | null = null;
			try {
				const value = await json(node, `/block_index/${anchor.height - count + 1}/${anchor.height}`, signal);
				if (!Array.isArray(value) || value.length !== count) throw new ArweaveNodeError('invalid-response');
				hashes = value.map((entry) => blockHash(typeof entry === 'string' ? entry : record(entry).hash));
				if (new Set(hashes).size !== count) throw new ArweaveNodeError('invalid-response');
				if (hashes[0] !== anchor.hash) throw new ArweaveNodeError('chain-changed');
			} catch (error) {
				if (!(error instanceof ArweaveNodeError) || ![404, 405, 501].includes(error.status)) throw error;
			}
			const blocks: NodeBlock[] = [];
			if (hashes) {
				// Queue-sized batches also bound the number of pending promises.
				for (let i = 0; i < hashes.length; i += CONCURRENCY)
					blocks.push(
						...(await Promise.all(hashes.slice(i, i + CONCURRENCY).map((hash) => block(node, hash, signal))))
					);
			} else {
				let hash = anchor.hash;
				for (let i = 0; i < count; i++) {
					const next = await block(node, hash, signal);
					blocks.push(next);
					hash = next.previous;
				}
			}
			if (
				blocks.some(
					(entry, index) =>
						entry.height !== anchor.height - index || (index > 0 && blocks[index - 1].previous !== entry.hash)
				)
			)
				throw new ArweaveNodeError('chain-changed');
			return blocks;
		},
	};
}
