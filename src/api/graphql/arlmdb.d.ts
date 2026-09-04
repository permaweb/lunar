declare module 'arlmdb.js' {
	export interface Index {
		id: string;
		close(): void;
	}
	export interface Event {
		type: string;
		count?: number;
		exact?: boolean;
	}
	export function openIndex(options: {
		id: string;
		gateway: string;
		chunkSources?: string[];
		fetcher?: typeof fetch;
	}): Promise<Index>;
	export function plan(query: string, variables?: Record<string, unknown>): unknown;
	export function execute(
		index: Index,
		query: string,
		options?: { variables?: Record<string, unknown>; onEvent?: (event: Event) => void }
	): { result: Promise<unknown>; cancel(): void };
}
