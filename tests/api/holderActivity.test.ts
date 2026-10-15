import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { setGraphQLEndpoint } from '../../src/api/graphql';
import { getLatestHolderTransactions } from '../../src/api/holders';
import { requestRemote } from '../../src/api/http';
import { DEFAULT_GRAPHQL_ENDPOINT } from '../../src/helpers/config';

vi.mock('api/http', () => ({ requestRemote: vi.fn() }));
const address = 'w'.repeat(43);
const other = 'x'.repeat(43);
const firstId = 'a'.repeat(43);
const secondId = 'b'.repeat(43);
let endpoint: string;
let testNumber = 0;
const connection = (id: string | null) => ({ edges: id ? [{ node: { id } }] : [] });
const response = (data: unknown) => ({ ok: true, json: async () => ({ data }) } as Response);
function emptyResponse(init?: RequestInit) {
	const query = JSON.parse(String(init?.body)).query;
	return response(
		Object.fromEntries(
			[...query.matchAll(/(incoming\d+|outgoing\d+|latest\d+):/g)].map((match) => [match[1], connection(null)])
		)
	);
}

beforeEach(() => {
	vi.resetAllMocks();
	endpoint = `https://index-${testNumber++}.example/graphql`;
	setGraphQLEndpoint(endpoint);
	vi.mocked(requestRemote).mockImplementation(async (_url, init) => emptyResponse(init));
});
afterEach(() => {
	setGraphQLEndpoint(DEFAULT_GRAPHQL_ENDPOINT);
	vi.useRealTimers();
});

it('batches incoming and owner-sent transactions of any type without AO tag or process-message lookups', async () => {
	await expect(getLatestHolderTransactions({ addresses: [address, other, address] })).resolves.toEqual({
		[address]: { status: 'empty' },
		[other]: { status: 'empty' },
	});
	expect(requestRemote).toHaveBeenCalledOnce();
	const [url, init] = vi.mocked(requestRemote).mock.calls[0];
	expect(url).toBe(endpoint);
	expect(init.method).toBe('POST');
	expect(init.signal).toBeInstanceOf(AbortSignal);
	const query = JSON.parse(String(init.body)).query;
	expect(query.match(/transactions\(/g)).toHaveLength(4);
	expect(query).toContain(`recipients:["${address}"]`);
	expect(query).toContain(`owners:["${address}"]`);
	expect(query).not.toContain('tags:');
	expect(query).not.toContain('From-Process');
	expect(query).not.toContain('process0:');
});

it('uses the index ordering to choose between directions, including transactions within the same block', async () => {
	vi.mocked(requestRemote)
		.mockResolvedValueOnce(response({ incoming0: connection(firstId), outgoing0: connection(secondId) }))
		.mockResolvedValueOnce(response({ latest0: connection(secondId) }));
	await expect(getLatestHolderTransactions({ addresses: [address] })).resolves.toEqual({
		[address]: { status: 'found', transactionId: secondId },
	});
	const query = JSON.parse(String(vi.mocked(requestRemote).mock.calls[1][1].body)).query;
	expect(query).toContain('sort:HEIGHT_DESC');
	expect(query).toContain(`ids:["${firstId}","${secondId}"]`);
});

it('does not need a merge query when only one direction has a transaction', async () => {
	vi.mocked(requestRemote).mockResolvedValueOnce(
		response({ incoming0: connection(firstId), outgoing0: connection(null) })
	);
	await expect(getLatestHolderTransactions({ addresses: [address] })).resolves.toEqual({
		[address]: { status: 'found', transactionId: firstId },
	});
	expect(requestRemote).toHaveBeenCalledOnce();
});

it('caches reads per gateway, expires them and never caches errors', async () => {
	vi.useFakeTimers();
	await getLatestHolderTransactions({ addresses: [address] });
	await getLatestHolderTransactions({ addresses: [address] });
	expect(requestRemote).toHaveBeenCalledTimes(1);
	await vi.advanceTimersByTimeAsync(60_001);
	await getLatestHolderTransactions({ addresses: [address] });
	expect(requestRemote).toHaveBeenCalledTimes(2);
	setGraphQLEndpoint('https://another-index.example/graphql');
	vi.mocked(requestRemote).mockRejectedValueOnce(new Error('offline'));
	await expect(getLatestHolderTransactions({ addresses: [address] })).resolves.toEqual({
		[address]: { status: 'error' },
	});
	await expect(getLatestHolderTransactions({ addresses: [address] })).resolves.toEqual({
		[address]: { status: 'empty' },
	});
	expect(requestRemote).toHaveBeenCalledTimes(4);
});

it('keeps valid wallets when a neighboring response is malformed', async () => {
	vi.mocked(requestRemote).mockResolvedValueOnce(
		response({
			incoming0: connection('../bad'),
			outgoing0: connection(null),
			incoming1: connection(secondId),
			outgoing1: connection(null),
		})
	);
	await expect(getLatestHolderTransactions({ addresses: [address, other] })).resolves.toEqual({
		[address]: { status: 'error' },
		[other]: { status: 'found', transactionId: secondId },
	});
});

it.each([
	{ errors: [{ message: 'unavailable' }], data: {} },
	{ data: {}, extensions: { warnings: [{ code: 'PARTIAL_RESULT' }] } },
	{ data: { incoming0: null, outgoing0: connection(null) } },
])('distinguishes index failures from an empty history: %j', async (payload) => {
	vi.mocked(requestRemote).mockResolvedValueOnce({ ok: true, json: async () => payload } as Response);
	await expect(getLatestHolderTransactions({ addresses: [address] })).resolves.toEqual({
		[address]: { status: 'error' },
	});
});

it('rejects an unexpected ID returned by the merge lookup', async () => {
	vi.mocked(requestRemote)
		.mockResolvedValueOnce(response({ incoming0: connection(firstId), outgoing0: connection(secondId) }))
		.mockResolvedValueOnce(response({ latest0: connection('z'.repeat(43)) }));
	await expect(getLatestHolderTransactions({ addresses: [address] })).resolves.toEqual({
		[address]: { status: 'error' },
	});
});

it('bounds concurrency and publishes each completed batch progressively', async () => {
	const wallets = Array.from({ length: 25 }, (_, index) => String(index).padStart(43, 'w'));
	const pending: { init: RequestInit; resolve: (response: Response) => void }[] = [];
	vi.mocked(requestRemote).mockImplementation(
		(_url, init) => new Promise((resolve) => pending.push({ init, resolve }))
	);
	const onUpdate = vi.fn();
	const reading = getLatestHolderTransactions({ addresses: wallets, onUpdate });
	await vi.waitFor(() => expect(pending).toHaveLength(2));
	pending[0].resolve(emptyResponse(pending[0].init));
	await vi.waitFor(() => expect(pending).toHaveLength(3));
	expect(Object.keys(onUpdate.mock.calls.at(-1)[0])).toHaveLength(10);
	pending[1].resolve(emptyResponse(pending[1].init));
	pending[2].resolve(emptyResponse(pending[2].init));
	expect(Object.keys(await reading)).toHaveLength(25);
	expect(onUpdate).toHaveBeenCalledTimes(4);
	expect(requestRemote).toHaveBeenCalledTimes(3);
});

it('cancels the active request and does not publish or cache late results', async () => {
	const controller = new AbortController();
	const onUpdate = vi.fn();
	vi.mocked(requestRemote).mockImplementationOnce(
		(_url, init) =>
			new Promise((_resolve, reject) =>
				init.signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true })
			)
	);
	const reading = getLatestHolderTransactions({ addresses: [address], signal: controller.signal, onUpdate });
	await vi.waitFor(() => expect(requestRemote).toHaveBeenCalledOnce());
	controller.abort();
	await expect(reading).rejects.toMatchObject({ code: 'cancelled' });
	expect(onUpdate).toHaveBeenCalledExactlyOnceWith({});
	await getLatestHolderTransactions({ addresses: [address] });
	expect(requestRemote).toHaveBeenCalledTimes(2);
});

