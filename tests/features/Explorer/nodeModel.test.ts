import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import {
	formatNodeAmount,
	formatNodeRewardTotal,
	getIndexedMiners,
	getNodeTransactionPage,
	mergeNodeHistory,
	observeMempool,
	sumMiningRewards,
} from '../../../src/features/Explorer/model/node';
import { getArweaveNodeRoute, normalizeArweaveNode, readArweaveNodeRoute } from '../../../src/helpers/arweaveNode';
import { hash, nodeBlock } from '../../fixtures/arweaveNode';

describe('node explorer models', () => {
	it('rounds reward totals to two decimal places without losing large integer precision', () => {
		expect(formatNodeRewardTotal('0')).toBe('0.00 AR');
		expect(formatNodeRewardTotal('1234567890123')).toBe('1.23 AR');
		expect(formatNodeRewardTotal('1995000000000')).toBe('2.00 AR');
		expect(formatNodeRewardTotal('9007199254740993123456780000')).toBe('9,007,199,254,740,993.12 AR');
		expect(formatNodeRewardTotal('1234', 2)).toBe('1,234 Winston (2)');
	});
	it('sums rewards exactly without counting duplicate blocks or unclaimed rewards', () => {
		const block = { ...nodeBlock(10), reward: '900719925474099312345678' };
		expect(
			sumMiningRewards([
				block,
				block,
				{ ...nodeBlock(9), reward: '1' },
				{ ...nodeBlock(8), miner: null },
				{ ...nodeBlock(7), reward: null },
				{ ...nodeBlock(6), reward: '2', denomination: 2 },
			])
		).toEqual({
			incomplete: true,
			amounts: [
				{ denomination: 1, value: '900719925474099312345679' },
				{ denomination: 2, value: '2' },
			],
		});
	});
	it('paginates transactions across block boundaries, including empty blocks and shortened history', () => {
		const blocks = [
			{ ...nodeBlock(10), transactions: 20 },
			{ ...nodeBlock(9), transactions: 0 },
			{ ...nodeBlock(8), transactions: 13 },
		];
		expect(getNodeTransactionPage(blocks, 0)).toMatchObject({
			count: 33,
			totalPages: 2,
			currentPage: 0,
			segments: [
				{ block: blocks[0], offset: 0, count: 20 },
				{ block: blocks[2], offset: 0, count: 5 },
			],
		});
		expect(getNodeTransactionPage(blocks, 1).segments).toEqual([{ block: blocks[2], offset: 5, count: 8 }]);
		expect(getNodeTransactionPage(blocks.slice(0, 1), 1).currentPage).toBe(0);
		expect(getNodeTransactionPage([], 5)).toEqual({ count: 0, totalPages: 1, currentPage: 0, segments: [] });
		fc.assert(
			fc.property(fc.array(fc.integer({ min: 0, max: 100 }), { maxLength: 30 }), (counts) => {
				const history = counts.map((transactions, index) => ({ ...nodeBlock(counts.length - index), transactions }));
				const first = getNodeTransactionPage(history, 0);
				const sizes = Array.from({ length: first.totalPages }, (_, page) =>
					getNodeTransactionPage(history, page).segments.reduce((total, segment) => total + segment.count, 0)
				);
				expect(sizes.reduce((a, b) => a + b, 0)).toBe(counts.reduce((a, b) => a + b, 0));
				expect(sizes.every((size) => size <= 25)).toBe(true);
			})
		);
	});
	it('round trips node URLs and IPv6 through encoded explorer routes', () => {
		for (const node of ['http://8.8.8.8:1984', 'https://node.example', 'http://[2606:4700::1111]:1984']) {
			expect(getArweaveNodeRoute(node, 'miners')).toBe(`/explorer/${encodeURIComponent(node)}/miners`);
			expect(readArweaveNodeRoute(getArweaveNodeRoute(node, 'miners'))).toEqual({ node, subPath: '/miners' });
			expect(readArweaveNodeRoute(`/explorer/arweave-node/${encodeURIComponent(node)}/miners`)).toEqual({
				node,
				subPath: '/miners',
			});
		}
		expect(normalizeArweaveNode('8.8.8.8:1984')).toBe('http://8.8.8.8:1984');
		for (const input of [
			'https://user:pass@node.example',
			'ftp://node.example',
			'https://node.example/info',
			'https://node.example?x=1',
			'a'.repeat(43),
			'b'.repeat(64),
			'123456',
		])
			expect(normalizeArweaveNode(input)).toBeNull();
		for (const path of ['/explorer/', '/explorer/' + 'a'.repeat(43), '/explorer/123456', '/explorer/%broken'])
			expect(readArweaveNodeRoute(path)).toBeNull();
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
