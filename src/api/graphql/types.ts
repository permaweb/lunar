export type GraphQLSource = 'ar-lmdb' | 'remote';

export type GraphQLRequest = {
	query: string;
	variables?: Record<string, unknown>;
	operationName?: string;
	gateway?: string;
	source?: GraphQLSource;
	signal?: AbortSignal;
};

export type GraphQLError = {
	message: string;
	path?: (string | number)[];
	extensions?: Record<string, unknown>;
};

export type GraphQLResponse<T = Record<string, unknown>> = {
	data?: T | null;
	errors?: GraphQLError[];
	extensions?: Record<string, unknown>;
};

export type GraphQLApiErrorCode = 'invalid-input' | 'invalid-response' | 'unavailable' | 'cancelled' | 'timeout';

export class GraphQLApiError extends Error {
	constructor(readonly code: GraphQLApiErrorCode, message: string) {
		super(message);
		this.name = 'GraphQLApiError';
	}
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function validateGraphQLResponse<T>(value: unknown): GraphQLResponse<T> {
	if (
		!isRecord(value) ||
		(value.data !== null && value.data !== undefined && !isRecord(value.data)) ||
		(value.errors !== undefined &&
			(!Array.isArray(value.errors) ||
				value.errors.some((error) => !isRecord(error) || typeof error.message !== 'string'))) ||
		(value.data === undefined && !Array.isArray(value.errors))
	) {
		throw new GraphQLApiError('invalid-response', 'Invalid GraphQL response');
	}

	// The envelope is validated here; each capability validates its selected domain fields.
	return value as GraphQLResponse<T>;
}
