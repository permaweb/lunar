export function createRequestQueue(limit: number, createCancelledError: () => Error) {
	let active = 0;
	const pending: Array<() => void> = [];
	return function enqueue<T>(work: () => Promise<T>, signal: AbortSignal): Promise<T> {
		return new Promise((resolve, reject) => {
			if (signal.aborted) return reject(createCancelledError());
			const cancel = () => {
				const index = pending.indexOf(start);
				if (index !== -1) pending.splice(index, 1);
				reject(createCancelledError());
			};
			const start = () => {
				signal.removeEventListener('abort', cancel);
				if (signal.aborted) {
					reject(createCancelledError());
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
