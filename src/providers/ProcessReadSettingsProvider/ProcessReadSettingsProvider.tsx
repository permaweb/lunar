import React from 'react';

import { type ProcessReadPreferences, readProcessReadPreferences, writeProcessReadPreferences } from 'api/aoNetwork';
import { createPeerApi, type PeerApi } from 'api/permaweb';

import type { AoNetworkSettings } from 'helpers/aoNetwork';
import { useArweaveProvider } from 'providers/ArweaveProvider';
import { useSettingsProvider } from 'providers/SettingsProvider';

interface ProcessReadSettingsContextState {
	network: AoNetworkSettings;
	useGlobal: boolean;
	mainnetApi: PeerApi | null;
	hasStorageError: boolean;
	onNetworkChange: (network: AoNetworkSettings) => void;
	onUseGlobalChange: (useGlobal: boolean) => void;
}

const ProcessReadSettingsContext = React.createContext<ProcessReadSettingsContextState | undefined>(undefined);

export function useProcessReadSettingsProvider(): ProcessReadSettingsContextState | undefined {
	return React.useContext(ProcessReadSettingsContext);
}

export default function ProcessReadSettingsProvider(props: {
	processId: string;
	enabled: boolean;
	children: React.ReactNode;
}) {
	const { settings } = useSettingsProvider();
	const arweave = useArweaveProvider();
	const initial = React.useMemo(
		() => ({
			id: props.processId,
			preferences: readProcessReadPreferences(props.processId),
			hasStorageError: false,
		}),
		[props.processId]
	);
	const [snapshot, setSnapshot] = React.useState(initial);
	const current = snapshot.id === props.processId ? snapshot : initial;
	const useGlobal = current.preferences?.useGlobal ?? true;
	const customNetwork = current.preferences?.network ?? settings.aoNetwork;
	const network = props.enabled && !useGlobal ? customNetwork : settings.aoNetwork;
	const mainnetApi = React.useMemo(
		() => (props.enabled && !useGlobal ? createPeerApi(network, arweave.wallet) : null),
		[props.enabled, useGlobal, network, arweave.wallet]
	);
	const handlePreferencesChange = React.useCallback(
		(preferences: ProcessReadPreferences) => {
			if (!props.enabled) return;
			setSnapshot({
				id: props.processId,
				preferences,
				hasStorageError: !writeProcessReadPreferences(props.processId, preferences),
			});
		},
		[props.processId, props.enabled]
	);
	const handleNetworkChange = React.useCallback(
		(next: AoNetworkSettings) => {
			if (!useGlobal) handlePreferencesChange({ useGlobal: false, network: next });
		},
		[useGlobal, handlePreferencesChange]
	);
	const handleUseGlobalChange = React.useCallback(
		(next: boolean) => {
			handlePreferencesChange({ useGlobal: next, network: customNetwork });
		},
		[customNetwork, handlePreferencesChange]
	);
	const value = React.useMemo(
		() => ({
			network,
			useGlobal,
			mainnetApi,
			hasStorageError: current.hasStorageError,
			onNetworkChange: handleNetworkChange,
			onUseGlobalChange: handleUseGlobalChange,
		}),
		[network, useGlobal, mainnetApi, current.hasStorageError, handleNetworkChange, handleUseGlobalChange]
	);
	return <ProcessReadSettingsContext.Provider value={value}>{props.children}</ProcessReadSettingsContext.Provider>;
}
