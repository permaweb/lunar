import fc from 'fast-check';
import { beforeEach, expect, it, vi } from 'vitest';

import { AoReadError } from '../../src/api/aoNetwork';
import { getTokenHolders, parseHoldersSnapshot } from '../../src/api/holders';
import { DEFAULT_AO_NODE, PROCESSES } from '../../src/helpers/config';
import { HOLDERS_SNAPSHOT } from '../fixtures/holders';

const mocks = vi.hoisted(() => ({ readJson: vi.fn(), getTransport: vi.fn() }));
vi.mock('api/aoNetwork', async (original) => ({
	...(await original()),
	getAoReadTransport: mocks.getTransport,
}));

beforeEach(() => {
	vi.clearAllMocks();
	mocks.getTransport.mockReturnValue({ readJson: mocks.readJson });
	mocks.readJson.mockImplementation(async (_path, _options, parse) => ({ data: parse(HOLDERS_SNAPSHOT) }));
});

it('reads only the published token snapshot through the configured read-only peer', async () => {
	const controller = new AbortController();
	expect(await getTokenHolders({ signal: controller.signal })).toEqual(parseHoldersSnapshot(HOLDERS_SNAPSHOT));
	expect(mocks.getTransport).toHaveBeenCalledWith({
		peers: [DEFAULT_AO_NODE.url],
		preferPermawebOS: false,
		fallbackToPeers: false,
	});
	expect(mocks.readJson).toHaveBeenCalledExactlyOnceWith(
		`/${PROCESSES.holders}~process@1.0/compute/holders/${PROCESSES.ao}?require-codec=application/json&accept-bundle=true`,
		{ signal: controller.signal, timeoutMs: 15_000 },
		expect.any(Function)
	);
});

it('normalizes the AO envelope and ranks exact integer quantities without mutating the response', () => {
	const holders = [HOLDERS_SNAPSHOT.holders[1], { ...HOLDERS_SNAPSHOT.holders[0], commitments: { transport: {} } }];
	const result = parseHoldersSnapshot({ ...HOLDERS_SNAPSHOT, holders, commitments: { transport: {} }, status: 200 });
	expect(result.holders).toEqual(HOLDERS_SNAPSHOT.holders.slice(0, 2));
	expect(result).not.toHaveProperty('commitments');
	expect(result.holders[0]).not.toHaveProperty('commitments');
	expect(holders[0]).toEqual(HOLDERS_SNAPSHOT.holders[1]);
});

it('preserves and sorts arbitrary large atomic balances, including deterministic ties', () => {
	fc.assert(
		fc.property(fc.bigInt({ min: 0n, max: 2n ** 256n }), fc.bigInt({ min: 0n, max: 2n ** 256n }), (a, b) => {
			const holders = [
				{ address: 'b'.repeat(43), balance: a.toString() },
				{ address: 'a'.repeat(43), balance: b.toString() },
			];
			const result = parseHoldersSnapshot({ ...HOLDERS_SNAPSHOT, holders });
			expect(result.holders.map((holder) => holder.balance).sort()).toEqual([a.toString(), b.toString()].sort());
			expect(BigInt(result.holders[0].balance) >= BigInt(result.holders[1].balance)).toBe(true);
			if (a === b) expect(result.holders[0].address).toBe('a'.repeat(43));
		})
	);
});

it('supports Ethereum AO accounts and empty published snapshots', () => {
	const holders = [{ address: `0x${'a'.repeat(40)}`, balance: '1' }];
	expect(parseHoldersSnapshot({ ...HOLDERS_SNAPSHOT, holders }).holders).toEqual(holders);
	expect(parseHoldersSnapshot({ ...HOLDERS_SNAPSHOT, holders: [], totalHolders: 0 }).holders).toEqual([]);
});

it.each([
	{ schema: 'unknown' },
	{ tokenProcess: 'b'.repeat(43) },
	{ generatedAt: 'invalid' },
	{ denomination: -1 },
	{ denomination: 37 },
	{ lastScannedSlot: -1 },
	{ totalBalances: 1 },
	{ topN: 1 },
	{ totalSupply: 9007199254740993 },
	{ holders: [{ address: '../bad', balance: '1' }] },
	{ holders: [{ address: 'a'.repeat(43), balance: 42 }] },
	{ holders: [{ address: 'a'.repeat(43), balance: '-1' }] },
	{ holders: [{ address: 'a'.repeat(43), balance: '1.5' }] },
	{ holders: [HOLDERS_SNAPSHOT.holders[0], HOLDERS_SNAPSHOT.holders[0]] },
])('rejects malformed or inconsistent holder data: %j', (changes) => {
	expect(() => parseHoldersSnapshot({ ...HOLDERS_SNAPSHOT, ...changes })).toThrow('invalid-response');
});

it('rejects unsafe token IDs before requesting the network', async () => {
	await expect(getTokenHolders({ tokenProcess: '../other' })).rejects.toMatchObject({ code: 'invalid-input' });
	expect(mocks.getTransport).not.toHaveBeenCalled();
});

it('preserves read failures and allows an explicit retry', async () => {
	mocks.readJson.mockRejectedValueOnce(new AoReadError('timeout'));
	await expect(getTokenHolders()).rejects.toMatchObject({ code: 'timeout' });
	await expect(getTokenHolders()).resolves.toHaveProperty('holders', HOLDERS_SNAPSHOT.holders);
});
