import React from 'react';
import { ReactSVG } from 'react-svg';

import { ViewWrapper } from 'app/styles';
import { Button } from 'components/atoms/Button';
import { IconButton } from 'components/atoms/IconButton';
import { Modal } from 'components/atoms/Modal';
import { ViewHeader } from 'components/atoms/ViewHeader';
import { ASSETS } from 'helpers/config';
import { BaseTabType } from 'helpers/types';

import * as S from './styles';
import { TabsContainerProps } from './types';

export default function ViewTabs<T extends BaseTabType>(props: TabsContainerProps<T>) {
	const tabsRef = React.useRef<HTMLDivElement>(null);
	const [showClearConfirmation, setShowClearConfirmation] = React.useState<boolean>(false);
	const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
	const [dropPosition, setDropPosition] = React.useState<{ index: number; side: 'left' | 'right' } | null>(null);
	const mouseDownPosRef = React.useRef<{ x: number; y: number } | null>(null);
	const didDragOccurRef = React.useRef<boolean>(false);

	React.useEffect(() => {
		if (props.onMount) {
			props.onMount(tabsRef);
		}
	}, []);

	React.useEffect(() => {
		const el = tabsRef.current;
		if (!el) return;

		const onWheel = (e: WheelEvent) => {
			// Detect trackpad: trackpads provide deltaX values for horizontal gestures
			if (e.deltaX !== 0) {
				// Prevent elastic/rubber-band scrolling at boundaries
				const atLeftBoundary = el.scrollLeft <= 0 && e.deltaX < 0;
				const atRightBoundary = el.scrollLeft >= el.scrollWidth - el.clientWidth && e.deltaX > 0;

				if (atLeftBoundary || atRightBoundary) {
					e.preventDefault();
				}
				return;
			}

			// For vertical scroll without horizontal (mouse wheel), convert to horizontal scroll
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

	const handleMouseDown = (e: React.MouseEvent) => {
		mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
		didDragOccurRef.current = false;
	};

	const handleTabClick = (e: React.MouseEvent, index: number) => {
		// If a drag just occurred, prevent the click
		if (didDragOccurRef.current) {
			e.preventDefault();
			e.stopPropagation();
			didDragOccurRef.current = false;
			mouseDownPosRef.current = null;
			return;
		}

		// Check if mouse moved significantly (indicating a drag, not a click)
		if (mouseDownPosRef.current) {
			const dx = Math.abs(e.clientX - mouseDownPosRef.current.x);
			const dy = Math.abs(e.clientY - mouseDownPosRef.current.y);
			if (dx > 5 || dy > 5) {
				// Mouse moved, this was a drag not a click
				mouseDownPosRef.current = null;
				return;
			}
		}

		mouseDownPosRef.current = null;
		props.onActiveTabChange(index);
		props.onVisitedTabsChange(new Set(props.visitedTabs).add(index));
	};

	const handleAddTab = React.useCallback(() => {
		if (props.onAddTab) {
			props.onAddTab();
		} else {
			const newTab = {
				...props.defaultTab,
				tabKey: `tab-${Date.now()}-${Math.random()}`,
			} as T;

			const updated = [...props.tabs, newTab];
			const newIndex = updated.length - 1;
			props.onTabsChange(updated);
			props.onActiveTabChange(newIndex);
			props.onVisitedTabsChange(new Set(props.visitedTabs).add(newIndex));

			setTimeout(() => {
				if (tabsRef.current) {
					tabsRef.current.scrollTo({ left: tabsRef.current.scrollWidth });
				}
			}, 0);
		}
	}, [props.tabs.length, props.defaultTab, props.onAddTab]);

	const handleDeleteTab = (deletedIndex: number) => {
		if (props.onDeleteTab) {
			props.onDeleteTab(deletedIndex);
			return;
		}

		const updatedTabs = props.tabs.filter((_, i) => i !== deletedIndex);

		let newActiveIndex: number;

		if (deletedIndex < props.activeTabIndex) {
			newActiveIndex = props.activeTabIndex - 1;
		} else if (deletedIndex === props.activeTabIndex) {
			newActiveIndex = updatedTabs.length > deletedIndex ? deletedIndex : updatedTabs.length - 1;
		} else {
			newActiveIndex = props.activeTabIndex;
		}

		newActiveIndex = Math.max(0, newActiveIndex);

		// Update visited tabs
		const newVisited = new Set<number>();
		props.visitedTabs.forEach((idx) => {
			if (idx < deletedIndex) {
				newVisited.add(idx);
			} else if (idx > deletedIndex) {
				newVisited.add(idx - 1);
			}
		});
		newVisited.add(newActiveIndex);
		props.onVisitedTabsChange(newVisited);

		if (updatedTabs.length > 0) {
			props.onTabsChange(updatedTabs);
			props.onActiveTabChange(newActiveIndex);
		} else {
			handleClearTabs();
		}
	};

	const handleClearTabs = () => {
		if (props.onClearTabs) {
			props.onClearTabs();
		} else {
			const newTab = {
				...props.defaultTab,
				tabKey: `tab-${Date.now()}-${Math.random()}`,
			} as T;
			props.onTabsChange([newTab]);
			props.onActiveTabChange(0);
			props.onVisitedTabsChange(new Set([0]));
		}
		setShowClearConfirmation(false);
	};

	const handleDragStart = (e: React.DragEvent, index: number) => {
		e.stopPropagation();
		setDraggedIndex(index);
		didDragOccurRef.current = true; // Set to true immediately when drag starts
		e.dataTransfer.effectAllowed = 'move';
	};

	const handleDragOver = (e: React.DragEvent, index: number) => {
		e.preventDefault();
		if (draggedIndex === null) return;

		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const midpoint = rect.left + rect.width / 2;
		const side = e.clientX < midpoint ? 'left' : 'right';

		setDropPosition({ index, side });
	};

	const handleDragEnd = () => {
		if (draggedIndex === null || dropPosition === null) {
			setDraggedIndex(null);
			setDropPosition(null);
			return;
		}

		// Calculate the actual drop index based on side
		// When we splice, we first remove the item, then insert it
		// So we need to account for the removal shifting indices
		let targetIndex: number;

		if (dropPosition.side === 'left') {
			targetIndex = dropPosition.index;
		} else {
			targetIndex = dropPosition.index + 1;
		}

		// If we're moving an item to the right (to a higher index),
		// the removal happens first, shifting everything left by 1
		// So we need to subtract 1 from the target
		if (draggedIndex < targetIndex) {
			targetIndex = targetIndex - 1;
		}

		// Don't do anything if dropping in the same position
		if (draggedIndex === targetIndex) {
			setDraggedIndex(null);
			setDropPosition(null);
			// Reset the flag after a delay
			setTimeout(() => {
				didDragOccurRef.current = false;
				mouseDownPosRef.current = null;
			}, 300);
			return;
		}

		const reorderedTabs = [...props.tabs];
		const [movedTab] = reorderedTabs.splice(draggedIndex, 1);
		reorderedTabs.splice(targetIndex, 0, movedTab);

		// Update active index to follow the moved tab
		let newActiveIndex = props.activeTabIndex;
		if (draggedIndex === props.activeTabIndex) {
			// The dragged tab was active, keep it active at its new position
			newActiveIndex = targetIndex;
		} else if (draggedIndex < props.activeTabIndex && targetIndex >= props.activeTabIndex) {
			// Tab moved from before active to after active
			newActiveIndex = props.activeTabIndex - 1;
		} else if (draggedIndex > props.activeTabIndex && targetIndex <= props.activeTabIndex) {
			// Tab moved from after active to before active
			newActiveIndex = props.activeTabIndex + 1;
		}

		// Update visited tabs indices
		const newVisited = new Set<number>();
		props.visitedTabs.forEach((idx) => {
			let newIdx = idx;
			if (idx === draggedIndex) {
				newIdx = targetIndex;
			} else if (draggedIndex < targetIndex) {
				if (idx > draggedIndex && idx <= targetIndex) {
					newIdx = idx - 1;
				}
			} else {
				if (idx >= targetIndex && idx < draggedIndex) {
					newIdx = idx + 1;
				}
			}
			newVisited.add(newIdx);
		});

		// Update state - pass true to skipNavigation to prevent redirect during drag
		props.onTabsChange(reorderedTabs);
		props.onActiveTabChange(newActiveIndex, true);
		props.onVisitedTabsChange(newVisited);

		setDraggedIndex(null);
		setDropPosition(null);

		// Keep the flag set longer to ensure all click events are blocked
		setTimeout(() => {
			didDragOccurRef.current = false;
			mouseDownPosRef.current = null;
		}, 500);
	};

	const isAnyLoading = React.useMemo(() => {
		if (!props.loadingStates) return false;
		return Array.from(props.loadingStates.values()).some((loading) => loading);
	}, [props.loadingStates]);

	const tabElements = React.useMemo(() => {
		return (
			<S.TabsContent ref={tabsRef} className={'scroll-wrapper-hidden'}>
				{props.tabs.map((tab, index) => {
					const label = props.renderTabLabel(tab);
					const showLeftIndicator = dropPosition?.index === index && dropPosition?.side === 'left';
					const showRightIndicator = dropPosition?.index === index && dropPosition?.side === 'right';
					return (
						<React.Fragment key={tab.tabKey}>
							<S.TabAction
								active={index === props.activeTabIndex}
								onMouseDown={handleMouseDown}
								onClick={(e) => handleTabClick(e, index)}
								disabled={isAnyLoading}
								data-tab-index={index}
								draggable={!isAnyLoading}
								onDragStart={(e) => handleDragStart(e, index)}
								onDragOver={(e) => handleDragOver(e, index)}
								onDragEnd={handleDragEnd}
								style={{
									cursor: isAnyLoading ? 'default' : 'pointer',
								}}
							>
								{showLeftIndicator && <S.DropIndicator side={'left'} />}
								{showRightIndicator && <S.DropIndicator side={'right'} />}
								{index === props.activeTabIndex && <S.TabActiveIndicator />}
								<div className={'icon-wrapper'}>
									<div className={'normal-icon'}>
										<ReactSVG src={props.renderTabIcon(tab)} />
									</div>
									<div className={'delete-icon'}>
										<IconButton
											type={'primary'}
											src={ASSETS.close}
											handlePress={() => {
												handleDeleteTab(index);
											}}
											dimensions={{ wrapper: 10, icon: 10 }}
											disabled={isAnyLoading}
										/>
									</div>
								</div>
								{label}
							</S.TabAction>
						</React.Fragment>
					);
				})}
				<S.NewTab active={false} onClick={() => handleAddTab()} disabled={isAnyLoading}>
					<ReactSVG src={ASSETS.add} />
					{props.languageLabels.newTab}
				</S.NewTab>
				<S.Placeholder />
			</S.TabsContent>
		);
	}, [props.tabs, props.activeTabIndex, props.languageLabels, isAnyLoading, draggedIndex, dropPosition]);

	return (
		<>
			<S.Wrapper>
				<S.HeaderWrapper>
					<ViewHeader
						header={props.header}
						actions={[
							<Button
								type={'primary'}
								label={props.languageLabels.newTab}
								handlePress={() => handleAddTab()}
								icon={ASSETS.add}
								iconLeftAlign
							/>,
							<Button
								type={'primary'}
								label={props.languageLabels.clearTabs}
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
						{props.tabs.map((tab: T, index) => {
							const isActive = index === props.activeTabIndex;
							const hasBeenVisited = props.visitedTabs.has(index);

							if (!hasBeenVisited) {
								return null;
							}

							return (
								<S.ContentWrapper key={tab.tabKey} active={isActive}>
									{props.renderContent(tab, index, isActive)}
								</S.ContentWrapper>
							);
						})}
					</>
				</ViewWrapper>
			</S.Wrapper>
			{showClearConfirmation && (
				<Modal header={props.languageLabels.clearTabs} handleClose={() => setShowClearConfirmation(false)}>
					<S.ModalWrapper>
						<S.ModalBodyWrapper>
							<p>{props.languageLabels.tabsDeleteConfirmationInfo}</p>
						</S.ModalBodyWrapper>
						<S.ModalActionsWrapper>
							<Button
								type={'primary'}
								label={props.languageLabels.cancel}
								handlePress={() => setShowClearConfirmation(false)}
							/>
							<Button
								type={'primary'}
								label={props.languageLabels.clearTabs}
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
