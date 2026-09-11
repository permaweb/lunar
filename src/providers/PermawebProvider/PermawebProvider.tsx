import React from 'react';

import { createPermawebApis, PermawebApi } from 'api/permaweb';

import { useArweaveProvider } from 'providers/ArweaveProvider';
import { useSettingsProvider } from 'providers/SettingsProvider';

interface PermawebContextState {
	legacyApi: PermawebApi | null;
	mainnetApi: PermawebApi | null;
}

const DEFAULT_CONTEXT = {
	legacyApi: null,
	mainnetApi: null,
};

const PermawebContext = React.createContext<PermawebContextState>(DEFAULT_CONTEXT);

export function usePermawebProvider(): PermawebContextState {
	return React.useContext(PermawebContext);
}

export default function PermawebProvider(props: { children: React.ReactNode }) {
	const arProvider = useArweaveProvider();
	const settingsProvider = useSettingsProvider();
	const [legacyApi, setLegacyApi] = React.useState<PermawebApi | null>(null);
	const [mainnetApi, setMainnetApi] = React.useState<PermawebApi | null>(null);

	React.useEffect(() => {
		try {
			const activeNode = settingsProvider.settings.nodes.find((node) => node.active);
			const apis = createPermawebApis({
				wallet: arProvider.wallet,
				legacyComputeNode: settingsProvider.settings.legacyComputeNode,
				node: activeNode,
			});

			setLegacyApi(apis.legacyApi);
			setMainnetApi(apis.mainnetApi);
		} catch (error) {
			console.error('Error in PermawebProvider initialization:', error);
		}
	}, [arProvider.wallet, settingsProvider.settings.nodes, settingsProvider.settings.legacyComputeNode]);

	return (
		<PermawebContext.Provider
			value={{
				legacyApi,
				mainnetApi,
			}}
		>
			{props.children}
		</PermawebContext.Provider>
	);
}
