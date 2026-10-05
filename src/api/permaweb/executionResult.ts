export type SuccessfulExecutionResult = Record<string, unknown>;

export function isSuccessfulExecutionResult(result: unknown): result is SuccessfulExecutionResult {
	if (!result || typeof result !== 'object' || Array.isArray(result)) return false;
	const execution = result as Record<string, unknown>;
	// Error and Response are failure envelopes; application data remains inside Output or Messages.
	if (execution.Error || execution.Response !== undefined) return false;
	return execution.Output !== undefined || Array.isArray(execution.Messages);
}
