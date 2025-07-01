import React from 'react';

import { TABS } from '../constants';
import * as S from '../styles/index';

interface ITabNavigationProps {
	activeTab: number;
	setActiveTab?: (tab: number) => void;
}

export const TabNavigation: React.FC<ITabNavigationProps> = ({ activeTab, setActiveTab }) => {
	const tabs = [
		{ id: TABS.CONFIGURATION, label: 'Configuration' },
		{ id: TABS.ACTIONS, label: 'Action Pipeline' },
	];

	return (
		<S.TabsWrapper>
			{tabs.map((tab) => (
				<S.Tab key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab?.(tab.id)}>
					{tab.label}
				</S.Tab>
			))}
		</S.TabsWrapper>
	);
};
