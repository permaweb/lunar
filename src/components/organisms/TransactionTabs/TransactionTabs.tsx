import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';
import { useTheme } from 'styled-components';

import { Types } from '@permaweb/libs';

import { ViewWrapper } from 'app/styles';
import { Button } from 'components/atoms/Button';
import { IconButton } from 'components/atoms/IconButton';
import { Modal } from 'components/atoms/Modal';
import { ViewHeader } from 'components/atoms/ViewHeader';
import { Transaction } from 'components/organisms/Transaction';
import { ASSETS, URLS } from 'helpers/config';
import { TransactionTabType } from 'helpers/types';
import { checkValidAddress, formatAddress, getTagValue } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { ConsoleInstance } from '../ConsoleInstance';

import * as S from './styles';

export default function TransactionTabs(props: { type: 'explorer' | 'aos' }) {
	const location = useLocation();
	const navigate = useNavigate();
	const theme = useTheme();

	const tabsRef = React.useRef<HTMLDivElement>(null);
	const tabIndexMapRef = React.useRef<Map<string, number>>(new Map());
	const callbacksRef = React.useRef<Map<string, (newTx: Types.GQLNodeResponseType) => void>>(new Map());

	const storageKey = `${props.type}-transactions`;

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const [transactions, setTransactions] = React.useState<TransactionTabType[]>(() => {
		const stored = localStorage.getItem(storageKey);
		if (stored) {
			const parsed = JSON.parse(stored);
			// Migrate old data to include lastRoute and tabKey fields
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
	const [showClearConfirmation, setShowClearConfirmation] = React.useState<boolean>(false);
	const [visitedTabs, setVisitedTabs] = React.useState<Set<number>>(() => new Set([getInitialIndex()]));

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
		const { txId, subPath } = extractTxDetailsFromPath(location.pathname);

		if (txId && !transactions.some((tab) => tab.id === txId)) {
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
			// Update lastRoute for existing tab when route changes
			const tabIndex = transactions.findIndex((tab) => tab.id === txId);
			if (tabIndex !== -1 && tabIndex === activeTabIndex) {
				setTransactions((prev) => {
					const updated = [...prev];
					updated[tabIndex] = { ...updated[tabIndex], lastRoute: location.pathname };
					return updated;
				});
			}
		}
	}, [location.pathname]);

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
		localStorage.setItem(storageKey, JSON.stringify(transactions));
	}, [transactions]);

	function extractTxDetailsFromPath(pathname: string) {
		const parts = pathname.replace(/#.*/, '').split('/').filter(Boolean);
		const txId = parts[1] || '';
		const subPath = parts.slice(2).join('/') || '';

		return { txId, subPath: subPath ? `/${subPath}` : '' };
	}

	function getInitialIndex() {
		if (transactions.length <= 0) return 0;
		let currentTxId = location.pathname.replace(`${URLS[props.type]}/`, '');

		const parts = location.pathname.split('/');
		for (const part of parts) {
			if (checkValidAddress(part)) {
				currentTxId = part;
				break;
			}
		}

		for (let i = 0; i < transactions.length; i++) {
			if (transactions[i].id === currentTxId) return i;
		}

		return 0;
	}

	// Create a stable callback that uses the ref to look up the current index
	const handleTxChangeByKey = React.useCallback(
		(tabKey: string, newTx: Types.GQLNodeResponseType) => {
			const tabIndex = tabIndexMapRef.current.get(tabKey);
			if (tabIndex === undefined) return;

			const name = getTagValue(newTx.node.tags, 'Name');
			const type = getTagValue(newTx.node.tags, 'Type');

			setTransactions((prev) => {
				const updated = [...prev];
				if (updated[tabIndex]) {
					updated[tabIndex] = {
						...updated[tabIndex],
						id: newTx.node.id,
						label: name ?? newTx.node.id,
						type: type ? (type.toLowerCase() as any) : 'message',
					};
				} else {
					updated.push({
						id: newTx.node.id,
						label: name ?? newTx.node.id,
						type: type ? (type.toLowerCase() as any) : 'message',
					});
				}
				return updated;
			});

			const currentParts = window.location.hash.replace('#', '').split('/');
			const currentRoute = currentParts[currentParts.length - 1];

			let toRoute = `${URLS[props.type]}${newTx.node.id}`;

			if (props.type === 'explorer') {
				switch (currentRoute) {
					case 'info':
						toRoute = URLS.explorerInfo(newTx.node.id);
						break;
					case 'messages':
						toRoute = URLS.explorerMessages(newTx.node.id);
						break;
					case 'read':
						toRoute = URLS.explorerRead(newTx.node.id);
						break;
					case 'write':
						toRoute = URLS.explorerWrite(newTx.node.id);
						break;
					case 'aos':
						toRoute = URLS.explorerAOS(newTx.node.id);
						break;
					case 'source':
						toRoute = URLS.explorerSource(newTx.node.id);
						break;
					default:
						break;
				}
			}

			navigate(toRoute);
		},
		[props.type, navigate]
	);

	const handleTabRedirect = (index: number) => {
		setActiveTabIndex(index);
		setVisitedTabs((prev) => new Set(prev).add(index));
		const targetTab = transactions[index];
		const route = targetTab.lastRoute || `${URLS[props.type]}${targetTab.id}`;
		navigate(route);
	};

	const handleAddTab = React.useCallback(
		(id?: string) => {
			const untitledId = id ? id : `untitled-${Date.now()}`;
			const newTab = {
				id: id ?? '',
				label: id ?? '',
				type: null,
				tabKey: `tab-${Date.now()}-${Math.random()}`,
				untitledId: id ? undefined : untitledId, // Track if this is an untitled tab
			} as TransactionTabType;

			setTransactions((prev) => {
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

			navigate(id ? `${URLS[props.type]}${id}` : URLS[props.type]);
		},
		[props.type, navigate]
	);

	const handleDeleteTab = (deletedIndex: number) => {
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

		// Update visited tabs - remove deleted index and adjust indices
		setVisitedTabs((prev) => {
			const newVisited = new Set<number>();
			prev.forEach((idx) => {
				if (idx < deletedIndex) {
					newVisited.add(idx);
				} else if (idx > deletedIndex) {
					newVisited.add(idx - 1);
				}
				// idx === deletedIndex is not added (removed)
			});
			// Ensure the new active tab is marked as visited
			newVisited.add(newActiveIndex);
			return newVisited;
		});

		setTransactions(
			updatedTransactions.length > 0
				? updatedTransactions
				: [{ id: '', label: '', type: null, tabKey: `tab-${Date.now()}-${Math.random()}` }]
		);
		setActiveTabIndex(newActiveIndex);

		if (updatedTransactions.length > 0) {
			const newId = updatedTransactions[newActiveIndex]?.id ?? '';
			navigate(`${URLS[props.type]}${newId}`);
		} else {
			handleClearTabs();
		}
	};

	const handleClearTabs = () => {
		setTransactions([{ id: '', label: '', type: null, tabKey: `tab-${Date.now()}-${Math.random()}` }]);
		setActiveTabIndex(0);
		setVisitedTabs(new Set([0]));
		navigate(URLS[props.type], { replace: true });
		setShowClearConfirmation(false);
	};

	const tabs = React.useMemo(() => {
		return (
			<S.TabsContent ref={tabsRef} className={'scroll-wrapper-hidden'}>
				{transactions.map((tx, index) => {
					let label = language.untitled;
					if (tx.label) {
						label = checkValidAddress(tx.label) ? formatAddress(tx.label, false) : tx.label;
					}
					return (
						<React.Fragment key={index}>
							<S.TabAction active={index === activeTabIndex} onClick={() => handleTabRedirect(index)}>
								<div className={'icon-wrapper'}>
									<div className={'normal-icon'}>
										<ReactSVG src={ASSETS[tx.type] ?? ASSETS.transaction} />
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
								{label}
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
	}, [transactions, activeTabIndex, language]);

	return (
		<>
			<S.Wrapper>
				<S.HeaderWrapper>
					<ViewHeader
						header={language[props.type]}
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
						<ViewWrapper>{tabs}</ViewWrapper>
						<S.PlaceholderFull id={'placeholder-end'} />
					</S.TabsWrapper>
				</S.HeaderWrapper>
				<ViewWrapper>
					<>
						{transactions.map((tx: TransactionTabType, index) => {
							// Update the index mapping ref
							tabIndexMapRef.current.set(tx.tabKey!, index);

							// Create or get stable callback for this tab
							if (!callbacksRef.current.has(tx.tabKey!)) {
								callbacksRef.current.set(tx.tabKey!, (newTx: Types.GQLNodeResponseType) => {
									handleTxChangeByKey(tx.tabKey!, newTx);
								});
							}
							const onTxChange = callbacksRef.current.get(tx.tabKey!)!;

							const isActive = index === activeTabIndex;
							const hasBeenVisited = visitedTabs.has(index);

							// Only render tabs that have been visited (to preserve their state once loaded)
							// But they'll only load their data when they become active for the first time
							if (!hasBeenVisited) {
								return null;
							}

							return (
								<S.TransactionWrapper key={tx.tabKey} active={isActive}>
									{props.type === 'explorer' ? (
										<Transaction
											key={tx.tabKey}
											txId={tx.id}
											type={tx.type}
											active={isActive}
											onTxChange={onTxChange}
											handleMessageOpen={handleAddTab}
											tabKey={tx.tabKey}
										/>
									) : (
										<ConsoleInstance key={tx.tabKey} processId={tx.id} active={isActive} onTxChange={onTxChange} />
									)}
								</S.TransactionWrapper>
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
