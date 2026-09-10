import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import {
	formatNodeAmount,
	getIndexedMiners,
	mergeNodeHistory,
	observeMempool,
} from '../../../src/features/Explorer/model/node';
import { getArweaveNodeRoute, normalizeArweaveNode, readArweaveNodeRoute } from '../../../src/helpers/arweaveNode';
import { hash, nodeBlock } from '../../fixtures/arweaveNode';

describe('node explorer models', () => {
	it('round trips node URLs and IPv6 through encoded explorer routes', () => {
		for (const node of ['http://8.8.8.8:1984', 'https://node.example', 'http://[2606:4700::1111]:1984']) {
			expect(readArweaveNodeRoute(getArweaveNodeRoute(node, 'miners'))).toEqual({ node, subPath: '/miners' });
		}
		expect(normalizeArweaveNode('8.8.8.8:1984')).toBe('http://8.8.8.8:1984');
		for (const input of [
			'https://user:pass@node.example',
			'ftp://node.example',
			'https://node.example/info',
			'https://node.example?x=1',
		])
			expect(normalizeArweaveNode(input)).toBeNull();
	});
	it('preserves arbitrary Winston values when formatting AR', () => {
		fc.assert(
			fc.property(fc.bigInt({ min: 0n, max: 10n ** 35n }), (amount) => {
				const formatted = formatNodeAmount(String(amount));
				const [whole, decimal = ''] = formatted.replaceAll(',', '').replace(' AR', '').split('.');
				expect(BigInt(whole + decimal.padEnd(12, '0'))).toBe(amount);
			})
		);
	});
	it('deduplicates refreshed history, aggregates all miners and replaces a reorganized suffix', () => {
		const old = [nodeBlock(10), nodeBlock(9, 'b'.repeat(43)), nodeBlock(8)];
		const merged = mergeNodeHistory(old, [nodeBlock(11), nodeBlock(10)]);
		expect(merged.map((block) => block.height)).toEqual([11, 10, 9, 8]);
		expect(getIndexedMiners(merged).map((miner) => [miner.address, miner.count, miner.last.height])).toEqual([
			['a'.repeat(43), 3, 11],
			['b'.repeat(43), 1, 9],
		]);
		const fork = [{ ...nodeBlock(10), hash: 'z'.repeat(64), previous: hash(9) }];
		expect(mergeNodeHistory(old, fork)).toHaveLength(3);
		expect(mergeNodeHistory(old, [{ ...nodeBlock(10), previous: 'q'.repeat(64) }])).toHaveLength(1);
		expect(mergeNodeHistory(old, [nodeBlock(8)])).toEqual([nodeBlock(8)]);
	});
	it('tracks mempool changes against the previous successful observation', () => {
		const first = observeMempool(null, ['a', 'b'], 1);
		const next = observeMempool(first, ['b', 'c'], 2);
		expect(first.isBaseline).toBe(true);
		expect(next).toMatchObject({ firstSeen: { b: 1, c: 2 }, added: ['c'], removed: ['a'], isBaseline: false });
	});
});
