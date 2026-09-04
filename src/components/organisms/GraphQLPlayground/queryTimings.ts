export type QueryTiming = {
	id: number;
	startedAt: number;
	durationMs: number;
	gateway: string;
	queryName: string | null;
	status: 'success' | 'failed' | 'cancelled';
};

export const QUERY_TIMINGS_PAGE_SIZE = 20;

export function formatQueryDuration(durationMs: number): string {
	const milliseconds = Math.max(0, Math.round(durationMs));
	return `${Math.floor(milliseconds / 1000)}s ${milliseconds % 1000}ms`;
}
