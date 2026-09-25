import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';

import {
	messageJson,
	parseAoCoreMessage,
	readAoCoreMessage,
	readAoCoreValue,
	readCommitments,
} from '../../src/api/aoCore';
import { createAoReadTransport } from '../../src/api/aoNetwork';
import { DEFAULT_AO_NETWORK } from '../../src/helpers/aoNetwork';

const id = 'a'.repeat(43);
const parse = (value: unknown, context = false) => parseAoCoreMessage(JSON.stringify(value), id, {}, context);
const json = (text: string) => new Response(text, { headers: { 'content-type': 'application/json' } });
const transportFor = (fetcher: typeof fetch) =>
	createAoReadTransport({ ...DEFAULT_AO_NETWORK, fallbackToPeers: false }, { injected: () => fetcher });

describe('recognition and decoding', () => {
	it.each([
		{ Type: 'Message' },
		{ signature: 'sig1=:abc:', 'signature-input': 'sig1=("body")' },
		{ body: { device: 'process@1.0' } },
		{ commitments: { one: { signature: 'a' } } },
	])('does not confuse generic metadata or nested payloads with AO evidence: %j', (value) => {
		expect(parse(value).evidence).toEqual([]);
	});
	it.each([
		[{ 'Data-Protocol': 'ao' }, 'protocol'],
		[{ variant: 'ao.N.1' }, 'variant'],
		[{ Variant: 'ao.TN.1' }, 'variant'],
		[{ device: 'process@1.0' }, 'device'],
		[{ commitments: { one: { 'commitment-device': 'httpsig@1.0' } } }, 'commitment'],
	] as const)('recognizes AO metadata without verifying it', (value, evidence) => {
		expect(parse(value).evidence).toContain(evidence);
	});
	it('permits an explicit AO context only after validating a message map', () => {
		expect(parse({ body: 'ordinary data' }, true).evidence).toEqual(['context']);
		expect(() => parse([], true)).toThrow();
		expect(() => parse('message', true)).toThrow();
	});
	it('preserves the received representation, selected ID and exact integer precision', () => {
		const raw =
			'{ "device":"process@1.0", "quantity":900719925474099312345, "body":{"commitments":{"child":{"signature":"original"}}}}';
		const result = parseAoCoreMessage(raw, id, { server: 'HyperBEAM', signature: 'transport-only' });
		expect(result.requestedId).toBe(id);
		expect(result.message.quantity).toBe(900719925474099312345n);
		expect(result.rawText).toBe(raw);
		expect(result.message.body).toEqual({ commitments: { child: { signature: 'original' } } });
		expect(result.message).not.toHaveProperty('server');
		expect(result.message).not.toHaveProperty('signature');
		expect(messageJson(result.message)).toContain('900719925474099312345');
	});
	it('accepts long decimal values and preserves large integers written with exponents', () => {
		const raw = '{"decimal":0.12345678901234567,"integer":1e25,"small":42,"negative":-1e20}';
		const result = parseAoCoreMessage(raw, id);
		expect(result.message).toEqual({
			decimal: 0.12345678901234567,
			integer: 10n ** 25n,
			small: 42,
			negative: -(10n ** 20n),
		});
		expect(result.rawText).toBe(raw);
	});
	it.each([
		'null',
		'[]',
		'<html>bad gateway</html>',
		'{"device":1,"device":2}',
		'{"__proto__":{"polluted":true}}',
		'{"body":{"constructor":{}}}',
	])('rejects invalid or unsafe maps', (value) => {
		expect(() => parseAoCoreMessage(value, id)).toThrow('invalid-response');
	});
	it('bounds nesting and preserves arbitrary safe scalar values', () => {
		let value: unknown = 'deep';
		for (let index = 0; index < 66; index++) value = { child: value };
		expect(() => parse(value)).toThrow();
		fc.assert(
			fc.property(fc.string(), fc.bigInt({ min: 2n ** 54n, max: 2n ** 100n }), (body, quantity) => {
				const raw = messageJson({ body, quantity });
				const result = parseAoCoreMessage(raw, id);
				expect(result.message).toEqual({ body, quantity });
			})
		);
	});
});

