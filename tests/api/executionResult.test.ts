import { expect, it } from 'vitest';

import { isSuccessfulExecutionResult } from '../../src/api/permaweb';

it.each([null, undefined, 'unavailable', {}, [], { Response: 'unavailable' }, { message: 'Compute in progress' }])(
	'rejects missing and unavailable execution results: %j',
	(result) => expect(isSuccessfulExecutionResult(result)).toBe(false)
);

it('rejects execution errors even when the response includes output fields', () => {
	expect(isSuccessfulExecutionResult({ Output: {}, Messages: [], Error: 'Execution failed' })).toBe(false);
	expect(isSuccessfulExecutionResult({ Output: {}, Messages: [], Response: 'unavailable' })).toBe(false);
});

it.each([{ Output: '' }, { Output: {}, Messages: [], Error: null }, { Messages: [] }])(
	'accepts successful empty output: %j',
	(result) => expect(isSuccessfulExecutionResult(result)).toBe(true)
);

it('preserves application data that contains its own response or error fields', () => {
	expect(isSuccessfulExecutionResult({ Output: { Response: 'unavailable', Error: 'domain value' } })).toBe(true);
});
