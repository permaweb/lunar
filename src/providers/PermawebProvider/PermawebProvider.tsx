import React from 'react';

import { setGraphQLEndpoint } from 'api/graphql';
import { createPeerApi, createPermawebApis, type PeerApi, type PermawebApi } from 'api/permaweb';

import { useArweaveProvider } from 'providers/ArweaveProvider';
import { useSettingsProvider } from 'providers/SettingsProvider';

interface PermawebContextState {
	legacyApi: PermawebApi | null;
	mainnetApi: PeerApi | null;
	aosApi: PermawebApi | null;
}

const DEFAULT_CONTEXT = {
	legacyApi: null,
	mainnetApi: null,
	aosApi: null,
};

const PermawebContext = React.createContext<PermawebContextState>(DEFAULT_CONTEXT);

export function usePermawebProvider(): PermawebContextState {
	return React.useContext(PermawebContext);
}

export default function PermawebProvider(props: { children: React.ReactNode }) {
	const arProvider = useArweaveProvider();
	const settingsProvider = useSettingsProvider();
	const [legacyApi, setLegacyApi] = React.useState<PermawebApi | null>(null);
	const [aosApi, setAosApi] = React.useState<PermawebApi | null>(null);
	const mainnetApi = React.useMemo(
		() => createPeerApi(settingsProvider.settings.aoNetwork, arProvider.wallet),
		[settingsProvider.settings.aoNetwork, arProvider.wallet]
	);

	// A layout effect applies the endpoint before any child's data-fetching effect runs in the same commit.
	React.useLayoutEffect(() => {
		setGraphQLEndpoint(settingsProvider.settings.graphqlEndpoint);
	}, [settingsProvider.settings.graphqlEndpoint]);

	React.useEffect(() => {
		try {
			const activeNode = settingsProvider.settings.nodes.find((node) => node.active);
			const apis = createPermawebApis({
				wallet: arProvider.wallet,
				legacyComputeNode: settingsProvider.settings.legacyComputeNode,
				node: activeNode,
				graphqlEndpoint: settingsProvider.settings.graphqlEndpoint,
			});

			setLegacyApi(apis.legacyApi);
			setAosApi(apis.aosApi);
		} catch (error) {
			console.error('Error in PermawebProvider initialization:', error);
		}
	}, [
		arProvider.wallet,
		settingsProvider.settings.nodes,
		settingsProvider.settings.legacyComputeNode,
		settingsProvider.settings.graphqlEndpoint,
	]);

	return (
		<PermawebContext.Provider
			value={{
				legacyApi,
				mainnetApi,
				aosApi,
			}}
		>
			{props.children}
		</PermawebContext.Provider>
	);
}
