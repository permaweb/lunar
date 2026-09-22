import { describe, expect, it } from 'vitest';

import { getAoProcessSummary } from '../../src/helpers/processes';

const OWNER = 'wCSXTL1g1Entfpv5iyPNHxJlk9N6MfhYve2reKFJWTg';

describe('AO process summary', () => {
	it('summarizes a HyperBEAM process that declares its devices in lowercase tags', () => {
		expect(
			getAoProcessSummary({
				owner: { address: OWNER },
				tags: [
					{ name: 'device', value: 'process@1.0' },
					{ name: 'name', value: 'AO Test Token' },
					{ name: 'scheduler-device', value: 'arweave-scheduler@1.0' },
					{ name: 'type', value: 'Process' },
				],
			})
		).toEqual({
			name: 'AO Test Token',
			variant: 'ao.N.1',
			owner: OWNER,
			scheduler: { type: 'device', device: 'arweave-scheduler@1.0' },
		});
	});

	it('summarizes a Legacynet process scheduled by a HyperBEAM scheduler device', () => {
		expect(
			getAoProcessSummary({
				owner: { address: OWNER },
				tags: [
					{ name: 'Name', value: '_AO_' },
					{ name: 'Variant', value: 'ao.TN.1' },
					{ name: 'Scheduler-Device', value: 'scheduler@1.0' },
					{ name: 'Scheduler', value: '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA' },
				],
			})
		).toMatchObject({ name: '_AO_', variant: 'ao.TN.1', scheduler: { type: 'device', device: 'scheduler@1.0' } });
	});

	it('names the legacy scheduler unit for a Legacynet process without a scheduler device', () => {
		expect(
			getAoProcessSummary({
				tags: [
					{ name: 'Variant', value: 'ao.TN.1' },
					{ name: 'Scheduler', value: '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA' },
				],
			}).scheduler
		).toEqual({ type: 'legacy' });
	});

	it('leaves unknown fields empty instead of guessing', () => {
		expect(
			getAoProcessSummary({ tags: [{ name: 'Scheduler', value: '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA' }] })
		).toEqual({ name: null, variant: null, owner: null, scheduler: null });
		expect(getAoProcessSummary(null)).toEqual({ name: null, variant: null, owner: null, scheduler: null });
	});
});
