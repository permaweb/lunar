import { NodesApiError } from './types';

export function createRequestQueue(limit: number) {
	let active = 0;
	const pending: Array<() => void> = [];
	return function enqueue<T>(work: () => Promise<T>, signal: AbortSignal): Promise<T> {
		return new Promise((resolve, reject) => {
			if (signal.aborted) return reject(new NodesApiError('cancelled'));
			const cancel = () => {
				const index = pending.indexOf(start);
				if (index !== -1) pending.splice(index, 1);
				reject(new NodesApiError('cancelled'));
			};
			const start = () => {
				signal.removeEventListener('abort', cancel);
				if (signal.aborted) {
					reject(new NodesApiError('cancelled'));
					return;
				}
				active++;
				Promise.resolve()
					.then(work)
					.then(resolve, reject)
					.finally(() => {
						active--;
						pending.shift()?.();
					});
			};
			if (active < limit) start();
			else {
				signal.addEventListener('abort', cancel, { once: true });
				pending.push(start);
			}
		});
	};
}
