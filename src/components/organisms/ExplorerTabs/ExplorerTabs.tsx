import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Types } from '@permaweb/libs';

import { ViewTabs } from 'components/molecules/ViewTabs';
import { ASSETS, URLS } from 'helpers/config';
import { BaseTabType, TransactionTabType } from 'helpers/types';
import { checkValidAddress, formatAddress, getTagValue } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { AOS } from '../AOS';
import { Transaction } from '../Transaction';

type ExplorerTabType = BaseTabType & {
	type: TransactionTabType['type'];
	lastRoute?: string;
};

export default function ExplorerTabs(props: { type: 'explorer' | 'aos' }) {
	const location = useLocation();
	const navigate = useNavigate();

	const tabIndexMapRef = React.useRef<Map<string, number>>(new Map());
	const callbacksRef = React.useRef<Map<string, (newTx: Types.GQLNodeResponseType) => void>>(new Map());
	const loadingCallbacksRef = React.useRef<Map<string, (loading: boolean) => void>>(new Map());
	const isDeletingRef = React.useRef<boolean>(false);
	const tabsContainerRef = React.useRef<HTMLDivElement>(null);

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
						lastRoute: tx.lastRoute || (tx.id ? `${URLS[props.type]}${tx.id}` : undefined),
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
		const { txId, subPath } = extractTxDetailsFromPath(location.pathname);

		if (txId && !transactions.some((tab) => tab.id === txId) && !isDeletingRef.current) {
			if (transactions.length === 1 && transactions[0].id === '') {
				setTransactions((prev) => {
					const updated = [...prev];
					updated[0] = { ...updated[0], id: txId, label: txId, type: 'message', lastRoute: location.pathname };
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
						type: 'message',
						lastRoute: location.pathname,
						tabKey: `tab-${Date.now()}-${Math.random()}`,
					},
				]);
				setActiveTabIndex(newIndex);
				setVisitedTabs((prev) => new Set(prev).add(newIndex));
			}

			navigate(`${URLS[props.type]}${txId}${subPath}`);
		} else if (txId) {
			const tabIndex = transactions.findIndex((tab) => tab.id === txId);
			if (tabIndex !== -1) {
				if (tabIndex !== activeTabIndex) {
					setActiveTabIndex(tabIndex);
					setVisitedTabs((prev) => new Set(prev).add(tabIndex));
				}
				setTransactions((prev) => {
					const updated = [...prev];
					updated[tabIndex] = { ...updated[tabIndex], lastRoute: location.pathname };
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

			const { txId } = extractTxDetailsFromPath(location.pathname);
			const activeTab = transactions[activeTabIndex];

			// If the URL doesn't match the active tab, navigate to the active tab's route
			if (activeTab && activeTab.id !== txId) {
				const route = activeTab.lastRoute || `${URLS[props.type]}${activeTab.id}`;
				navigate(route, { replace: true });
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

	function extractTxDetailsFromPath(pathname: string) {
		const parts = pathname.replace(/#.*/, '').split('/').filter(Boolean);
		const txId = parts[1] || '';
		const subPath = parts.slice(2).join('/') || '';

		return { txId, subPath: subPath ? `/${subPath}` : '' };
	}

	function getInitialIndex() {
		if (transactions.length <= 0) return 0;

		const parts = location.pathname.split('/');
		let currentTxId = '';
		for (const part of parts) {
			if (checkValidAddress(part)) {
				currentTxId = part;
				break;
			}
		}

		if (currentTxId) {
			for (let i = 0; i < transactions.length; i++) {
				if (transactions[i].id === currentTxId) return i;
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
			const type = getTagValue(newTx.node.tags, 'Type');

			setTransactions((prev) => {
				const updated = [...prev];
				if (updated[tabIndex]) {
					const isBlankTab = updated[tabIndex].id === '';
					updated[tabIndex] = {
						...updated[tabIndex],
						id: newTx.node.id,
						label: name ?? newTx.node.id,
						type: type ? (type.toLowerCase() as any) : 'message',
					};

					if (isBlankTab && tabIndex === activeTabIndex) {
						navigate(`${URLS[props.type]}${newTx.node.id}`);
					}
				} else {
					updated.push({
						id: newTx.node.id,
						label: name ?? newTx.node.id,
						type: type ? (type.toLowerCase() as any) : 'message',
						tabKey: tabKey,
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
			const route = targetTab.lastRoute || `${URLS[props.type]}${targetTab.id}`;
			navigate(route);
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

			navigate(id ? `${URLS[props.type]}${id}` : URLS[props.type]);
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
			const newId = updatedTransactions[newActiveIndex]?.id ?? '';
			navigate(`${URLS[props.type]}${newId}`);
		} else {
			setTransactions([{ id: '', label: '', type: null, tabKey: `tab-${Date.now()}-${Math.random()}` }]);
			setActiveTabIndex(0);
			setVisitedTabs(new Set([0]));
			navigate(URLS[props.type], { replace: true });
		}

		setTimeout(() => {
			isDeletingRef.current = false;
		}, 100);
	};

	const handleClearTabs = () => {
		setTransactions([{ id: '', label: '', type: null, tabKey: `tab-${Date.now()}-${Math.random()}` }]);
		setActiveTabIndex(0);
		setVisitedTabs(new Set([0]));
		navigate(URLS[props.type], { replace: true });
	};

	const renderTabLabel = (tab: ExplorerTabType) => {
		let label = language.untitled;
		if (tab.label) {
			label = checkValidAddress(tab.label) ? formatAddress(tab.label, false) : tab.label;
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
