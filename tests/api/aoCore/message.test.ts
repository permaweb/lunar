import { expect, it } from 'vitest';

import { parseAoCoreMessage } from '../../../src/api/aoCore';
import { LUNAR_BALANCES_LINK, LUNAR_LINK_PROCESS } from '../../fixtures/aoLinks';

it('recognizes a linked device URI and preserves its received representation', () => {
	const device = `ao:${LUNAR_BALANCES_LINK}`;
	const result = parseAoCoreMessage(JSON.stringify({ device }), LUNAR_LINK_PROCESS);
	expect(result.device).toBe(device);
	expect(result.deviceSource).toBe('linked');
	expect(result.evidence).toContain('device');
	expect(result.message).toEqual({ device });
});

it('does not recognize malformed URI text as a linked device', () => {
	const result = parseAoCoreMessage(JSON.stringify({ device: `ao:${LUNAR_BALANCES_LINK}/now` }), LUNAR_LINK_PROCESS);
	expect(result.deviceSource).toBe('explicit');
	expect(result.evidence).not.toContain('device');
});
