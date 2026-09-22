import fc from 'fast-check';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { requestRemote } from '../../src/api/http';
import { getTransactionBody, lookupTransaction, readTransactionData } from '../../src/api/transactions';
import {
	BUNDLE_HEADERS,
	BUNDLE_ID,
	committedMessageHeaders,
	EMPTY_TRANSFER_HEADERS,
	EMPTY_TRANSFER_ID,
	EMPTY_TRANSFER_OWNER,
	HYPERBUDDY_HTML,
	MESSAGE_ID,
	TOKEN_PROCESS_ID,
} from '../fixtures/transactionData';

vi.mock('api/http', () => ({ requestRemote: vi.fn() }));

const respond = (body: BodyInit | null, headers: Record<string, string>, status = 200) =>
	vi.mocked(requestRemote).mockResolvedValue(new Response(body, { status, headers }));

afterEach(() => {
	vi.resetAllMocks();
});

describe('transaction body classification', () => {
	it.each([
		['an unsigned gateway response', { 'content-type': 'application/json' }, 'raw'],
		['a signed message with a committed body', committedMessageHeaders(), 'committed'],
		['a signed bundle', BUNDLE_HEADERS, 'bundle'],
		['a signed message without data', EMPTY_TRANSFER_HEADERS, 'none'],
	])('classifies %s', (_, headers, body) => {
		expect(getTransactionBody(new Headers(headers))).toBe(body);
	});
});

describe('direct transaction lookup', () => {
	it('records a 0-byte transaction as empty instead of adopting the node page metadata', async () => {
		respond(HYPERBUDDY_HTML, EMPTY_TRANSFER_HEADERS);

		const response = await lookupTransaction(EMPTY_TRANSFER_ID);

		expect(requestRemote).toHaveBeenCalledWith(`https://arweave.net/${EMPTY_TRANSFER_ID}`, { redirect: 'follow' });
		expect(response.node.data).toEqual({ size: '0', type: undefined });
		expect(response.node.recipient).toBe(TOKEN_PROCESS_ID);
		expect(response.node.owner.address).toBe(EMPTY_TRANSFER_OWNER);
		// Signed headers stay visible as tags alongside the original tags.
		expect(response.node.tags.map((tag) => tag.name)).toEqual([
			'action',
			'recipient',
			'quantity',
			'signing-client',
			'signing-client-version',
			'anchor',
			'reward',
			'target',
		]);
	});

	it('keeps the committed body size and content type', async () => {
		respond('1984', committedMessageHeaders({ 'content-type': 'application/json', 'content-length': '4' }));

		expect((await lookupTransaction(MESSAGE_ID)).node.data).toEqual({ size: '4', type: 'application/json' });
	});

	it('leaves the size and type of a bundle unknown', async () => {
		respond(HYPERBUDDY_HTML, { ...BUNDLE_HEADERS, 'content-length': String(HYPERBUDDY_HTML.length) });

		expect((await lookupTransaction(BUNDLE_ID)).node.data).toEqual({ size: undefined, type: undefined });
	});

	it('returns null when the gateway has no such message', async () => {
		respond('Not found', { 'content-type': 'text/html' }, 404);

		expect(await lookupTransaction(EMPTY_TRANSFER_ID)).toBeNull();
	});
});