describe('commitment boundaries', () => {
	it('keeps each commitment’s identity, algorithm and coverage together', () => {
		const original = {
			device: 'process@1.0',
			'body+link': 'b'.repeat(43),
			commitments: {
				first: {
					'commitment-device': 'httpsig@1.0',
					type: 'rsa-pss-sha512',
					committer: 'first-committer',
					committed: ['device'],
					signature: 'first-signature',
				},
				second: {
					'commitment-device': 'custom@1.0',
					type: 'custom',
					committer: 'second-committer',
					committed: ['body+link'],
					signature: 'second-signature',
				},
			},
		};
		const result = parse(original);
		expect(result.message).toEqual(original);
		expect(result.commitments[0]).toMatchObject({
			id: 'first',
			committer: 'first-committer',
			algorithm: 'rsa-pss-sha512',
			coverage: ['device'],
			verification: 'not-checked',
		});
		expect(result.commitments[1]).toMatchObject({
			id: 'second',
			committer: 'second-committer',
			coverage: ['body+link'],
			verification: 'unsupported',
		});
		expect(result.commitments[0].coverage).not.toContain('body+link');
	});
	it('does not invent coverage or derive an address by truncating key material', () => {
		const entries = readCommitments({
			commitments: {
				missing: { 'commitment-device': 'httpsig@1.0', keyid: 'publickey:' + 'x'.repeat(512) },
				malformed: { committed: 'body' },
				empty: { committed: [] },
			},
		});
		expect(entries.map((entry) => entry.coverage)).toEqual([null, null, []]);
		expect(entries[0].committer).toBeUndefined();
	});
	it('does not present an unsigned HMAC as a public signer', () => {
		const [entry] = readCommitments({
			commitments: {
				unsigned: {
					'commitment-device': 'httpsig@1.0',
					type: 'hmac-sha256',
					keyid: 'constant:ao',
					committer: 'misleading',
				},
			},
		});
		expect(entry.kind).toBe('unsigned');
		expect(entry.committer).toBeUndefined();
		expect(entry.verification).toBe('not-checked');
	});
});

describe('stored-message reads', () => {
	it.each(['[1,2]', '900719925474099312345', '"linked text"', 'null'])(
		'loads linked values without requiring a message map: %s',
		async (raw) => {
			const result = await readAoCoreValue(transportFor(vi.fn(async () => json(raw))), id);
			expect(result.data.rawText).toBe(raw);
		}
	);
	it('accepts an empty message in explicit AO exploration context', () => {
		expect(parse({}, true).evidence).toEqual(['context']);
	});
	it('reads only the opened cache ID and leaves links unloaded', async () => {
		const raw = JSON.stringify({ device: 'process@1.0', 'body+link': 'b'.repeat(43) });
		const fetcher = vi.fn(async () => json(raw));
		const result = await readAoCoreMessage(transportFor(fetcher), id);
		expect(fetcher).toHaveBeenCalledTimes(1);
		expect(fetcher.mock.calls[0][0]).toBe(`/~cache@1.0/read=${id}?require-codec=json%401.0&accept-bundle=false`);
		expect(result.data.rawText).toBe(raw);
		expect(result.source).toBe('permawebos');
	});
	it('rejects unsupported content, oversized responses and unsafe paths', async () => {
		await expect(
			readAoCoreMessage(transportFor(vi.fn(async () => new Response('{"device":"process@1.0"}'))), id)
		).rejects.toMatchObject({ code: 'invalid-response' });
		await expect(
			readAoCoreMessage(transportFor(vi.fn(async () => json('x'.repeat(4 * 1024 * 1024 + 1)))), id)
		).rejects.toMatchObject({ code: 'invalid-response' });
		const fetcher = vi.fn();
		await expect(readAoCoreMessage(transportFor(fetcher), '../now')).rejects.toMatchObject({ code: 'invalid-input' });
		expect(fetcher).not.toHaveBeenCalled();
	});
	it('cancels a pending read', async () => {
		const controller = new AbortController();
		const fetcher = vi.fn(() => new Promise<Response>(() => {}));
		const pending = readAoCoreMessage(transportFor(fetcher), id, { signal: controller.signal });
		controller.abort();
		await expect(pending).rejects.toMatchObject({ code: 'cancelled' });
	});
});
