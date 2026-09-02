import { afterEach, describe, expect, it, vi } from 'vitest';

import { requestRemote } from '../../src/api/http';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('HTTP adapter', () => {
	it('forwards request input and options through the API boundary', async () => {
		const expectedResponse = { ok: true } as Response;
		const fetchMock = vi.fn().mockResolvedValue(expectedResponse);
		vi.stubGlobal('fetch', fetchMock);
		const options = { method: 'POST', body: 'payload' };

		const response = await requestRemote('https://example.test/data', options);

		expect(response).toBe(expectedResponse);
		expect(fetchMock).toHaveBeenCalledWith('https://example.test/data', options);
	});
});
