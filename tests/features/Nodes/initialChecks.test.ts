import { afterEach, expect, it, vi } from 'vitest';

import type { NodesApi } from '../../../src/api/nodes';
import { checkInitialNodes } from '../../../src/features/Nodes/model/initialChecks';

const peers = Array.from({ length: 20 }, (_, index) => ({
	address: `8.8.8.${index + 1}:1984`,
	ip: `8.8.8.${index + 1}`,
	port: 1984,
}));
afterEach(() => vi.useRealTimers());
it('bounds the initial wait and cancels all eight outstanding checks', async () => {
	vi.useFakeTimers();
	const signals: AbortSignal[] = [];
	const api = {
		getInfo: vi.fn(
			(_peer, signal: AbortSignal) =>
				new Promise((_resolve, reject) => {
					signals.push(signal);
					signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true });
				})
		),
	} as unknown as NodesApi;
	const onChecking = vi.fn();
	const pending = checkInitialNodes(api, peers, [], new AbortController().signal, vi.fn(), onChecking);
	expect(onChecking).toHaveBeenLastCalledWith(peers.slice(0, 8).map((peer) => peer.address));
	await vi.advanceTimersByTimeAsync(60_000);
	expect(await pending).toBe('timeout');
	expect(signals).toHaveLength(8);
	expect(signals.every((signal) => signal.aborted)).toBe(true);
	expect(onChecking).toHaveBeenLastCalledWith([]);
});
it('stops after repeated service failures instead of attempting the entire peer list', async () => {
	const api = { getInfo: vi.fn().mockRejectedValue(new Error('service unavailable')) } as unknown as NodesApi;
	const onChecking = vi.fn();
	expect(await checkInitialNodes(api, peers, [], new AbortController().signal, vi.fn(), onChecking)).toBe(
		'service-unavailable'
	);
	expect(api.getInfo).toHaveBeenCalledTimes(10);
	expect(onChecking).toHaveBeenLastCalledWith([]);
});