it('limits independent visible-row lookups to four and removes cancelled rows from the queue', async () => {
	const wallets = Array.from({ length: 6 }, (_, index) => String(index).padStart(43, 'v'));
	const controllers = wallets.map(() => new AbortController());
	const pending: { init: RequestInit; resolve: (response: Response) => void }[] = [];
	vi.mocked(requestRemote).mockImplementation(
		(_url, init) =>
			new Promise((resolve, reject) => {
				pending.push({ init, resolve });
				init.signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true });
			})
	);
	const requests = wallets.map((address, index) =>
		getLatestHolderTransactions({ addresses: [address], signal: controllers[index].signal })
	);
	await vi.waitFor(() => expect(pending).toHaveLength(4));
	const cancelled = expect(requests[5]).rejects.toMatchObject({ code: 'cancelled' });
	controllers[5].abort();
	await cancelled;
	pending[1].resolve(emptyResponse(pending[1].init));
	await expect(requests[1]).resolves.toEqual({ [wallets[1]]: { status: 'empty' } });
	await vi.waitFor(() => expect(pending).toHaveLength(5));
	for (const request of pending) request.resolve(emptyResponse(request.init));
	await Promise.all(requests.slice(0, 5));
	expect(requestRemote).toHaveBeenCalledTimes(5);
});

it('times out a stalled index lookup without claiming no transactions exist', async () => {
	vi.useFakeTimers();
	vi.mocked(requestRemote).mockImplementationOnce(
		(_url, init) =>
			new Promise((_resolve, reject) =>
				init.signal.addEventListener('abort', () => reject(new Error('timeout')), { once: true })
			)
	);
	const reading = getLatestHolderTransactions({ addresses: [address] });
	await vi.advanceTimersByTimeAsync(15_000);
	await expect(reading).resolves.toEqual({ [address]: { status: 'error' } });
});

it('validates input and distinguishes unsupported Ethereum accounts from an empty history', async () => {
	await expect(getLatestHolderTransactions({ addresses: ['../bad'] })).rejects.toMatchObject({ code: 'invalid-input' });
	await expect(getLatestHolderTransactions({ addresses: Array(101).fill(address) })).rejects.toMatchObject({
		code: 'invalid-input',
	});
	await expect(getLatestHolderTransactions({ addresses: [] })).resolves.toEqual({});
	expect(requestRemote).not.toHaveBeenCalled();
	const ethereum = `0x${'a'.repeat(40)}`;
	await expect(getLatestHolderTransactions({ addresses: [ethereum] })).resolves.toEqual({
		[ethereum]: { status: 'unsupported' },
	});
	expect(requestRemote).not.toHaveBeenCalled();
});
