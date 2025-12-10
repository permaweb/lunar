import React from 'react';
import { ReactSVG } from 'react-svg';
import { useTheme } from 'styled-components';

import { ViewWrapper } from 'app/styles';
import { Button } from 'components/atoms/Button';
import { IconButton } from 'components/atoms/IconButton';
import { Modal } from 'components/atoms/Modal';
import { ViewHeader } from 'components/atoms/ViewHeader';
import { Monitor } from 'components/organisms/Monitor';
import { ASSETS } from 'helpers/config';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

type MonitorTabType = {
	id: string;
	label: string;
	tabKey: string;
	query?: string;
	gateway?: string;
	untitledId?: string;
};

export default function MonitorTabs() {
	const theme = useTheme();

	const tabsRef = React.useRef<HTMLDivElement>(null);

	const storageKey = 'monitor-tabs';
	const activeTabStorageKey = 'monitor-active-tab';
	const visitedTabsStorageKey = 'monitor-visited-tabs';

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const [tabs, setTabs] = React.useState<MonitorTabType[]>(() => {
		const stored = localStorage.getItem(storageKey);
		if (stored) {
			const parsed = JSON.parse(stored);
			return parsed.length > 0
				? parsed.map((tab: any) => ({
						...tab,
						tabKey: tab.tabKey || `tab-${Date.now()}-${Math.random()}`,
						gateway: tab.gateway || undefined,
				  }))
				: [{ id: `monitor-${Date.now()}`, label: 'Monitor', tabKey: `tab-${Date.now()}-${Math.random()}` }];
		}
		return [{ id: `monitor-${Date.now()}`, label: 'Monitor', tabKey: `tab-${Date.now()}-${Math.random()}` }];
	});

	const [activeTabIndex, setActiveTabIndex] = React.useState<number>(() => {
		const stored = localStorage.getItem(activeTabStorageKey);
		if (stored) {
			const index = parseInt(stored, 10);
			return isNaN(index) ? 0 : index;
		}
		return 0;
	});
	const [showClearConfirmation, setShowClearConfirmation] = React.useState<boolean>(false);
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
		// Initialize with activeTabIndex to ensure it's visited on first load
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
		const header = document.getElementById('navigation-header');
		if (header) {
			header.style.background = theme.colors.container.alt1.background;
			header.style.position = 'relative';
			header.style.boxShadow = `inset 0px 6px 6px -6px ${theme.colors.shadow.primary}`;
			header.style.borderTop = `0.5px solid ${theme.colors.border.primary}`;
			header.style.borderBottom = 'none';
		}

		return () => {
			if (header) {
				header.style.background = '';
				header.style.position = 'sticky';
				header.style.boxShadow = 'none';
				header.style.borderTop = 'none';
			}
		};
	}, [theme]);

	React.useEffect(() => {
		const el = tabsRef.current;
		if (!el) return;

		const onWheel = (e: WheelEvent) => {
			if (e.deltaY !== 0) {
				e.preventDefault();
				el.scrollLeft += e.deltaY;
			}
		};

		el.addEventListener('wheel', onWheel, { passive: false });

		return () => {
			el.removeEventListener('wheel', onWheel);
		};
	}, []);

	React.useEffect(() => {
		localStorage.setItem(storageKey, JSON.stringify(tabs));
	}, [tabs]);

	React.useEffect(() => {
		localStorage.setItem(activeTabStorageKey, activeTabIndex.toString());
	}, [activeTabIndex]);

	React.useEffect(() => {
		localStorage.setItem(visitedTabsStorageKey, JSON.stringify(Array.from(visitedTabs)));
	}, [visitedTabs]);

	const handleTabRedirect = (index: number) => {
		setActiveTabIndex(index);
		setVisitedTabs((prev) => new Set(prev).add(index));
	};

	const handleAddTab = React.useCallback(() => {
		const newTabNumber = tabs.length + 1;
		const newTab = {
			id: `monitor-${Date.now()}`,
			label: `Monitor ${newTabNumber}`,
			tabKey: `tab-${Date.now()}-${Math.random()}`,
		} as MonitorTabType;

		setTabs((prev) => {
			const updated = [...prev, newTab];
			const newIndex = updated.length - 1;
			setActiveTabIndex(newIndex);
			setVisitedTabs((prevVisited) => new Set(prevVisited).add(newIndex));
			return updated;
		});

		setTimeout(() => {
			if (tabsRef.current) {
				tabsRef.current.scrollTo({ left: tabsRef.current.scrollWidth });
			}
		}, 0);
	}, [tabs.length]);

	const handleDeleteTab = (deletedIndex: number) => {
		const updatedTabs = tabs.filter((_, i) => i !== deletedIndex);

		let newActiveIndex: number;

		if (deletedIndex < activeTabIndex) {
			newActiveIndex = activeTabIndex - 1;
		} else if (deletedIndex === activeTabIndex) {
			newActiveIndex = updatedTabs.length > deletedIndex ? deletedIndex : updatedTabs.length - 1;
		} else {
			newActiveIndex = activeTabIndex;
		}

		newActiveIndex = Math.max(0, newActiveIndex);

		// Update visited tabs
		setVisitedTabs((prev) => {
			const newVisited = new Set<number>();
			prev.forEach((idx) => {
				if (idx < deletedIndex) {
					newVisited.add(idx);
				} else if (idx > deletedIndex) {
					newVisited.add(idx - 1);
				}
			});
			newVisited.add(newActiveIndex);
			return newVisited;
		});

		if (updatedTabs.length > 0) {
			setTabs(updatedTabs);
			setActiveTabIndex(newActiveIndex);
		} else {
			handleClearTabs();
		}
	};

	const handleClearTabs = () => {
		setTabs([{ id: `monitor-${Date.now()}`, label: 'Monitor', tabKey: `tab-${Date.now()}-${Math.random()}` }]);
		setActiveTabIndex(0);
		setVisitedTabs(new Set([0]));
		setShowClearConfirmation(false);
	};

	const handleQueryUpdate = React.useCallback((tabKey: string, query: string, queryName?: string) => {
		setTabs((prev) => {
			const updated = [...prev];
			const index = updated.findIndex((t) => t.tabKey === tabKey);
			if (index !== -1) {
				const currentTab = updated[index];
				updated[index] = {
					...currentTab,
					query,
					// Update label if queryName is provided, otherwise keep the current label
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

	const tabElements = React.useMemo(() => {
		return (
			<S.TabsContent ref={tabsRef} className={'scroll-wrapper-hidden'}>
				{tabs.map((tab, index) => {
					return (
						<React.Fragment key={tab.tabKey}>
							<S.TabAction active={index === activeTabIndex} onClick={() => handleTabRedirect(index)}>
								<div className={'icon-wrapper'}>
									<div className={'normal-icon'}>
										<ReactSVG src={ASSETS.code} />
									</div>
									<div className={'delete-icon'}>
										<IconButton
											type={'primary'}
											src={ASSETS.close}
											handlePress={() => {
												handleDeleteTab(index);
											}}
											dimensions={{ wrapper: 10, icon: 10 }}
										/>
									</div>
								</div>
								{tab.label}
							</S.TabAction>
						</React.Fragment>
					);
				})}
				<S.NewTab active={false} onClick={() => handleAddTab()}>
					<ReactSVG src={ASSETS.add} />
					{language.newTab}
				</S.NewTab>
				<S.Placeholder />
			</S.TabsContent>
		);
	}, [tabs, activeTabIndex, language]);

	return (
		<>
			<S.Wrapper>
				<S.HeaderWrapper>
					<ViewHeader
						header={'Monitor'}
						actions={[
							<Button
								type={'primary'}
								label={language.newTab}
								handlePress={() => handleAddTab()}
								icon={ASSETS.add}
								iconLeftAlign
							/>,
							<Button
								type={'primary'}
								label={language.clearTabs}
								handlePress={() => setShowClearConfirmation(true)}
								icon={ASSETS.delete}
								iconLeftAlign
							/>,
						]}
					/>
					<S.TabsWrapper>
						<S.PlaceholderFull id={'placeholder-start'} />
						<ViewWrapper>{tabElements}</ViewWrapper>
						<S.PlaceholderFull id={'placeholder-end'} />
					</S.TabsWrapper>
				</S.HeaderWrapper>
				<ViewWrapper>
					<>
						{tabs.map((tab: MonitorTabType, index) => {
							const isActive = index === activeTabIndex;
							const hasBeenVisited = visitedTabs.has(index);

							if (!hasBeenVisited) {
								return null;
							}

							return (
								<S.MonitorWrapper key={tab.tabKey} active={isActive}>
									<Monitor
										monitorId={tab.id}
										active={isActive}
										initialQuery={tab.query}
										initialGateway={tab.gateway}
										onQueryChange={(query: string, queryName?: string) =>
											handleQueryUpdate(tab.tabKey, query, queryName)
										}
										onGatewayChange={(gateway: string) => handleGatewayUpdate(tab.tabKey, gateway)}
									/>
								</S.MonitorWrapper>
							);
						})}
					</>
				</ViewWrapper>
			</S.Wrapper>
			{showClearConfirmation && (
				<Modal header={language.clearTabs} handleClose={() => setShowClearConfirmation(false)}>
					<S.ModalWrapper>
						<S.ModalBodyWrapper>
							<p>{language.tabsDeleteConfirmationInfo}</p>
						</S.ModalBodyWrapper>
						<S.ModalActionsWrapper>
							<Button type={'primary'} label={language.cancel} handlePress={() => setShowClearConfirmation(false)} />
							<Button
								type={'primary'}
								label={language.clearTabs}
								handlePress={() => handleClearTabs()}
								icon={ASSETS.delete}
								iconLeftAlign
								warning
							/>
						</S.ModalActionsWrapper>
					</S.ModalWrapper>
				</Modal>
			)}
		</>
	);
}
