import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { getTabPageType } from 'helpers/tabMode';
import { useSettingsProvider } from 'providers/SettingsProvider';

export function useExplorerNavigation(): {
	isInAppTabsEnabled: boolean;
	openExplorer: (route: string) => void;
} {
	const location = useLocation();
	const navigate = useNavigate();
	const { settings } = useSettingsProvider();
	const isInAppTabsEnabled = settings.inAppTabs?.[getTabPageType(location.pathname)] ?? false;
	const openExplorer = React.useCallback(
		(route: string) => {
			navigate(route);
		},
		[navigate]
	);
	return { isInAppTabsEnabled, openExplorer };
}
