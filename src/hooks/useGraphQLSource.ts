import React from 'react';

import { getConfiguredGraphQLSource, type GraphQLSource, subscribeGraphQLSource } from 'api/graphql';

export function useGraphQLSource(): GraphQLSource {
	return React.useSyncExternalStore(subscribeGraphQLSource, getConfiguredGraphQLSource, () => 'ar-lmdb');
}
