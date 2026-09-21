/** Reduces a GraphQL gateway to the key the playground stores: no protocol, trailing slash, or `/graphql` suffix. */
export function getGraphQLGatewayKey(gateway: string) {
	return gateway
		.trim()
		.replace(/\/+$/, '')
		.replace(/\/graphql$/i, '')
		.replace(/^https?:\/\//, '');
}
