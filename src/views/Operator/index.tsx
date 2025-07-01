import { useState } from 'react';

import { Notification } from 'components/atoms/Notification';
import { NotificationType } from 'helpers/types';

import { useOperatorSettings } from './hooks/useOperatorSettings';
import { usePipeline } from './hooks/usePipeline';
import * as S from './styles/index';
import {
	ActionsBrowser,
	DeviceConfiguration,
	FileOperations,
	PipelineView,
	ResultsDisplay,
	ServerManager,
	TabNavigation,
} from './components';
import { useHeaderStyling } from './hooks';

export default function OperatorView() {
	const [activeTab, setActiveTab] = useState(0);
	const [notification, setNotification] = useState<NotificationType | null>(null);

	const { settings, updateSettings } = useOperatorSettings();

	useHeaderStyling();

	const {
		pipeline,
		draggedIndex,
		dragOverIndex,
		expandedParams,
		results,
		expandedResults,
		isExecuting,
		currentExecutingIndex,
		executionProgress,
		addToPipeline,
		removeFromPipeline,
		updateActionParameter,
		clearPipeline,
		executePipeline,
		handleDragStart,
		handleDragEnter,
		handleContainerDragOver,
		handleDrop,
		handleDragEnd,
		toggleParameterExpansion,
		toggleResultExpansion,
	} = usePipeline(settings, updateSettings);

	const handleNotification = (notification: NotificationType) => {
		setNotification(notification);
	};

	return (
		<S.Wrapper>
			{/* Header Area with File, Tabs, and Server Manager on same line */}
			<S.HeaderArea>
				<S.UnifiedHeaderRow>
					<S.ToolbarLeft>
						<FileOperations settings={settings} setSettings={updateSettings} onNotification={handleNotification} />
					</S.ToolbarLeft>

					<S.TabsCenter>
						<TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
					</S.TabsCenter>

					<S.ToolbarRight>
						<ServerManager settings={settings} setSettings={updateSettings} />
					</S.ToolbarRight>
				</S.UnifiedHeaderRow>

				{/* Notification */}
				{notification && (
					<Notification
						message={notification.message}
						type={notification.status}
						callback={() => setNotification(null)}
					/>
				)}
			</S.HeaderArea>

			{/* Layout */}
			{activeTab === 0 && (
				<S.ConfigurationMainGrid>
					<DeviceConfiguration settings={settings} setSettings={updateSettings} />
				</S.ConfigurationMainGrid>
			)}
			{activeTab === 1 && (
				<S.PipelineMainGrid>
					<ActionsBrowser onActionSelect={addToPipeline} />

					<PipelineView
						pipeline={pipeline}
						settings={settings}
						draggedIndex={draggedIndex}
						dragOverIndex={dragOverIndex}
						expandedParams={expandedParams}
						isExecuting={isExecuting}
						currentExecutingIndex={currentExecutingIndex}
						executionProgress={executionProgress}
						onClearPipeline={clearPipeline}
						onExecutePipeline={executePipeline}
						onRemoveFromPipeline={removeFromPipeline}
						onUpdateActionParameter={updateActionParameter}
						onToggleParameterExpansion={toggleParameterExpansion}
						onDragStart={handleDragStart}
						onDragEnter={handleDragEnter}
						onContainerDragOver={handleContainerDragOver}
						onDrop={handleDrop}
						onDragEnd={handleDragEnd}
					/>

					<ResultsDisplay
						results={results}
						expandedResults={expandedResults}
						onToggleResultExpansion={toggleResultExpansion}
					/>
				</S.PipelineMainGrid>
			)}
		</S.Wrapper>
	);
}
