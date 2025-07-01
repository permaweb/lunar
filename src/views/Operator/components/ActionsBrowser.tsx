import React, { useState } from 'react';

import { device_actions } from '../actions';
import * as S from '../styles/index';

interface IActionsBrowserProps {
	onActionSelect: (deviceAction: any, actionKey: string, action: any) => void;
}

export const ActionsBrowser: React.FC<IActionsBrowserProps> = ({ onActionSelect }) => {
	const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
		// Initialize all groups as collapsed
		const initialState: Record<string, boolean> = {};
		device_actions.forEach((deviceAction) => {
			initialState[deviceAction.id] = false;
		});
		return initialState;
	});

	const toggleGroupExpanded = (groupId: string) => {
		setExpandedGroups((prev) => ({
			...prev,
			[groupId]: !prev[groupId],
		}));
	};

	return (
		<S.Section className={'Small'}>
			<S.Header>Actions</S.Header>
			<S.LayoutContent>
				<S.DeviceOptions>
					{device_actions.map((deviceAction) => {
						const isExpanded = expandedGroups[deviceAction.id];
						return (
							<S.ActionDeviceGroup key={deviceAction.id}>
								<S.ActionDeviceHeader
									onClick={() => toggleGroupExpanded(deviceAction.id)}
									className={isExpanded ? 'expanded' : 'collapsed'}
								>
									<span>{deviceAction.label}</span>
									<S.ExpandIcon className={isExpanded ? 'expanded' : 'collapsed'}>
										{isExpanded ? '▼' : '▶'}
									</S.ExpandIcon>
								</S.ActionDeviceHeader>
								{isExpanded &&
									Object.keys(deviceAction.actions).map((actionKey) => {
										const action = deviceAction.actions[actionKey];
										return (
											<S.ActionItem key={actionKey} onClick={() => onActionSelect(deviceAction, actionKey, action)}>
												<S.ActionContent>
													<S.ActionName>{actionKey}</S.ActionName>
													<S.ActionDescription>{action.description}</S.ActionDescription>
												</S.ActionContent>
												<S.MethodBadge method={action.method}>{action.method}</S.MethodBadge>
											</S.ActionItem>
										);
									})}
							</S.ActionDeviceGroup>
						);
					})}
				</S.DeviceOptions>
			</S.LayoutContent>
		</S.Section>
	);
};
