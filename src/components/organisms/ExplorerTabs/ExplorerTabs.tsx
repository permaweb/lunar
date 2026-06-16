import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Types } from '@permaweb/libs';

import { ViewTabs } from 'components/molecules/ViewTabs';
import { ASSETS, URLS } from 'helpers/config';
import { BaseTabType, TransactionTabType } from 'helpers/types';
import {
	checkValidAddress,
	formatAddress,
	formatBlockId,
	getTagValue,
	getTransactionTypeFromTags,
} from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { AOS } from '../AOS';
import { Transaction } from '../Transaction';

type ExplorerTabType = BaseTabType & {
	type: TransactionTabType['type'];
	lastRoute?: string;
};

function checkValidBlockId(id: string | null) {
	if (!id) return false;
	return /^[a-z0-9_-]{64}$/i.test(id);
}

export default function ExplorerTabs(props: { type: 'explorer' | 'aos' }) {
	const location = useLocation();
	const navigate = useNavigate();

	const tabIndexMapRef = React.useRef<Map<string, number>>(new Map());
	const callbacksRef = React.useRef<Map<string, (newTx: Types.GQLNodeResponseType) => void>>(new Map());
	const loadingCallbacksRef = React.useRef<Map<string, (loading: boolean) => void>>(new Map());
	const isDeletingRef = React.useRef<boolean>(false);
	const tabsContainerRef = React.useRef<HTMLDivElement>(null);
	const activeTabIndexRef = React.useRef<number>(0);
	const locationPathRef = React.useRef<string>(location.pathname);

	const storageKey = `${props.type}-transactions`;

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const [transactions, setTransactions] = React.useState<ExplorerTabType[]>(() => {
		const stored = localStorage.getItem(storageKey);
		if (stored) {
			const parsed = JSON.parse(stored);
			return parsed.length > 0
				? parsed.map((tx: any) => ({
						...tx,
						lastRoute: tx.id ? getRouteForTab(tx, getStoredSubPath(tx.lastRoute)) : undefined,
						tabKey: tx.tabKey || `tab-${Date.now()}-${Math.random()}`,
				  }))
				: [{ id: '', label: '', type: null, tabKey: `tab-${Date.now()}-${Math.random()}` }];
		}
		return [{ id: '', label: '', type: null, tabKey: `tab-${Date.now()}-${Math.random()}` }];
	});
	const [activeTabIndex, setActiveTabIndex] = React.useState<number>(getInitialIndex());
	const [visitedTabs, setVisitedTabs] = React.useState<Set<number>>(() => new Set([getInitialIndex()]));
	const [loadingStates, setLoadingStates] = React.useState<Map<string, boolean>>(new Map());

	React.useEffect(() => {
		activeTabIndexRef.current = activeTabIndex;
	}, [activeTabIndex]);

	React.useEffect(() => {
		locationPathRef.current = location.pathname;
	}, [location.pathname]);

	React.useEffect(() => {
		const { txId, subPath, txType } = extractTxDetailsFromPath(location.pathname);
		const route = getRouteForTab({ id: txId, type: txType }, subPath);

		if (txId && !transactions.some((tab) => isSameTab(tab, txId, txType)) && !isDeletingRef.current) {
			if (transactions.length === 1 && transactions[0].id === '') {
				setTransactions((prev) => {
					const updated = [...prev];
					updated[0] = { ...updated[0], id: txId, label: txId, type: txType, lastRoute: route };
					return updated;
				});
				setActiveTabIndex(0);
				setVisitedTabs(new Set([0]));
			} else {
				const newIndex = transactions.length;
				setTransactions((prev) => [
					...prev,
					{
						id: txId,
						label: txId,
						type: txType,
						lastRoute: route,
						tabKey: `tab-${Date.now()}-${Math.random()}`,
					},
				]);
				setActiveTabIndex(newIndex);
				setVisitedTabs((prev) => new Set(prev).add(newIndex));
			}

			navigateIfNeeded(route);
		} else if (txId) {
			const tabIndex = transactions.findIndex((tab) => isSameTab(tab, txId, txType));
			if (tabIndex !== -1) {
				if (tabIndex !== activeTabIndex) {
					setActiveTabIndex(tabIndex);
					setVisitedTabs((prev) => new Set(prev).add(tabIndex));
				}
				setTransactions((prev) => {
					const updated = [...prev];
					updated[tabIndex] = { ...updated[tabIndex], lastRoute: route };
					return updated;
				});
			}
		}
	}, [location.pathname]);

	React.useEffect(() => {
		localStorage.setItem(storageKey, JSON.stringify(transactions));
	}, [transactions]);

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

	// On mount, ensure URL matches the active tab and scroll it into view
	const handleMount = React.useCallback(
		(tabsRef: React.RefObject<HTMLDivElement>) => {
			tabsContainerRef.current = tabsRef.current;

			const { txId, txType } = extractTxDetailsFromPath(location.pathname);
			const activeTab = transactions[activeTabIndex];

			// If a concrete id is already in the URL, let the path-sync effect open/switch to that tab.
			if (!txId && activeTab && (activeTab.id !== txId || activeTab.type !== txType)) {
				const route = activeTab.lastRoute || getRouteForTab(activeTab);
				navigateIfNeeded(route, { replace: true });
			}

			// Scroll the active tab into view within the tabs container
			if (tabsRef.current && activeTabIndex >= 0) {
				setTimeout(() => {
					const container = tabsRef.current;
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
		},
		[location.pathname, transactions, activeTabIndex, props.type, navigate]
	);

	function getRouteForTab(tab: Pick<ExplorerTabType, 'id' | 'type'>, subPath: string = '') {
		if (!tab.id) return URLS[props.type];
		if (props.type === 'aos') return `${URLS.aos}${tab.id}${subPath}`;

		return `${URLS.explorer}${tab.id}${subPath}`;
	}

	function normalizeRoute(route: string) {
		return route.replace(/\/+$/, '') || '/';
	}

	function navigateIfNeeded(route: string, options?: { replace?: boolean }) {
		if (normalizeRoute(locationPathRef.current) !== normalizeRoute(route)) {
			locationPathRef.current = route;
			navigate(route, options);
		}
	}

	function isSameTab(tab: ExplorerTabType, id: string, type: TransactionTabType['type']) {
		if (tab.id !== id) return false;

		return props.type === 'explorer' || tab.type === type;
	}

	function getStoredSubPath(route?: string) {
		if (!route) return '';

		const parts = route.replace(/#.*/, '').split('/').filter(Boolean);
		const subPathParts =
			props.type === 'explorer' && ['block', 'bundle'].includes(parts[1]) ? parts.slice(3) : parts.slice(2);
		const subPath = subPathParts.join('/') || '';

		return subPath ? `/${subPath}` : '';
	}

	function extractTxDetailsFromPath(pathname: string) {
		const parts = pathname.replace(/#.*/, '').split('/').filter(Boolean);
		const txId = parts[1] || '';
		const subPathParts = parts.slice(2);
		const subPath = subPathParts.join('/') || '';
		const matchingTab = transactions.find((tab) => tab.id === txId && tab.type);
		const txType = matchingTab?.type ?? (txId ? 'transaction' : null);

		return { txId, subPath: subPath ? `/${subPath}` : '', txType };
	}

	function getInitialIndex() {
		if (transactions.length <= 0) return 0;

		const { txId, txType } = extractTxDetailsFromPath(location.pathname);

		if (txId) {
			for (let i = 0; i < transactions.length; i++) {
				if (isSameTab(transactions[i], txId, txType)) return i;
			}
		}

		if (location.pathname === URLS[props.type] || location.pathname === `${URLS[props.type]}/`) {
			const blankTabIndex = transactions.findIndex((t) => t.id === '');
			if (blankTabIndex !== -1) return blankTabIndex;
		}

		return 0;
	}

	const handleTxChangeByKey = React.useCallback(
		(tabKey: string, newTx: Types.GQLNodeResponseType) => {
			const tabIndex = tabIndexMapRef.current.get(tabKey);
			if (tabIndex === undefined) return;

			const name = getTagValue(newTx.node.tags, 'Name');
			const type = getTransactionTypeFromTags(newTx.node.tags);

			setTransactions((prev) => {
				const updated = [...prev];
				if (updated[tabIndex]) {
					const nextType = type as TransactionTabType['type'];
					const nextRoute = getRouteForTab({ id: newTx.node.id, type: nextType });
					const shouldNavigate =
						tabIndex === activeTabIndexRef.current &&
						(updated[tabIndex].id !== newTx.node.id || updated[tabIndex].type !== nextType);

					updated[tabIndex] = {
						...updated[tabIndex],
						id: newTx.node.id,
						label: name ?? newTx.node.id,
						type: nextType,
						lastRoute: nextRoute,
					};

					if (shouldNavigate) {
						navigateIfNeeded(nextRoute);
					}
				} else {
					const nextType = type as TransactionTabType['type'];
					updated.push({
						id: newTx.node.id,
						label: name ?? newTx.node.id,
						type: nextType,
						tabKey: tabKey,
						lastRoute: getRouteForTab({ id: newTx.node.id, type: nextType }),
					});
				}
				return updated;
			});
		},
		[props.type, navigate, activeTabIndex]
	);

	const handleLoadingChangeByKey = React.useCallback((tabKey: string, loading: boolean) => {
		setLoadingStates((prev) => {
			const updated = new Map(prev);
			updated.set(tabKey, loading);
			return updated;
		});
	}, []);

	const handleActiveTabChange = (index: number, skipNavigation?: boolean) => {
		setActiveTabIndex(index);
		setVisitedTabs((prev) => new Set(prev).add(index));
		if (!skipNavigation) {
			const targetTab = transactions[index];
			const route = targetTab.lastRoute || getRouteForTab(targetTab);
			navigateIfNeeded(route);
		}
	};

	const handleAddTab = React.useCallback(
		(id?: string) => {
			const untitledId = id ? id : `untitled-${Date.now()}`;
			const newTab = {
				id: id ?? '',
				label: id ?? '',
				type: null,
				tabKey: `tab-${Date.now()}-${Math.random()}`,
				untitledId: id ? undefined : untitledId,
			} as ExplorerTabType;

			setTransactions((prev) => {
				const updated = [...prev, newTab];
				const newIndex = updated.length - 1;
				setActiveTabIndex(newIndex);
				setVisitedTabs((prevVisited) => new Set(prevVisited).add(newIndex));
				return updated;
			});

			setTimeout(() => {
				if (tabsContainerRef.current) {
					tabsContainerRef.current.scrollTo({ left: tabsContainerRef.current.scrollWidth });
				}
			}, 0);

			navigateIfNeeded(id ? getRouteForTab(newTab) : URLS[props.type]);
		},
		[props.type, navigate]
	);

	const handleDeleteTab = (deletedIndex: number) => {
		isDeletingRef.current = true;

		const updatedTransactions = transactions.filter((_, i) => i !== deletedIndex);

		let newActiveIndex: number;

		if (deletedIndex < activeTabIndex) {
			newActiveIndex = activeTabIndex - 1;
		} else if (deletedIndex === activeTabIndex) {
			newActiveIndex = updatedTransactions.length > deletedIndex ? deletedIndex : updatedTransactions.length - 1;
		} else {
			newActiveIndex = activeTabIndex;
		}

		newActiveIndex = Math.max(0, newActiveIndex);

		const newVisited = new Set<number>();
		visitedTabs.forEach((idx) => {
			if (idx < deletedIndex) {
				newVisited.add(idx);
			} else if (idx > deletedIndex) {
				newVisited.add(idx - 1);
			}
		});
		newVisited.add(newActiveIndex);
		setVisitedTabs(newVisited);

		if (updatedTransactions.length > 0) {
			setTransactions(updatedTransactions);
			setActiveTabIndex(newActiveIndex);
			const nextTab = updatedTransactions[newActiveIndex];
			navigateIfNeeded(nextTab ? getRouteForTab(nextTab) : URLS[props.type]);
		} else {
			setTransactions([{ id: '', label: '', type: null, tabKey: `tab-${Date.now()}-${Math.random()}` }]);
			setActiveTabIndex(0);
			setVisitedTabs(new Set([0]));
			navigateIfNeeded(URLS[props.type], { replace: true });
		}

		setTimeout(() => {
			isDeletingRef.current = false;
		}, 100);
	};

	const handleClearTabs = () => {
		setTransactions([{ id: '', label: '', type: null, tabKey: `tab-${Date.now()}-${Math.random()}` }]);
		setActiveTabIndex(0);
		setVisitedTabs(new Set([0]));
		navigateIfNeeded(URLS[props.type], { replace: true });
	};

	const renderTabLabel = (tab: ExplorerTabType) => {
		let label = language.untitled;
		if (tab.label) {
			if (checkValidBlockId(tab.label)) {
				label = formatBlockId(tab.label, false);
			} else {
				label = checkValidAddress(tab.label) ? formatAddress(tab.label, false) : tab.label;
			}
		}
		return label;
	};

	const renderTabIcon = (tab: ExplorerTabType) => {
		return ASSETS[tab.type] ?? ASSETS.transaction;
	};

	const renderContent = (tab: ExplorerTabType, index: number, isActive: boolean) => {
		tabIndexMapRef.current.set(tab.tabKey, index);

		if (!callbacksRef.current.has(tab.tabKey)) {
			callbacksRef.current.set(tab.tabKey, (newTx: Types.GQLNodeResponseType) => {
				handleTxChangeByKey(tab.tabKey, newTx);
			});
		}
		const onTxChange = callbacksRef.current.get(tab.tabKey)!;

		if (!loadingCallbacksRef.current.has(tab.tabKey)) {
			loadingCallbacksRef.current.set(tab.tabKey, (loading: boolean) => {
				handleLoadingChangeByKey(tab.tabKey, loading);
			});
		}
		const onLoadingChange = loadingCallbacksRef.current.get(tab.tabKey)!;

		return props.type === 'explorer' ? (
			<Transaction
				key={tab.tabKey}
				txId={tab.id}
				type={tab.type as any}
				active={isActive}
				onTxChange={onTxChange}
				handleMessageOpen={handleAddTab}
				tabKey={tab.tabKey}
				onLoadingChange={onLoadingChange}
			/>
		) : (
			<AOS key={tab.tabKey} processId={tab.id} active={isActive} onTxChange={onTxChange} tabKey={tab.tabKey} />
		);
	};

	const defaultTab: Omit<ExplorerTabType, 'tabKey'> = {
		id: '',
		label: '',
		type: null,
	};

	return (
		<ViewTabs<ExplorerTabType>
			type={props.type}
			header={language[props.type]}
			defaultTab={defaultTab}
			tabs={transactions}
			activeTabIndex={activeTabIndex}
			visitedTabs={visitedTabs}
			loadingStates={loadingStates}
			onTabsChange={setTransactions}
			onActiveTabChange={handleActiveTabChange}
			onVisitedTabsChange={setVisitedTabs}
			onAddTab={handleAddTab}
			onDeleteTab={handleDeleteTab}
			onClearTabs={handleClearTabs}
			onMount={handleMount}
			renderTabIcon={renderTabIcon}
			renderTabLabel={renderTabLabel}
			renderContent={renderContent}
			languageLabels={{
				newTab: language.newTab,
				clearTabs: language.clearTabs,
				cancel: language.cancel,
				tabsDeleteConfirmationInfo: language.tabsDeleteConfirmationInfo,
			}}
		/>
	);
}
