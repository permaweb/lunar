import { DEFAULT_GRAPHQL_ENDPOINT } from 'helpers/config';

let activeEndpoint = DEFAULT_GRAPHQL_ENDPOINT;

/**
 * Returns the absolute URL of a usable GraphQL endpoint, or null when the value is not an HTTP(S) URL.
 * A bare origin gets `/graphql` appended, matching how @permaweb/libs resolves one, so every adapter
 * queries the same URL.
 */
export function normalizeGraphQLEndpoint(value: unknown): string | null {
	if (typeof value !== 'string' || !value.trim()) return null;

	let url: URL;
	try {
		url = new URL(value.trim());
	} catch {
		return null;
	}

	if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
	if (url.pathname === '/') url.pathname = '/graphql';

	return url.toString().replace(/\/+$/, '');
}

/** The single GraphQL endpoint all adapters query. The GraphQL playground chooses its own gateway. */
export function getGraphQLEndpoint(): string {
	return activeEndpoint;
}

export function setGraphQLEndpoint(endpoint: string) {
	activeEndpoint = normalizeGraphQLEndpoint(endpoint) ?? DEFAULT_GRAPHQL_ENDPOINT;
}
