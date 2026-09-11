import React from 'react';

import type { PinnedTab, PinTarget } from 'helpers/pinnedTabs';
import { normalizePin, parsePinnedTabs, PINNED_TABS_KEY, PINNED_TABS_LIMIT } from 'helpers/pinnedTabs';

interface PinnedTabsContextState {
	tabs: PinnedTab[];
	storageError: boolean;
	toggle: (target: PinTarget) => void;
	updateLabels: (targets: Pick<PinTarget, 'id' | 'label' | 'labelEdited'>[]) => void;
	remove: (id: string) => void;
}

const PinnedTabsContext = React.createContext<PinnedTabsContextState>({
	tabs: [],
	storageError: false,
	toggle() {},
	updateLabels() {},
	remove() {},
});

export function usePinnedTabsProvider(): PinnedTabsContextState {
	return React.useContext(PinnedTabsContext);
}

export default function PinnedTabsProvider(props: { children: React.ReactNode }) {
	const [tabs, setTabs] = React.useState<PinnedTab[]>(() => {
		try {
			return parsePinnedTabs(localStorage.getItem(PINNED_TABS_KEY));
		} catch {
			return [];
		}
	});
	const [storageError, setStorageError] = React.useState(false);
	React.useEffect(() => {
		try {
			const serialized = JSON.stringify({ version: 1, tabs });
			if (localStorage.getItem(PINNED_TABS_KEY) !== serialized) localStorage.setItem(PINNED_TABS_KEY, serialized);
			setStorageError(false);
		} catch {
			setStorageError(true);
		}
	}, [tabs]);
	React.useEffect(() => {
		function handleStorage(event: StorageEvent) {
			if (event.key === PINNED_TABS_KEY) setTabs(parsePinnedTabs(event.newValue));
		}
		window.addEventListener('storage', handleStorage);
		return () => window.removeEventListener('storage', handleStorage);
	}, []);
	const toggle = React.useCallback((target: PinTarget) => {
		const pin = normalizePin(target);
		if (!pin) return;
		setTabs((current) =>
			current.some((tab) => tab.id === pin.id)
				? current.filter((tab) => tab.id !== pin.id)
				: current.length < PINNED_TABS_LIMIT
				? [...current, { ...pin, pinnedAt: Date.now() }]
				: current
		);
	}, []);
	const remove = React.useCallback((id: string) => setTabs((current) => current.filter((tab) => tab.id !== id)), []);
	const updateLabels = React.useCallback((targets: Pick<PinTarget, 'id' | 'label' | 'labelEdited'>[]) => {
		const labels = new Map(targets.map((target) => [target.id, target]));
		setTabs((current) => {
			let changed = false;
			const updated = current.map((tab) => {
				const target = labels.get(tab.id);
				if (!target || (tab.labelEdited && !target.labelEdited)) return tab;
				const label = target.label.trim().slice(0, 150) || tab.id;
				if (tab.label === label && !!tab.labelEdited === !!target.labelEdited) return tab;
				changed = true;
				return { ...tab, label, ...(target.labelEdited ? { labelEdited: true } : {}) };
			});
			return changed ? updated : current;
		});
	}, []);
	const value = React.useMemo(
		() => ({ tabs, storageError, toggle, remove, updateLabels }),
		[tabs, storageError, toggle, remove, updateLabels]
	);
	return <PinnedTabsContext.Provider value={value}>{props.children}</PinnedTabsContext.Provider>;
}
