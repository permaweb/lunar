import { BaseTabType } from 'helpers/types';

export interface TabsContainerProps<T extends BaseTabType> {
	type: string;
	header: string;
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
	onMount?: (tabsRef: React.RefObject<HTMLDivElement>) => void;
	languageLabels: {
		newTab: string;
		clearTabs: string;
		cancel: string;
		tabsDeleteConfirmationInfo: string;
	};
}
