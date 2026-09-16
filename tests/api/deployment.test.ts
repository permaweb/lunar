import { beforeEach, describe, expect, it, vi } from 'vitest';

const DEPLOYED_TRANSACTION = 'Vr2pbw2scotRdqUNYp-8ZpgMeelhna7S9uVEuka7O_s';
const NAME_TOKEN_PROCESS = 'Y_vgOaIPzRfT24c9rWfOeqtddmd4-E2-0Q3v2ZWLBIU';

/* The adapter shares one lookup per page, so every test starts from a fresh module. */
async function loadDeploymentApi() {
	vi.resetModules();
	return import('../../src/api/deployment');
}

function nameTokenState(overrides: Record<string, unknown> = {}) {
	return {
		device: 'process@1.0',
		'execution-device': 'carrier@1.0',
		name: 'lunar',
		'initial-value': 'UFe_Hr_xbUNgPyBfY6R8IogdlN8zmfQGClMXrfGlFG4',
		'total-supply': '1',
		value: DEPLOYED_TRANSACTION,
		...overrides,
	};
}

function stubStateResponse(state: unknown, init: { ok?: boolean; status?: number } = {}) {
	const fetchMock = vi.fn().mockResolvedValue({
		ok: init.ok ?? true,
		status: init.status ?? 200,
		json: vi.fn().mockResolvedValue(state),
	} as unknown as Response);
	vi.stubGlobal('fetch', fetchMock);

	return fetchMock;
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.unstubAllGlobals();
});

describe('Deployment API adapter', () => {
	it('reads the transaction the name token points at', async () => {
		const fetchMock = stubStateResponse(nameTokenState());
		const { getDeployedTransaction } = await loadDeploymentApi();

		const record = await getDeployedTransaction();

		expect(record).toEqual({
			name: 'lunar',
			process: NAME_TOKEN_PROCESS,
			transactionId: DEPLOYED_TRANSACTION,
		});

		const requestUrl = new URL(fetchMock.mock.calls[0][0] as string);
		expect(requestUrl.origin).toBe('https://arweave.net');
		expect(requestUrl.pathname).toBe(`/${NAME_TOKEN_PROCESS}~process@1.0/now`);
		expect(requestUrl.searchParams.get('require-codec')).toBe('application/json');
		expect(requestUrl.searchParams.get('accept-bundle')).toBe('true');
	});

	it('accepts a target carried beside the reference value', async () => {
		stubStateResponse(nameTokenState({ value: { target: DEPLOYED_TRANSACTION, 'reference-value': 'ignored' } }));
		const { getDeployedTransaction } = await loadDeploymentApi();

		await expect(getDeployedTransaction()).resolves.toMatchObject({ transactionId: DEPLOYED_TRANSACTION });
	});

	it('shares one lookup between callers and exposes the resolved record synchronously', async () => {
		const fetchMock = stubStateResponse(nameTokenState());
		const { getDeployedTransaction, peekDeployedTransaction } = await loadDeploymentApi();

		expect(peekDeployedTransaction()).toBeNull();

		const [first, second] = await Promise.all([getDeployedTransaction(), getDeployedTransaction()]);

		expect(fetchMock).toHaveBeenCalledOnce();
		expect(second).toBe(first);
		expect(peekDeployedTransaction()).toEqual(first);
	});

	it('rejects a process that no longer carries the deployment name', async () => {
		stubStateResponse(nameTokenState({ name: 'not-lunar' }));
		const { getDeployedTransaction } = await loadDeploymentApi();

		await expect(getDeployedTransaction()).rejects.toMatchObject({ code: 'not-found' });
	});

	it('rejects a process that is not a name token', async () => {
		stubStateResponse(nameTokenState({ 'execution-device': 'lua@5.3a' }));
		const { getDeployedTransaction } = await loadDeploymentApi();

		await expect(getDeployedTransaction()).rejects.toMatchObject({ code: 'invalid-response' });
	});

	it.each([['not-a-transaction-id'], ['Vr2pbw2scotRdqUNYp-8ZpgMeelhna7S9uVEuka7O_'], [42], [null], [{}]])(
		'rejects a target that is not a transaction id: %s',
		async (value) => {
			stubStateResponse(nameTokenState({ value }));
			const { getDeployedTransaction } = await loadDeploymentApi();

			await expect(getDeployedTransaction()).rejects.toMatchObject({ code: 'invalid-response' });
		}
	);

	it('rejects a state response that is not JSON', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token <')),
			} as unknown as Response)
		);
		const { getDeployedTransaction } = await loadDeploymentApi();

		await expect(getDeployedTransaction()).rejects.toMatchObject({ code: 'invalid-response' });
	});

	it('normalizes a non-2xx response and retries on the next call', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce({ ok: false, status: 502, json: vi.fn() } as unknown as Response)
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue(nameTokenState()),
			} as unknown as Response);
		vi.stubGlobal('fetch', fetchMock);
		const { getDeployedTransaction } = await loadDeploymentApi();

		await expect(getDeployedTransaction()).rejects.toMatchObject({ code: 'unavailable' });
		await expect(getDeployedTransaction()).resolves.toMatchObject({ transactionId: DEPLOYED_TRANSACTION });
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('normalizes a network failure', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
		const { getDeployedTransaction } = await loadDeploymentApi();

		await expect(getDeployedTransaction()).rejects.toMatchObject({ code: 'unavailable' });
	});

	it('rejects a cancelled lookup', async () => {
		stubStateResponse(nameTokenState());
		const { getDeployedTransaction } = await loadDeploymentApi();
		const controller = new AbortController();

		const request = getDeployedTransaction({ signal: controller.signal });
		controller.abort();

		await expect(request).rejects.toMatchObject({ code: 'cancelled' });
	});
});
