import type { BaseTabType, TransactionTabType } from 'helpers/types';

export type ExplorerTab = BaseTabType & {
	type: TransactionTabType['type'];
	lastRoute?: string;
	labelEdited?: boolean;
};

const TAB_TYPES = new Set(['transaction', 'process', 'message', 'wallet', 'block', 'bundle', 'arweave-node', null]);
type StoredExplorerTab = Omit<ExplorerTab, 'tabKey'> & { tabKey?: string };

/** Ignore corrupt saved UI tabs without preventing a node deep link from opening. */
export function parseExplorerTabs(stored: string | null): StoredExplorerTab[] {
	if (!stored) return [];
	let parsed: unknown;
	try {
		parsed = JSON.parse(stored);
	} catch {
		return [];
	}
	if (!Array.isArray(parsed)) return [];
	return parsed.filter((tab): tab is StoredExplorerTab => {
		if (!tab || typeof tab !== 'object') return false;
		return (
			typeof tab.id === 'string' &&
			typeof tab.label === 'string' &&
			TAB_TYPES.has(tab.type) &&
			(tab.tabKey === undefined || typeof tab.tabKey === 'string') &&
			(tab.lastRoute === undefined || typeof tab.lastRoute === 'string') &&
			(tab.labelEdited === undefined || typeof tab.labelEdited === 'boolean') &&
			(tab.untitledId === undefined || typeof tab.untitledId === 'string')
		);
	});
}
