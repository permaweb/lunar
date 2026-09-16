import { connect, createSigner } from '@permaweb/aoconnect';

import { AoReadError, getAoReadTransport } from 'api/aoNetwork';

import type { AoNetworkSettings } from 'helpers/aoNetwork';
import { AO_STATE_READ_TIMEOUT_MS } from 'helpers/config';

import { type ArweaveSchedulePage, type ArweaveSchedulePageArgs, createArweaveScheduleReader } from './arweaveSchedule';
import type { PermawebApi } from './index';
import { linkedStatePath, type ProcessStateProgress, type ProcessStateResult, readProcessState } from './processState';

type StateArgs = {
	processId: string;
	hydrate?: boolean;
	path?: string;
	appendPath?: boolean;
	signal?: AbortSignal;
	onProgress?: (progress: ProcessStateProgress) => void;
};
type JsonRecord = Record<string, unknown>;

export interface PeerApi {
	ao: PermawebApi['ao'];
	readState(args: StateArgs): Promise<unknown>;
	readStateWithSource(args: StateArgs): Promise<ProcessStateResult>;
	readLatestSlot(processId: string, signal?: AbortSignal): Promise<number>;
	readArweaveSchedulePage(args: ArweaveSchedulePageArgs): Promise<ArweaveSchedulePage>;
	readSchedule(args: { processId: string; from: number; to: number; signal?: AbortSignal }): Promise<unknown>;
	readLinkedState(id: string, signal?: AbortSignal): Promise<unknown>;
}

const JSON_HEADERS = { 'require-codec': 'application/json', 'accept-bundle': 'true' };
const ID = /^[A-Za-z0-9_-]{43}$/;

function processPath(processId: string) {
	if (!ID.test(processId)) throw new AoReadError('invalid-input');
	return `/${processId}~process@1.0`;
}

function record(value: unknown): JsonRecord {
	if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AoReadError('invalid-response');
	return value as JsonRecord;
}

function unwrap(value: unknown): JsonRecord {
	const envelope = record(value);
	return typeof envelope.body === 'object' && envelope.body !== null ? record(envelope.body) : envelope;
}

function parseOutput(value: unknown) {
	const envelope = unwrap(value);
	let output = envelope.raw ?? envelope;
	if (envelope.results && typeof envelope.results === 'object') {
		const results = record(envelope.results);
		if (results.json && typeof results.json === 'object') output = record(results.json).body ?? output;
	}
	if (typeof output === 'string') output = JSON.parse(output);
	const body = record(output);
	return { Output: {}, Messages: [], Assignments: [], Spawns: [], ...body };
}

export function createPeerApi(settings: AoNetworkSettings, wallet: unknown): PeerApi {
	const transport = getAoReadTransport(settings);
	const readStateWithSource = async (args: StateArgs): Promise<ProcessStateResult> => {
		let path = `${processPath(args.processId)}/${args.hydrate === false ? 'compute' : 'now'}`;
		if (args.path && args.appendPath) path += `/${args.path.split('/').map(encodeURIComponent).join('/')}`;
		return readProcessState(transport, path, {
			signal: args.signal,
			onProgress: args.onProgress,
			field: args.path && !args.appendPath ? args.path : undefined,
			// Bound the complete traversal while allowing an extension attempt and peer failover.
			timeoutMs: AO_STATE_READ_TIMEOUT_MS * (settings.peers.length + 1),
		});
	};
	const readLatestSlot = async (processId: string, signal?: AbortSignal) => {
		const response = await transport.readText(`${processPath(processId)}/slot/current`, { signal }, (value) => {
			const slot = Number(value.trim());
			if (!value.trim() || !Number.isSafeInteger(slot) || slot < -1) throw new AoReadError('invalid-response');
			return slot;
		});
		return response.data;
	};
	const result = async (args: Record<string, unknown>) => {
		const slot = String(args.slot ?? args.message ?? '');
		if (!/^\d+$/.test(slot) && !ID.test(slot)) throw new AoReadError('invalid-input');
		const response = await transport.readJson(
			`${processPath(String(args.process))}/compute/results=${slot}`,
			{ headers: JSON_HEADERS, signal: args.signal as AbortSignal | undefined },
			parseOutput
		);
		return response.data;
	};
	// Explorer writes use a separate, explicit peer connection. Never fail over or replay signed writes.
	let writer: ReturnType<typeof connect>;
	const getWriter = () => {
		if (!wallet) throw new AoReadError('invalid-input');
		writer ??= connect({ MODE: 'mainnet', URL: settings.peers[0], signer: createSigner(wallet as any) });
		return writer;
	};
	return {
		readStateWithSource,
		readState: async (args) => {
			const result = await readStateWithSource(args);
			// Data-only consumers cannot display a continuation; do not imply their state is complete.
			if (result.loadMore) throw new AoReadError('invalid-response');
			return result.data;
		},
		readLatestSlot,
		readArweaveSchedulePage: createArweaveScheduleReader(transport, readLatestSlot),
		readSchedule: async (args) => {
			if (![args.from, args.to].every((slot) => Number.isSafeInteger(slot) && slot >= 0) || args.from > args.to)
				throw new AoReadError('invalid-input');
			const response = await transport.readJson(
				`${processPath(args.processId)}/schedule?accept=application/aos-2&from=${args.from}&to=${args.to}`,
				{ signal: args.signal },
				record
			);
			return response.data;
		},
		readLinkedState: async (id, signal) => {
			return (await transport.readJson(linkedStatePath(id), { signal, timeoutMs: AO_STATE_READ_TIMEOUT_MS })).data;
		},
		ao: {
			result,
			results: async (args) => {
				const slot = await readLatestSlot(String(args.process));
				if (slot < 0) return { edges: [] };
				return { edges: [{ cursor: String(slot), node: await result({ ...args, slot }) }] };
			},
			dryrun: async (args) => {
				const tags = args.tags as { name: string; value: string }[] | undefined;
				if (
					tags &&
					(!Array.isArray(tags) ||
						!tags.every((tag) => typeof tag?.name === 'string' && typeof tag?.value === 'string'))
				)
					throw new AoReadError('invalid-input');
				const fields = (tags ?? []).map((tag) => `${encodeURIComponent(tag.name)}=${encodeURIComponent(tag.value)}`);
				if (args.data !== undefined) fields.push(`data=${encodeURIComponent(String(args.data))}`);
				const response = await transport.readJson(
					`${processPath(String(args.process))}/as=execution/compute${fields.length ? `&${fields.join('&')}` : ''}`,
					{ headers: JSON_HEADERS, signal: args.signal as AbortSignal | undefined },
					parseOutput
				);
				return response.data;
			},
			message: (args) => getWriter().message(args),
		},
	};
}
