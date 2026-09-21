export const GRAPHQL_GATEWAYS_STORAGE_KEY = 'lunar-gql-gateways';
export const GRAPHQL_TABS_STORAGE_KEY = 'graphql-tabs';

// Raise to discard the GraphQL page's saved gateways once in every browser, on the next load of the app.
const GRAPHQL_GATEWAYS_VERSION = '2';
const GRAPHQL_GATEWAYS_VERSION_STORAGE_KEY = 'graphql-gateways-version';
// Left by an earlier per-tab migration that this reset replaces.
const LEGACY_DEFAULT_GATEWAY_STORAGE_KEY = 'graphql-default-gateway';

/** Reduces a GraphQL gateway to the key the playground stores: no protocol, trailing slash, or `/graphql` suffix. */
export function getGraphQLGatewayKey(gateway: string) {
	return gateway
		.trim()
		.replace(/\/+$/, '')
		.replace(/\/graphql$/i, '')
		.replace(/^https?:\/\//, '');
}

/**
 * Clears the saved gateway list and each tab's gateway, keeping the tabs and their queries, so the GraphQL page
 * starts from its default gateways. Runs before the app renders because the page reads these values on mount.
 */
export function resetSavedGraphQLGateways() {
	try {
		if (localStorage.getItem(GRAPHQL_GATEWAYS_VERSION_STORAGE_KEY) === GRAPHQL_GATEWAYS_VERSION) return;

		localStorage.removeItem(GRAPHQL_GATEWAYS_STORAGE_KEY);
		localStorage.removeItem(LEGACY_DEFAULT_GATEWAY_STORAGE_KEY);

		const tabs: unknown = JSON.parse(localStorage.getItem(GRAPHQL_TABS_STORAGE_KEY) ?? 'null');
		if (Array.isArray(tabs)) {
			localStorage.setItem(
				GRAPHQL_TABS_STORAGE_KEY,
				JSON.stringify(
					tabs.map((tab) => {
						if (!tab || typeof tab !== 'object') return tab;
						const { gateway: _gateway, ...savedTab } = tab;
						return savedTab;
					})
				)
			);
		}

		localStorage.setItem(GRAPHQL_GATEWAYS_VERSION_STORAGE_KEY, GRAPHQL_GATEWAYS_VERSION);
	} catch (error) {
		// Storage can be unavailable or hold malformed tabs; the version stays unset, so the reset retries next load.
		console.warn('Unable to reset saved GraphQL gateways', error);
	}
}
