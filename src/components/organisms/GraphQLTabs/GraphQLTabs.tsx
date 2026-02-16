import React from 'react';

import { ViewTabs } from 'components/molecules/ViewTabs';
import { ASSETS } from 'helpers/config';
import { BaseTabType } from 'helpers/types';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { GraphQLPlayground } from '../GraphQLPlayground';

type GraphQLTabType = BaseTabType & {
	query?: string;
	gateway?: string;
};

export default function GraphQLTabs() {
	const storageKey = 'graphql-tabs';
	const activeTabStorageKey = 'graphql-active-tab';
	const visitedTabsStorageKey = 'graphql-visited-tabs';
	const tabsContainerRef = React.useRef<HTMLDivElement>(null);

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const [tabs, setTabs] = React.useState<GraphQLTabType[]>(() => {
		const stored = localStorage.getItem(storageKey);
		if (stored) {
			const parsed = JSON.parse(stored);
			return parsed.length > 0
				? parsed.map((tab: any) => ({
						...tab,
						tabKey: tab.tabKey || `tab-${Date.now()}-${Math.random()}`,
						gateway: tab.gateway || undefined,
				  }))
				: [{ id: `playground-${Date.now()}`, label: 'Transactions', tabKey: `tab-${Date.now()}-${Math.random()}` }];
		}
		return [{ id: `playground-${Date.now()}`, label: 'Transactions', tabKey: `tab-${Date.now()}-${Math.random()}` }];
	});

	const [activeTabIndex, setActiveTabIndex] = React.useState<number>(() => {
		const stored = localStorage.getItem(activeTabStorageKey);
		if (stored) {
			const index = parseInt(stored, 10);
			return isNaN(index) ? 0 : index;
		}
		return 0;
	});

	const [visitedTabs, setVisitedTabs] = React.useState<Set<number>>(() => {
		const stored = localStorage.getItem(visitedTabsStorageKey);
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				return new Set(Array.isArray(parsed) ? parsed : [0]);
			} catch {
				return new Set([0]);
			}
		}
		const initialActiveIndex = (() => {
			const storedActive = localStorage.getItem(activeTabStorageKey);
			if (storedActive) {
				const index = parseInt(storedActive, 10);
				return isNaN(index) ? 0 : index;
			}
			return 0;
		})();
		return new Set([initialActiveIndex]);
	});

	React.useEffect(() => {
		localStorage.setItem(storageKey, JSON.stringify(tabs));
	}, [tabs]);

	React.useEffect(() => {
		localStorage.setItem(activeTabStorageKey, activeTabIndex.toString());
	}, [activeTabIndex]);

	React.useEffect(() => {
		localStorage.setItem(visitedTabsStorageKey, JSON.stringify(Array.from(visitedTabs)));
	}, [visitedTabs]);

	// Scroll active tab into view when activeTabIndex changes
	React.useEffect(() => {
		if (tabsContainerRef.current && activeTabIndex >= 0) {
			setTimeout(() => {
				const container = tabsContainerRef.current;
				const tabElements = container?.querySelectorAll('[data-tab-index]');
				const activeTabElement = tabElements?.[activeTabIndex] as HTMLElement;

				if (container && activeTabElement) {
					const containerRect = container.getBoundingClientRect();
					const tabRect = activeTabElement.getBoundingClientRect();
					const scrollLeft =
						tabRect.left - containerRect.left + container.scrollLeft - containerRect.width / 2 + tabRect.width / 2;

					container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
				}
			}, 100);
		}
	}, [activeTabIndex]);

	// On mount, scroll the active tab into view
	const handleMount = React.useCallback((tabsRef: React.RefObject<HTMLDivElement>) => {
		tabsContainerRef.current = tabsRef.current;
	}, []);

	const handleQueryUpdate = React.useCallback((tabKey: string, query: string, queryName?: string) => {
		setTabs((prev) => {
			const updated = [...prev];
			const index = updated.findIndex((t) => t.tabKey === tabKey);
			if (index !== -1) {
				const currentTab = updated[index];
				updated[index] = {
					...currentTab,
					query,
					label: queryName || currentTab.label,
				};
			}
			return updated;
		});
	}, []);

	const handleGatewayUpdate = React.useCallback((tabKey: string, gateway: string) => {
		setTabs((prev) => {
			const updated = [...prev];
			const index = updated.findIndex((t) => t.tabKey === tabKey);
			if (index !== -1) {
				updated[index] = {
					...updated[index],
					gateway,
				};
			}
			return updated;
		});
	}, []);

	const defaultTab: Omit<GraphQLTabType, 'tabKey'> = React.useMemo(() => {
		const newTabNumber = tabs.length + 1;
		return {
			id: `playground-${Date.now()}`,
			label: `Playground ${newTabNumber}`,
		};
	}, [tabs.length]);

	return (
		<ViewTabs<GraphQLTabType>
			type="graphql"
			header="GraphQL"
			defaultTab={defaultTab}
			tabs={tabs}
			activeTabIndex={activeTabIndex}
			visitedTabs={visitedTabs}
			onTabsChange={setTabs}
			onActiveTabChange={setActiveTabIndex}
			onVisitedTabsChange={setVisitedTabs}
			onMount={handleMount}
			renderTabIcon={() => ASSETS.code}
			renderTabLabel={(tab) => tab.label}
			renderContent={(tab, _index, isActive) => (
				<GraphQLPlayground
					playgroundId={tab.id}
					active={isActive}
					initialQuery={tab.query}
					initialGateway={tab.gateway}
					onQueryChange={(query: string, queryName?: string) => handleQueryUpdate(tab.tabKey, query, queryName)}
					onGatewayChange={(gateway: string) => handleGatewayUpdate(tab.tabKey, gateway)}
				/>
			)}
			languageLabels={{
				newTab: language.newTab,
				clearTabs: language.clearTabs,
				cancel: language.cancel,
				tabsDeleteConfirmationInfo: language.tabsDeleteConfirmationInfo,
			}}
		/>
	);
}
