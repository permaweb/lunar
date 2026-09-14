import React from 'react';

import { BaseTabType } from 'helpers/types';

export interface TabsContainerProps<T extends BaseTabType> {
	type: string;
	header: string;
	headerActions?: React.ReactNode[];
	defaultTab: Omit<T, 'tabKey'>;
	tabs: T[];
	activeTabIndex: number;
	visitedTabs: Set<number>;
	loadingStates?: Map<string, boolean>;
	onTabsChange: (tabs: T[]) => void;
	onActiveTabChange: (index: number, skipNavigation?: boolean) => void;
	onVisitedTabsChange: (visited: Set<number>) => void;
	renderTabIcon: (tab: T) => string;
	renderTabLabel: (tab: T) => string;
	renderContent: (tab: T, index: number, isActive: boolean) => React.ReactNode;
	onAddTab?: (id?: string) => void;
	onDeleteTab?: (index: number) => void;
	onClearTabs?: () => void;
	onRenameTab?: (index: number, label: string) => void;
	onMount?: (tabsRef: React.RefObject<HTMLDivElement>) => void;
	languageLabels: {
		newTab: string;
		newTabTooltip: string;
		clearTabs: string;
		clearTabsTooltip: string;
		cancel: string;
		tabsDeleteConfirmationInfo: string;
	};
}
