import { getGraphQLEndpoint } from 'api/graphql';

import { checkValidAddress } from 'helpers/utils';

export type NetworkActivityEntry = {
	id: string;
	network: 'arweave' | 'ao';
	kind: 'block' | 'transaction' | 'message' | 'process';
	timestamp: number | null;
	dataSize: string | null;
	height?: number;
};

const TRANSACTION_FIELDS = 'edges { node { id tags { name value } data { size } block { timestamp } } }';
const QUERY = `query HomeNetworkActivity {
	blocks(first: 6, sort: HEIGHT_DESC) { edges { node { id height timestamp } } }
	transactions(first: 6, sort: HEIGHT_DESC) { ${TRANSACTION_FIELDS} }
	messages: transactions(first: 6, sort: HEIGHT_DESC, tags: [
		{ name: "Data-Protocol", values: ["ao"] }, { name: "Type", values: ["Message"] }
	]) { ${TRANSACTION_FIELDS} }
	processes: transactions(first: 6, sort: HEIGHT_DESC, tags: [
		{ name: "Data-Protocol", values: ["ao"] }, { name: "Type", values: ["Process"] }
	]) { ${TRANSACTION_FIELDS} }
}`;

function record(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid-response');
	return value as Record<string, unknown>;
}

function timestamp(value: unknown): number {
	if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('invalid-response');
	return value;
}

function dataSize(value: unknown): string | null {
	if (typeof value === 'string' && /^\d+$/.test(value)) return value;
	if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return String(value);
	return null;
}

export function parseNetworkActivity(payload: unknown): NetworkActivityEntry[] {
	const envelope = record(payload);
	if (envelope.errors) throw new Error('unavailable');
	const data = record(envelope.data);
	const entries = new Map<string, NetworkActivityEntry>();
	for (const source of ['blocks', 'transactions', 'messages', 'processes']) {
		const edges = record(data[source]).edges;
		if (!Array.isArray(edges)) throw new Error('invalid-response');
		for (const edge of edges) {
			const node = record(record(edge).node);
			if (typeof node.id !== 'string') throw new Error('invalid-response');
			if (source === 'blocks') {
				if (!/^[a-zA-Z0-9_-]{64}$/.test(node.id)) throw new Error('invalid-response');
				entries.set(node.id, {
					id: node.id,
					height: timestamp(node.height),
					timestamp: timestamp(node.timestamp),
					network: 'arweave',
					kind: 'block',
					dataSize: null,
				});
				continue;
			}
			if (!checkValidAddress(node.id) || !Array.isArray(node.tags)) throw new Error('invalid-response');
			const tags = node.tags.map((tag) => {
				const parsed = record(tag);
				if (typeof parsed.name !== 'string' || typeof parsed.value !== 'string') throw new Error('invalid-response');
				return { name: parsed.name.toLowerCase(), value: parsed.value.toLowerCase() };
			});
			const isAo = tags.some((tag) => tag.name === 'data-protocol' && tag.value === 'ao');
			const type = tags.find((tag) => tag.name === 'type')?.value;
			const kind = isAo && (type === 'message' || type === 'process') ? type : 'transaction';
			entries.set(node.id, {
				id: node.id,
				timestamp: node.block ? timestamp(record(node.block).timestamp) : null,
				network: isAo ? 'ao' : 'arweave',
				kind,
				dataSize: node.data ? dataSize(record(node.data).size) : null,
			});
		}
	}
	return [...entries.values()].sort(
		(a, b) =>
			(b.timestamp ?? Number.MAX_SAFE_INTEGER) - (a.timestamp ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id)
	);
}

export async function getNetworkActivity(signal: AbortSignal): Promise<NetworkActivityEntry[]> {
	const response = await fetch(getGraphQLEndpoint(), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query: QUERY }),
		signal,
	});
	if (!response.ok) throw new Error('unavailable');
	return parseNetworkActivity(await response.json());
}
