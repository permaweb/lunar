export type TabPageType = 'explorer' | 'aos' | 'graphql';
export type InAppTabsSettings = Record<TabPageType, boolean>;

export function restoreInAppTabs(value: unknown): InAppTabsSettings {
	const settings = value && typeof value === 'object' ? value : {};
	return {
		explorer: 'explorer' in settings && settings.explorer === true,
		aos: 'aos' in settings && settings.aos === true,
		graphql: 'graphql' in settings && settings.graphql === true,
	};
}

export function getTabPageType(pathname: string): TabPageType {
	const page = pathname.split('/')[1];
	return page === 'aos' || page === 'graphql' ? page : 'explorer';
}