describe('transaction data', () => {
	it('returns empty data for a recorded size of zero without requesting the body', async () => {
		expect(await readTransactionData({ txId: EMPTY_TRANSFER_ID, knownSize: '0' })).toEqual({ status: 'empty' });
		expect(requestRemote).not.toHaveBeenCalled();
	});

	it('never reads the node web UI served for a message without data', async () => {
		const response = new Response(HYPERBUDDY_HTML, { headers: EMPTY_TRANSFER_HEADERS });
		vi.mocked(requestRemote).mockResolvedValue(response);

		expect(await readTransactionData({ txId: EMPTY_TRANSFER_ID })).toEqual({ status: 'empty' });
		expect(response.bodyUsed).toBe(false);
	});

	it('rejects the node web UI when the transaction records data', async () => {
		respond(HYPERBUDDY_HTML, EMPTY_TRANSFER_HEADERS);

		expect(await readTransactionData({ txId: EMPTY_TRANSFER_ID, knownSize: '5666' })).toEqual({
			status: 'error',
			code: 'invalid-response',
		});
	});

	it('rejects the node web UI served for a bundle', async () => {
		respond(HYPERBUDDY_HTML, BUNDLE_HEADERS);

		expect(await readTransactionData({ txId: BUNDLE_ID })).toEqual({ status: 'error', code: 'invalid-response' });
	});

	it('returns a committed body with the declared content type', async () => {
		respond('{"x":1}', committedMessageHeaders({ 'content-type': 'text/plain' }));

		expect(await readTransactionData({ txId: MESSAGE_ID, knownSize: '7', contentType: 'application/json' })).toEqual({
			status: 'content',
			text: '{"x":1}',
			contentType: 'application/json',
		});
		expect(vi.mocked(requestRemote).mock.calls[0][0]).toBe(`https://arweave.net/${MESSAGE_ID}`);
	});

	it('falls back to the committed content type when the transaction declares none', async () => {
		respond('<p>hi</p>', committedMessageHeaders({ 'content-type': 'text/html' }));

		expect(await readTransactionData({ txId: MESSAGE_ID })).toEqual({
			status: 'content',
			text: '<p>hi</p>',
			contentType: 'text/html',
		});
	});

	it('treats a committed zero-length body as empty', async () => {
		respond(null, committedMessageHeaders());

		expect(await readTransactionData({ txId: MESSAGE_ID })).toEqual({ status: 'empty' });
	});

	it('accepts a body only when its length matches the recorded size', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.string({ unit: 'binary-ascii', maxLength: 64 }),
				fc.integer({ min: -2, max: 2 }),
				async (text, offset) => {
					const knownSize = Math.max(0, text.length + offset);
					respond(text, committedMessageHeaders());

					const result = await readTransactionData({ txId: MESSAGE_ID, knownSize: String(knownSize) });

					if (knownSize === 0) expect(result).toEqual({ status: 'empty' });
					else if (text.length === knownSize) expect(result).toMatchObject({ status: 'content', text });
					else expect(result).toEqual({ status: 'error', code: 'invalid-response' });
				}
			)
		);
	});

	it('rejects an unsigned HTML page for a transaction that does not declare HTML', async () => {
		respond(HYPERBUDDY_HTML, { 'content-type': 'text/html; charset=utf-8' });

		expect(await readTransactionData({ txId: EMPTY_TRANSFER_ID, contentType: 'application/json' })).toEqual({
			status: 'error',
			code: 'invalid-response',
		});
	});

	it('returns an unsigned HTML body for a transaction that declares HTML', async () => {
		respond('<p>hi</p>', { 'content-type': 'text/html' });

		expect(await readTransactionData({ txId: EMPTY_TRANSFER_ID, knownSize: 9, contentType: 'text/html' })).toEqual({
			status: 'content',
			text: '<p>hi</p>',
			contentType: 'text/html',
		});
	});

	it('returns the index a path manifest resolves to, whose size differs from the manifest', async () => {
		respond(HYPERBUDDY_HTML, committedMessageHeaders({ 'content-type': 'text/html' }));

		expect(
			await readTransactionData({
				txId: MESSAGE_ID,
				knownSize: '633',
				contentType: 'application/x.arweave-manifest+json',
			})
		).toMatchObject({ status: 'content', text: HYPERBUDDY_HTML });
	});

	it.each([
		[404, 'not-found'],
		[502, 'unavailable'],
	])('maps a %i response to %s', async (status, code) => {
		respond('Gateway page', { 'content-type': 'text/html' }, status);

		expect(await readTransactionData({ txId: MESSAGE_ID })).toEqual({ status: 'error', code });
	});

	it('maps a network failure to unavailable', async () => {
		vi.mocked(requestRemote).mockRejectedValue(new TypeError('Failed to fetch'));

		expect(await readTransactionData({ txId: MESSAGE_ID })).toEqual({ status: 'error', code: 'unavailable' });
	});

	it('maps an aborted request to cancelled and forwards the signal', async () => {
		const controller = new AbortController();
		controller.abort();
		vi.mocked(requestRemote).mockRejectedValue(new DOMException('Aborted', 'AbortError'));

		expect(await readTransactionData({ txId: MESSAGE_ID, signal: controller.signal })).toEqual({
			status: 'error',
			code: 'cancelled',
		});
		expect(vi.mocked(requestRemote).mock.calls[0][1]).toEqual({ signal: controller.signal });
	});

	it.each(['', 'short', `${'a'.repeat(42)}!`])(
		'rejects the malformed transaction id %j without a request',
		async (txId) => {
			expect(await readTransactionData({ txId })).toEqual({ status: 'error', code: 'invalid-input' });
			expect(requestRemote).not.toHaveBeenCalled();
		}
	);
});
