import { describe, expect, it } from 'vitest';

import { PROCESSES } from '../../src/helpers/config';
import { getMetricsProcessEndpoint, metricsPeerEndpoint } from '../../src/helpers/endpoints';

describe('metrics process endpoint', () => {
	it('computes the metrics key rather than the process root', () => {
		const url = new URL(getMetricsProcessEndpoint(PROCESSES.metrics));

		expect(url.origin).toBe(metricsPeerEndpoint);
		// Computing the root returns the AO envelope, whose snapshot is nested under `metrics`.
		expect(url.pathname).toBe(`/${PROCESSES.metrics}~process@1.0/compute/metrics`);
		expect(url.searchParams.get('require-codec')).toBe('application/json');
		expect(url.searchParams.get('accept-bundle')).toBe('true');
	});

	it.each(['', 'not-an-id', `${PROCESSES.metrics}x`, '../../etc/passwd'])(
		'rejects the invalid process id %j',
		(processId) => {
			expect(() => getMetricsProcessEndpoint(processId)).toThrow();
		}
	);
});
