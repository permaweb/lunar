import React from 'react';

import * as S from './styles';

export default function Tabs(props: {
	label: string;
	tabs: { id: string; label: string; content: React.ReactNode; disabled?: boolean }[];
}) {
	const id = React.useId();
	const tabRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
	const [selectedId, setSelectedId] = React.useState(() => props.tabs.find((tab) => !tab.disabled)?.id);
	const enabledTabs = props.tabs.filter((tab) => !tab.disabled);
	const activeId = enabledTabs.some((tab) => tab.id === selectedId) ? selectedId : enabledTabs[0]?.id;

	function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, tabId: string) {
		const index = enabledTabs.findIndex((tab) => tab.id === tabId);
		let nextIndex: number;

		switch (event.key) {
			case 'ArrowRight':
				nextIndex = (index + 1) % enabledTabs.length;
				break;
			case 'ArrowLeft':
				nextIndex = (index - 1 + enabledTabs.length) % enabledTabs.length;
				break;
			case 'Home':
				nextIndex = 0;
				break;
			case 'End':
				nextIndex = enabledTabs.length - 1;
				break;
			default:
				return;
		}

		event.preventDefault();
		const nextTab = enabledTabs[nextIndex];
		if (!nextTab) return;
		setSelectedId(nextTab.id);
		tabRefs.current.get(nextTab.id)?.focus();
	}

	return (
		<S.Wrapper>
			<S.List role="tablist" aria-label={props.label}>
				{props.tabs.map((tab) => (
					<S.Tab
						key={tab.id}
						ref={(element) => {
							if (element) tabRefs.current.set(tab.id, element);
							else tabRefs.current.delete(tab.id);
						}}
						id={`${id}-tab-${tab.id}`}
						type="button"
						role="tab"
						aria-selected={tab.id === activeId}
						aria-controls={`${id}-panel-${tab.id}`}
						tabIndex={tab.id === activeId ? 0 : -1}
						disabled={tab.disabled}
						onClick={() => setSelectedId(tab.id)}
						onKeyDown={(event) => handleKeyDown(event, tab.id)}
					>
						{tab.label}
					</S.Tab>
				))}
			</S.List>
			<S.Content className="scroll-wrapper">
				{props.tabs.map((tab) => (
					<S.Panel
						key={tab.id}
						id={`${id}-panel-${tab.id}`}
						role="tabpanel"
						aria-labelledby={`${id}-tab-${tab.id}`}
						hidden={tab.id !== activeId}
						tabIndex={0}
					>
						{tab.content}
					</S.Panel>
				))}
			</S.Content>
		</S.Wrapper>
	);
}
