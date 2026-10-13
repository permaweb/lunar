import { requestRemote } from 'api/http';

import { checkValidAddress } from 'helpers/utils';

export type TransactionIndexResult =
	| { status: 'available' | 'missing'; response: string }
	| { status: 'error'; code: 'invalid-input' | 'invalid-response' | 'unavailable' | 'timeout' | 'cancelled' };

/** The same ID lookup is used by the availability check and the editable playground. */
export function getTransactionIndexQuery(id: string): string {
	return `query TransactionById {
    transactions(ids: [${JSON.stringify(id)}], first: 1) {
        edges {
            node {
                id
                recipient
                tags { name value }
                owner { address }
                block { height timestamp }
                data { size type }
                fee { winston ar }
                quantity { winston ar }
            }
        }
    }
}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export async function readTransactionIndex(args: {
	id: string;
	endpoint: string;
	signal?: AbortSignal;
}): Promise<TransactionIndexResult> {
	if (!checkValidAddress(args.id)) return { status: 'error', code: 'invalid-input' };
	if (args.signal?.aborted) return { status: 'error', code: 'cancelled' };

	const controller = new AbortController();
	const handleAbort = () => controller.abort();
	args.signal?.addEventListener('abort', handleAbort, { once: true });
	let hasTimedOut = false;
	const timeout = setTimeout(() => {
		hasTimedOut = true;
		controller.abort();
	}, 15000);

	try {
		const response = await requestRemote(args.endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'Codec-Device': 'json@1.0' },
			body: JSON.stringify({ query: getTransactionIndexQuery(args.id) }),
			signal: controller.signal,
		});
		if (!response.ok) return { status: 'error', code: 'unavailable' };
		const payload: unknown = await response.json();
		if (
			!isRecord(payload) ||
			(payload.errors !== undefined && (!Array.isArray(payload.errors) || payload.errors.length > 0)) ||
			!isRecord(payload.data) ||
			!isRecord(payload.data.transactions) ||
			!Array.isArray(payload.data.transactions.edges)
		) {
			return { status: 'error', code: 'invalid-response' };
		}
		const edges = payload.data.transactions.edges;
		if (edges.some((edge) => !isRecord(edge) || !isRecord(edge.node) || edge.node.id !== args.id)) {
			return { status: 'error', code: 'invalid-response' };
		}
		return { status: edges.length > 0 ? 'available' : 'missing', response: JSON.stringify(payload, null, 2) };
	} catch (error) {
		return {
			status: 'error',
			code: hasTimedOut
				? 'timeout'
				: controller.signal.aborted
				? 'cancelled'
				: error instanceof SyntaxError
				? 'invalid-response'
				: 'unavailable',
		};
	} finally {
		clearTimeout(timeout);
		args.signal?.removeEventListener('abort', handleAbort);
	}
}
