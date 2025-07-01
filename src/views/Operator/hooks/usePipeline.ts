import { useState } from 'react';

import { IAction, IPipelineResult, ISettings } from '../types';
import {
	constructActionUrl,
	findDeviceAction,
	generateUniqueId,
	initializeParameters,
	prepareRequestData,
	validateActionExecution,
} from '../utils';

export const usePipeline = (settings: ISettings, setSettings: (settings: ISettings) => void) => {
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
	const [expandedParams, setExpandedParams] = useState<Record<string, boolean>>({});
	const [results, setResults] = useState<IPipelineResult[]>([]);
	const [expandedResults, setExpandedResults] = useState<Record<number, boolean>>({});
	const [isExecuting, setIsExecuting] = useState<boolean>(false);
	const [currentExecutingIndex, setCurrentExecutingIndex] = useState<number | null>(null);
	const [executionProgress, setExecutionProgress] = useState<number>(0);

	const pipeline = settings.actions || [];

	// Add action to pipeline
	const addToPipeline = (deviceAction: any, actionKey: string, action: any) => {
		const initialParameters = initializeParameters(action, settings.currentServer);

		const newItem: IAction = {
			id: deviceAction.id,
			deviceId: deviceAction.id,
			deviceLabel: deviceAction.label,
			actionKey,
			action,
			uniqueId: generateUniqueId(deviceAction.id, actionKey),
			parameters: initialParameters,
			baseUrl: deviceAction.baseUrl,
		};

		const updatedSettings = {
			...settings,
			actions: [...pipeline, newItem],
		};
		setSettings(updatedSettings);
	};

	// Remove action from pipeline
	const removeFromPipeline = (uniqueId: string) => {
		const updatedSettings = {
			...settings,
			actions: pipeline.filter((item) => item.uniqueId !== uniqueId),
		};
		setSettings(updatedSettings);
	};

	// Update action parameter
	const updateActionParameter = (uniqueId: string, paramName: string, value: any) => {
		const updatedActions = pipeline.map((item) => {
			if (item.uniqueId === uniqueId) {
				return {
					...item,
					parameters: {
						...item.parameters,
						[paramName]: value,
					},
				};
			}
			return item;
		});

		const updatedSettings = {
			...settings,
			actions: updatedActions,
		};
		setSettings(updatedSettings);
	};

	// Clear pipeline
	const clearPipeline = () => {
		setSettings({ ...settings, actions: [] });
	};

	// Drag and drop functions
	const handleDragStart = (e: React.DragEvent, index: number) => {
		setDraggedIndex(index);
		e.dataTransfer.effectAllowed = 'move';
		// Disable default drag image
		const dragImage = new Image();
		dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
		e.dataTransfer.setDragImage(dragImage, 0, 0);
	};

	const handleDragEnter = (e: React.DragEvent, index: number) => {
		e.preventDefault();
		if (draggedIndex !== null) {
			const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
			const mouseY = e.clientY;
			const itemMiddle = rect.top + rect.height / 2;

			// If dragging over the bottom half of the last item, show drop at end
			if (index === pipeline.length - 1 && mouseY > itemMiddle) {
				setDragOverIndex(pipeline.length);
			} else {
				setDragOverIndex(index);
			}
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
	};

	const handleContainerDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		const containerRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const mouseY = e.clientY;
		const containerBottom = containerRect.bottom - 16; // Account for padding

		if (mouseY > containerBottom - 20) {
			setDragOverIndex(pipeline.length);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();

		if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
			setDraggedIndex(null);
			setDragOverIndex(null);
			return;
		}

		const newPipeline = [...pipeline];
		const draggedItem = newPipeline[draggedIndex];

		// Remove the dragged item
		newPipeline.splice(draggedIndex, 1);

		// Insert at new position
		let insertIndex = dragOverIndex;
		if (dragOverIndex > draggedIndex) {
			insertIndex = dragOverIndex - 1;
		}
		// Handle dropping at the end
		if (dragOverIndex >= pipeline.length) {
			insertIndex = newPipeline.length;
		}

		newPipeline.splice(insertIndex, 0, draggedItem);

		const updatedSettings = {
			...settings,
			actions: newPipeline,
		};
		setSettings(updatedSettings);
		setDraggedIndex(null);
		setDragOverIndex(null);
	};

	const handleDragEnd = () => {
		setDraggedIndex(null);
		setDragOverIndex(null);
	};

	// Parameter expansion
	const toggleParameterExpansion = (uniqueId: string) => {
		setExpandedParams((prev) => ({
			...prev,
			[uniqueId]: !prev[uniqueId],
		}));
	};

	// Result expansion
	const toggleResultExpansion = (index: number) => {
		setExpandedResults((prev) => ({
			...prev,
			[index]: !prev[index],
		}));
	};

	// Execute single action
	const executeAction = async (pipelineItem: IAction): Promise<any> => {
		const { action, parameters, deviceLabel, actionKey } = pipelineItem;

		const validation = validateActionExecution(actionKey, action, parameters, settings.servers);
		if (!validation.isValid) {
			throw new Error(validation.error);
		}

		const { server } = validation;
		const deviceAction = findDeviceAction(deviceLabel);
		if (!deviceAction) {
			throw new Error(`Device "${deviceLabel}" not found`);
		}

		if (!deviceAction.baseUrl) {
			throw new Error(`Base URL missing for device ${deviceLabel}`);
		}

		const fullUrl = constructActionUrl(server!, deviceAction, action.url);
		const requestData = prepareRequestData(parameters, server!.configuration);

		// Make HTTP request
		const requestOptions: RequestInit = {
			method: action.method,
			headers: {
				// 'accept-bundle': 'true',
			},
		};

		// Add body for POST requests
		if (action.method === 'POST' && Object.keys(requestData).length > 0) {
			requestOptions.body = JSON.stringify(requestData);
		}

		console.log(`Executing: ${action.method} ${fullUrl}`);
		console.log('Request data:', requestData);

		const response = await fetch(fullUrl, requestOptions);
		console.log(response);

		if (!response.ok) {
			const errorText = await response.text().catch(() => 'Unknown error');
			throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
		}

		const result = await response.text();
		return result;
	};

	// Execute entire pipeline
	const executePipeline = async () => {
		if (pipeline.length === 0) {
			return;
		}

		console.log('Starting pipeline execution...');

		// Initialize execution state
		setIsExecuting(true);
		setCurrentExecutingIndex(null);
		setExecutionProgress(0);
		setResults([]);
		setExpandedResults({});

		try {
			// Execute actions sequentially and update results one at a time
			for await (const [index, item] of pipeline.entries()) {
				console.log(`Executing step ${index + 1}/${pipeline.length}: ${item.deviceLabel} - ${item.actionKey}`);

				// Update current executing action
				setCurrentExecutingIndex(index);
				setExecutionProgress((index / pipeline.length) * 100);

				try {
					const result = await executeAction(item);
					console.log(`Step ${index + 1} completed successfully`);

					const newResult = {
						actionKey: item.actionKey,
						deviceLabel: item.deviceLabel,
						serverName: item.parameters?.server || 'Unknown',
						result: result,
						success: true,
					};

					// Update results immediately after each action completes
					setResults((prevResults) => [...prevResults, newResult]);
				} catch (error: any) {
					console.error(`Step ${index + 1} failed:`, error);

					const newResult = {
						actionKey: item.actionKey,
						deviceLabel: item.deviceLabel,
						serverName: item.parameters?.server || 'Unknown',
						result: null,
						success: false,
						error: error.message,
					};

					// Update results immediately even for failed actions
					setResults((prevResults) => [...prevResults, newResult]);
				}
			}

			// Mark execution as complete
			setExecutionProgress(100);
			setCurrentExecutingIndex(null);
			console.log('Pipeline execution completed!');
		} catch (error) {
			console.error('Pipeline execution failed:', error);
		} finally {
			setIsExecuting(false);
		}
	};

	return {
		// State
		pipeline,
		draggedIndex,
		dragOverIndex,
		expandedParams,
		results,
		expandedResults,
		isExecuting,
		currentExecutingIndex,
		executionProgress,

		// Actions
		addToPipeline,
		removeFromPipeline,
		updateActionParameter,
		clearPipeline,
		executePipeline,

		// Drag and drop
		handleDragStart,
		handleDragEnter,
		handleDragOver,
		handleContainerDragOver,
		handleDrop,
		handleDragEnd,

		// UI state
		toggleParameterExpansion,
		toggleResultExpansion,
	};
};
