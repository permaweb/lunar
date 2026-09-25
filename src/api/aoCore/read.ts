import { AoReadError, type AoReadResult, type getAoReadTransport } from 'api/aoNetwork';

import { AO_READ_TIMEOUT_MS } from 'helpers/config';
import { checkValidAddress } from 'helpers/utils';

import { parseAoCoreMessage, parseAoCoreValue } from './message';
import type { AoCoreReadResult, AoCoreValue } from './types';

const MAX_MESSAGE_BYTES = 4 * 1024 * 1024;

export async function readAoCoreMessage(
	transport: ReturnType<typeof getAoReadTransport>,
	id: string,
	options: { signal?: AbortSignal; context?: boolean } = {}
): Promise<AoCoreReadResult> {
	return readDocument(transport, id, options, (text, headers) =>
		parseAoCoreMessage(text, id, headers, options.context)
	);
}

export function readAoCoreValue(
	transport: ReturnType<typeof getAoReadTransport>,
	id: string,
	options: { signal?: AbortSignal } = {}
): Promise<AoReadResult<AoCoreValue>> {
	return readDocument(transport, id, options, (rawText, headers) => ({
		value: parseAoCoreValue(rawText),
		rawText,
		headers,
	}));
}

async function readDocument<T>(
	transport: ReturnType<typeof getAoReadTransport>,
	id: string,
	options: { signal?: AbortSignal },
	parse: (text: string, headers: Record<string, string>) => T
): Promise<AoReadResult<T>> {
	if (!checkValidAddress(id)) throw new AoReadError('invalid-input');
	// Read the stored message without resolving its device or running /now /compute.
	// Linked values remain links; opening one is a separate, explicit read.
	const path = `/~cache@1.0/read=${id}?require-codec=json%401.0&accept-bundle=false`;
	return transport.readResponse(
		path,
		async (response) => {
			if (!response.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
				throw new AoReadError('invalid-response');
			const reader = response.body?.getReader();
			if (!reader) throw new AoReadError('invalid-response');
			const decoder = new TextDecoder('utf-8', { fatal: true });
			let bytes = 0;
			let text = '';
			try {
				while (true) {
					const chunk = await reader.read();
					if (chunk.done) break;
					bytes += chunk.value.byteLength;
					if (bytes > MAX_MESSAGE_BYTES) throw new AoReadError('invalid-response');
					text += decoder.decode(chunk.value, { stream: true });
				}
				text += decoder.decode();
				return parse(text, Object.fromEntries(response.headers.entries()));
			} catch (error) {
				throw error instanceof AoReadError ? error : new AoReadError('invalid-response');
			} finally {
				await reader.cancel();
			}
		},
		{ signal: options.signal, timeoutMs: AO_READ_TIMEOUT_MS, headers: { 'require-codec': 'application/json' } }
	);
}
