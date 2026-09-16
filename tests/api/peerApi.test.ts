import { afterEach, expect, it, vi } from 'vitest';

import { createPeerApi, createPermawebApis } from '../../src/api/permaweb';
import { DEFAULT_AO_NETWORK } from '../../src/helpers/aoNetwork';
import { AO_STATE_READ_TIMEOUT_MS } from '../../src/helpers/config';
import { MessageVariantEnum } from '../../src/helpers/types';
import { resolvePermawebApi } from '../../src/helpers/utils';

const mocks = vi.hoisted(() => ({
	connect: vi.fn(() => ({})),
	init: vi.fn(() => ({ readState: vi.fn() })),
	readJson: vi.fn(),
	readText: vi.fn(),
	readHeaders: vi.fn(),
}));
vi.mock('@permaweb/aoconnect', () => ({ connect: mocks.connect, createSigner: vi.fn() }));
vi.mock('@permaweb/libs', () => ({ default: { init: mocks.init } }));
vi.mock('api/aoNetwork', async (original) => ({
	...(await original()),
	getAoReadTransport: () => ({ readJson: mocks.readJson, readText: mocks.readText, readHeaders: mocks.readHeaders }),
}));
afterEach(() => vi.clearAllMocks());
const processId = '_206v3RtEU-mvPIIu0gtPnBZ9SoS7MlxQn2Yk-kPzcU';

it('reads /now headers without creating an SDK mainnet connection or requesting the whole JSON state', async () => {
	mocks.readHeaders.mockImplementation(async (_path, _init, parse) => ({
		data: parse(new Headers({ name: '0x1' })),
		provider: 'https://charlie.example',
		source: 'fallback',
	}));
	const api = createPeerApi(DEFAULT_AO_NETWORK, null);
	const controller = new AbortController();
	const onProgress = vi.fn();
	expect(await api.readStateWithSource({ processId, hydrate: true, signal: controller.signal, onProgress })).toEqual({
		data: { name: '0x1' },
		provider: 'https://charlie.example',
		source: 'fallback',
	});
	expect(mocks.readHeaders).toHaveBeenCalledWith(
		`/${processId}~process@1.0/now`,
		expect.objectContaining({
			signal: expect.any(AbortSignal),
			timeoutMs: AO_STATE_READ_TIMEOUT_MS,
		}),
		expect.any(Function)
	);
	expect(onProgress).toHaveBeenCalledWith(
		expect.objectContaining({ data: { name: '0x1' }, completedLinks: 0, totalLinks: 0 })
	);
	expect(mocks.readJson).not.toHaveBeenCalled();
	expect(mocks.connect).not.toHaveBeenCalled();
});

it('preserves compute path reads used by network metrics', async () => {
	mocks.readHeaders.mockImplementation(async (_path, _init, parse) => ({
		data: parse(new Headers({ messages: '10000000000000000001' })),
	}));
	const api = createPeerApi(DEFAULT_AO_NETWORK, null);
	expect(await api.readState({ processId, hydrate: false, path: 'metrics', appendPath: true })).toEqual({
		messages: '10000000000000000001',
	});
	expect(mocks.readHeaders).toHaveBeenCalledWith(
		`/${processId}~process@1.0/compute/metrics`,
		expect.any(Object),
		expect.any(Function)
	);
});

it('uses the same peer transport for schedules, linked state, results, and unsigned dry runs', async () => {
	mocks.readJson.mockImplementation(async (_path, _init, parse) => ({
		data: parse ? parse({ raw: { Output: { data: 'ok' } } }) : { edges: [] },
	}));
	mocks.readText.mockImplementation(async (_path, _init, parse) => ({ data: parse('3') }));
	const api = createPeerApi(DEFAULT_AO_NETWORK, null);
	expect(await api.readLatestSlot(processId)).toBe(3);
	await api.readSchedule({ processId, from: 0, to: 3 });
	await api.readLinkedState(processId);
	expect(await api.ao.result({ process: processId, message: '3' })).toMatchObject({ Output: { data: 'ok' } });
	await api.ao.dryrun({ process: processId, tags: [{ name: 'Action', value: 'A&B' }] });
	expect(mocks.readJson.mock.calls.map(([path]) => path)).toEqual([
		`/${processId}~process@1.0/schedule?accept=application/aos-2&from=0&to=3`,
		`/~cache@1.0/read=${processId}?require-codec=json%401.0&accept-bundle=true`,
		`/${processId}~process@1.0/compute/results=3`,
		`/${processId}~process@1.0/as=execution/compute&Action=A%26B`,
	]);
	expect(mocks.connect).not.toHaveBeenCalled();
});

it('keeps the selected node connection under aosApi, never the Explorer API', () => {
	const apis = createPermawebApis({ wallet: null, node: { url: 'https://aos.example', authority: 'authority' } });
	expect(mocks.connect).toHaveBeenCalledWith(expect.objectContaining({ MODE: 'mainnet', URL: 'https://aos.example' }));
	expect(apis).toHaveProperty('aosApi');
	expect(apis).not.toHaveProperty('mainnetApi');
	const mainnetApi = createPeerApi(DEFAULT_AO_NETWORK, null);
	const permawebProvider = { ...apis, mainnetApi };
	expect(resolvePermawebApi({ variant: MessageVariantEnum.Mainnet, permawebProvider })).toBe(mainnetApi);
	expect(resolvePermawebApi({ variant: MessageVariantEnum.Mainnet, permawebProvider, forAos: true })).toBe(apis.aosApi);
	expect(resolvePermawebApi({ variant: MessageVariantEnum.Legacynet, permawebProvider })).toBe(apis.legacyApi);
});

it('rejects invalid IDs before making network requests', async () => {
	const api = createPeerApi(DEFAULT_AO_NETWORK, null);
	await expect(api.readState({ processId: '../other' })).rejects.toMatchObject({ code: 'invalid-input' });
	await expect(api.readLinkedState('bad')).rejects.toMatchObject({ code: 'invalid-input' });
	expect(mocks.readJson).not.toHaveBeenCalled();
	expect(mocks.readHeaders).not.toHaveBeenCalled();
});
