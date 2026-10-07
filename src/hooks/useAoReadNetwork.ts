import type { AoNetworkSettings } from 'helpers/aoNetwork';
import { useProcessReadSettingsProvider } from 'providers/ProcessReadSettingsProvider';
import { useSettingsProvider } from 'providers/SettingsProvider';

export function useAoReadNetwork(): AoNetworkSettings {
	const scope = useProcessReadSettingsProvider();
	const { settings } = useSettingsProvider();
	return scope?.network ?? settings.aoNetwork;
}
