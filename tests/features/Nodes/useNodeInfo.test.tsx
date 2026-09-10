// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';

import { nodesApi } from '../../../src/api/nodes';
import { useNodeInfo } from '../../../src/features/Nodes/hooks/useNodeInfo';

vi.mock('api/nodes', () => ({ nodesApi: { getInfo: vi.fn() } }));
afterEach(() => {
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});

it('loads only visible rows, cancels hidden work, and ignores a superseded response', async () => {
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
	const observers: Array<{ callback: IntersectionObserverCallback; disconnected: boolean }> = [];
	vi.stubGlobal(
		'IntersectionObserver',
		class {
			entry: (typeof observers)[number];
			constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit) {
				expect(options.rootMargin).toBe('0px');
				this.entry = { callback, disconnected: false };
				observers.push(this.entry);
			}
			observe() {}
			disconnect() {
				this.entry.disconnected = true;
			}
		}
	);
	const pending: Array<{ signal: AbortSignal; resolve: (value: unknown) => void }> = [];
	vi.mocked(nodesApi.getInfo).mockImplementation(
		(_peer, signal) => new Promise((resolve) => pending.push({ signal, resolve }))
	);
	const onObservation = vi.fn();
	function Row(props: { address: string }) {
		const result = useNodeInfo(
			{ address: props.address, ip: props.address.split(':')[0], port: 1984 },
			true,
			undefined,
			onObservation
		);
		return (
			<tr ref={result.ref}>
				<td>{result.state.status === 'success' ? result.state.data.checkedAt : result.state.status}</td>
			</tr>
		);
	}
	const container = document.createElement('div');
	document.body.append(container);
	const root = createRoot(container);
	const emit = async (visible: boolean) =>
		React.act(async () =>
			observers[0].callback([{ isIntersecting: visible } as IntersectionObserverEntry], {} as IntersectionObserver)
		);
	try {
		await React.act(async () =>
			root.render(
				<table>
					<tbody>
						<Row address={'8.8.8.8:1984'} />
						<Row address={'9.9.9.9:1984'} />
					</tbody>
				</table>
			)
		);
		expect(nodesApi.getInfo).not.toHaveBeenCalled();
		await emit(true);
		expect(nodesApi.getInfo).toHaveBeenCalledTimes(1);
		expect(container.textContent).toBe('loadingidle');
		await emit(false);
		expect(pending[0].signal.aborted).toBe(true);
		await emit(true);
		expect(nodesApi.getInfo).toHaveBeenCalledTimes(2);
		await React.act(async () => pending[1].resolve({ peer: '8.8.8.8:1984', checkedAt: 2000, status: 'unavailable' }));
		await React.act(async () => pending[0].resolve({ peer: '8.8.8.8:1984', checkedAt: 1000, status: 'unavailable' }));
		expect(container.textContent).toBe('2000idle');
	} finally {
		await React.act(async () => root.unmount());
		container.remove();
	}
	expect(observers.every((observer) => observer.disconnected)).toBe(true);
});
