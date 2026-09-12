import type { NodeBlock } from 'api/arweaveNode';

export function formatNodeAmount(value: string | null, denomination = 1): string {
	if (value === null) return '—';
	if (denomination > 1) return `${BigInt(value).toLocaleString()} Winston (${denomination})`;
	const amount = BigInt(value);
	const whole = (amount / 1_000_000_000_000n).toLocaleString();
	const fraction = (amount % 1_000_000_000_000n).toString().padStart(12, '0').replace(/0+$/, '');
	const separator = new Intl.NumberFormat().formatToParts(1.1).find((part) => part.type === 'decimal')?.value ?? '.';
	return `${whole}${fraction ? separator + fraction : ''} AR`;
}

export function formatNodeRewardTotal(value: string, denomination = 1): string {
	if (denomination > 1) return formatNodeAmount(value, denomination);
	// Round in Winston before formatting so large totals never lose integer precision.
	const hundredths = (BigInt(value) + 5_000_000_000n) / 10_000_000_000n;
	const whole = (hundredths / 100n).toLocaleString();
	const fraction = (hundredths % 100n).toString().padStart(2, '0');
	const separator = new Intl.NumberFormat().formatToParts(1.1).find((part) => part.type === 'decimal')?.value ?? '.';
	return `${whole}${separator}${fraction} AR`;
}

export function toNodeBlockEdge(block: NodeBlock) {
	return {
		cursor: block.hash,
		node: {
			id: block.hash,
			height: block.height,
			timestamp: block.timestamp,
			previous: block.previous,
			transactionCount: block.transactions,
			metadata: {
				indep_hash: block.hash,
				previous_block: block.previous,
				timestamp: block.timestamp,
				reward_addr: block.miner,
				block_size: block.dataSize,
				reward: block.reward,
			},
		},
	};
}

export function sumMiningRewards(blocks: NodeBlock[]) {
	const totals = new Map<number, bigint>();
	const seen = new Set<string>();
	let incomplete = false;
	for (const block of blocks) {
		if (!block.miner || seen.has(block.hash)) continue;
		seen.add(block.hash);
		if (block.reward === null) incomplete = true;
		else totals.set(block.denomination, (totals.get(block.denomination) ?? 0n) + BigInt(block.reward));
	}
	return {
		incomplete,
		amounts: [...totals]
			.sort(([a], [b]) => a - b)
			.map(([denomination, total]) => ({ denomination, value: total.toString() })),
	};
}
