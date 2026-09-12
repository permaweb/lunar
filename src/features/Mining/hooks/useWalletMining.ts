import React from 'react';

import type { CachedNodeHistory } from 'api/arweaveNode';
import { arweaveNodeApi, getCachedNodeHistories } from 'api/arweaveNode';

import { DEFAULT_GATEWAYS } from 'helpers/config';

const MAINNET_NODE = new URL(DEFAULT_GATEWAYS.arweave).origin;
const sourceId = (entry: CachedNodeHistory) => JSON.stringify([entry.node, entry.network]);
type Rewards = { status: 'loading' } | { status: 'ready'; value: string | null } | { status: 'error' };
const LOADING: Rewards = { status: 'loading' };

export function useWalletMining(address: string, isActive: boolean, refreshKey = 0) {
	const [index, setIndex] = React.useState<{ address: string; histories: CachedNodeHistory[] } | null>(null);
	const [selected, setSelected] = React.useState<string | null>(null);
	const [revision, setRevision] = React.useState(0);
	const [knownMiner, setKnownMiner] = React.useState<string | null>(null);
	const [rewardResult, setRewardResult] = React.useState<{ address: string; node: string; rewards: Rewards } | null>(
		null
	);
	const histories = index?.address === address ? index.histories : null;
	React.useEffect(() => {
		if (!isActive) return;
		let cancelled = false;
		void getCachedNodeHistories().then((entries) => {
			if (cancelled) return;
			const matches = entries
				.filter((entry) => entry.blocks.some((block) => block.miner === address))
				.sort((a, b) => b.savedAt - a.savedAt);
			setIndex({ address, histories: matches });
			if (matches.length) setKnownMiner(address);
			setSelected((previous) =>
				matches.some((entry) => sourceId(entry) === previous) ? previous : matches[0] ? sourceId(matches[0]) : null
			);
		});
		return () => {
			cancelled = true;
		};
	}, [address, revision, isActive, refreshKey]);
	const history = histories?.find((entry) => sourceId(entry) === selected);
	const node = history?.node ?? MAINNET_NODE;
	const rewards = rewardResult?.address === address && rewardResult.node === node ? rewardResult.rewards : LOADING;
	React.useEffect(() => {
		if (!isActive || histories === null) return;
		const controller = new AbortController();
		setRewardResult({ address, node, rewards: LOADING });
		void arweaveNodeApi
			.getPendingRewards(node, address, controller.signal)
			.then((value) => {
				if (controller.signal.aborted) return;
				setRewardResult({ address, node, rewards: { status: 'ready', value } });
				if (value !== null && BigInt(value) > 0n) setKnownMiner(address);
			})
			.catch(() => {
				if (!controller.signal.aborted) setRewardResult({ address, node, rewards: { status: 'error' } });
			});
		return () => controller.abort();
	}, [address, node, histories === null, revision, isActive, refreshKey]);
	React.useEffect(() => {
		if (!isActive) return;
		const timer = setInterval(() => {
			if (!document.hidden) setRevision((value) => value + 1);
		}, 60_000);
		return () => clearInterval(timer);
	}, [isActive]);
	return {
		history,
		histories,
		node,
		rewards,
		selected,
		isMiner: !!history || knownMiner === address,
		options: histories?.map((entry) => ({ id: sourceId(entry), label: `${entry.node} · ${entry.network}` })) ?? [],
		onSelect: setSelected,
		refresh: () => setRevision((value) => value + 1),
	};
}

export type WalletMiningState = ReturnType<typeof useWalletMining>;
