import React, { useEffect, useMemo, useState } from 'react';

import { Button } from 'components/atoms/Button';
import { FormField } from 'components/atoms/FormField';
import { IconButton } from 'components/atoms/IconButton';
import { Select } from 'components/atoms/Select';
import JSONWriter from 'components/molecules/JSONWriter/JSONWriter';
import { ASSETS } from 'helpers/config';
import { ValidationType } from 'helpers/types';

import { IAction, IServer, ISettings } from '../index';

import { device_actions } from './actions';
import { devices } from './devices';
import * as S from './styles';

// Helper function to remove empty values from data
const cleanEmptyValues = (obj: any): any => {
	if (Array.isArray(obj)) {
		const cleanedArray = obj
			.map((item) => cleanEmptyValues(item))
			.filter((item) => {
				// Remove empty objects, empty strings, null, undefined
				if (item === null || item === undefined || item === '') return false;
				if (typeof item === 'object' && Object.keys(item).length === 0) return false;
				return true;
			});
		return cleanedArray.length > 0 ? cleanedArray : undefined;
	}

	if (obj !== null && typeof obj === 'object') {
		const cleanedObj: any = {};

		Object.keys(obj).forEach((key) => {
			const value = obj[key];

			// Skip empty strings, null, undefined, zero-length strings, and zero values
			if (value === null || value === undefined) return;
			if (typeof value === 'string' && value.trim() === '') return;
			if (typeof value === 'number' && (isNaN(value) || value === 0)) return;

			const cleanedValue = cleanEmptyValues(value);

			// Only include non-empty values
			if (cleanedValue !== undefined && cleanedValue !== null) {
				cleanedObj[key] = cleanedValue;
			}
		});

		return Object.keys(cleanedObj).length > 0 ? cleanedObj : undefined;
	}

	// Handle primitive values
	if (typeof obj === 'string') {
		return obj.trim() === '' ? undefined : obj;
	}
	if (typeof obj === 'number') {
		return isNaN(obj) || obj === 0 ? undefined : obj;
	}

	return obj;
};

// Parameter configuration component
const ParameterField = ({
	param,
	value,
	onChange,
	servers,
}: {
	param: any;
	value: any;
	onChange: (value: any) => void;
	servers: IServer[];
}) => {
	switch (param.type) {
		case 'server':
			const placeholderOption = { id: '', label: 'Select server...' };
			const serverOptions = [
				placeholderOption,
				...servers.map((server) => ({
					id: server.name,
					label: `${server.name} (${server.url})`,
				})),
			];

			const activeServerOption = value
				? serverOptions.find((option) => option.id === value) || placeholderOption
				: placeholderOption;

			return (
				<S.ParameterField>
					<Select
						label={param.name}
						options={serverOptions}
						activeOption={activeServerOption}
						setActiveOption={(option) => onChange(option.id === '' ? '' : option.id)}
						disabled={false}
					/>
				</S.ParameterField>
			);
		case 'json':
			return (
				<S.ParameterField>
					<S.ParameterLabel>{param.name}</S.ParameterLabel>
					<S.JSONParameterWrapper>
						<JSONWriter
							initialData={value || {}}
							handleChange={(jsonData) => onChange(jsonData)}
							loading={false}
							hideButton={true}
							ignoreOnEnter={true}
							alt1={true}
						/>
					</S.JSONParameterWrapper>
				</S.ParameterField>
			);
		default:
			return (
				<S.ParameterField>
					<S.ParameterLabel>{param.name}</S.ParameterLabel>
					<S.ParameterInput
						type="text"
						value={value || ''}
						onChange={(e) => onChange(e.target.value)}
						placeholder={`Enter ${param.name}...`}
					/>
				</S.ParameterField>
			);
	}
};

// Form generator component
const ConfigFormField = ({
	fieldKey,
	fieldConfig,
	value,
	onChange,
	path = '',
}: {
	fieldKey: string;
	fieldConfig: any;
	value: any;
	onChange: (path: string, value: any) => void;
	path?: string;
}) => {
	const fullPath = path ? `${path}.${fieldKey}` : fieldKey;

	const handleChange = (newValue: any) => {
		onChange(fullPath, newValue);
	};

	const renderField = () => {
		switch (fieldConfig.type) {
			case 'json':
				return (
					<S.JSONWriterWrapper>
						<JSONWriter
							initialData={value}
							handleSubmit={(jsonData) => handleChange(jsonData)}
							ignoreOnEnter={true}
							alt1={true}
							handleChange={(jsonData) => handleChange(jsonData)}
							loading={false}
							hideButton={true}
						/>
					</S.JSONWriterWrapper>
				);

			case 'array':
				const arrayValue = Array.isArray(value) ? value : [];
				return (
					<S.ArrayContainer>
						{arrayValue.map((item: any, index: number) => (
							<S.ArrayItem key={index}>
								<S.ArrayItemHeader>
									<strong>{index}</strong>
									<Button
										type={'alt3'}
										label={'Remove'}
										handlePress={() => {
											const newArray = arrayValue.filter((_: any, i: number) => i !== index);
											handleChange(newArray);
										}}
									/>
								</S.ArrayItemHeader>
								<S.ArrayItemContent>
									{fieldConfig.items &&
										Object.keys(fieldConfig.items).map((itemKey) => (
											<ConfigFormField
												key={itemKey}
												fieldKey={itemKey}
												fieldConfig={fieldConfig.items[itemKey]}
												value={item[itemKey]}
												onChange={(itemPath, itemValue) => {
													const newArray = [...arrayValue];
													newArray[index] = { ...newArray[index], [itemKey]: itemValue };
													handleChange(newArray);
												}}
												path=""
											/>
										))}
								</S.ArrayItemContent>
							</S.ArrayItem>
						))}
					</S.ArrayContainer>
				);
		}
	};

	// For basic field types, use FormField with built-in labeling
	if (fieldConfig.type === 'string' || fieldConfig.type === 'number' || !fieldConfig.type) {
		// Create validation based on field configuration
		const validateField = (val: any): ValidationType => {
			const stringValue = String(val || '');
			const numericValue = Number(val || 0);

			// Skip validation for empty values
			if (!val && val !== 0) {
				return { status: false, message: null };
			}

			// String length validation
			if (fieldConfig.type === 'string' && fieldConfig.length) {
				if (stringValue.length !== fieldConfig.length) {
					return {
						status: true,
						message: `Must be exactly ${fieldConfig.length} characters`,
					};
				}
			}

			// Number minimum value validation
			if (fieldConfig.type === 'number' && fieldConfig.min_value !== undefined) {
				if (numericValue < fieldConfig.min_value) {
					return {
						status: true,
						message: `Must be at least ${fieldConfig.min_value}`,
					};
				}
			}

			return { status: false, message: null };
		};

		const validationState = validateField(value);

		return (
			<S.ConfigurationFormFieldWrapper className={fieldConfig.size}>
				<FormField
					label={fieldKey.replace(/_/g, ' ')}
					tooltip={fieldConfig.description}
					value={value || ''}
					sm={true}
					onChange={(e) => handleChange(fieldConfig.type === 'number' ? Number(e.target.value) : e.target.value)}
					placeholder={fieldConfig.placeholder}
					invalid={validationState}
					disabled={false}
					type={fieldConfig.type === 'number' ? 'number' : undefined}
				/>
			</S.ConfigurationFormFieldWrapper>
		);
	}

	// For complex field types (JSON, arrays), use custom styling
	return (
		<S.FormFieldWrapper>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<S.FormLabel>{fieldKey.replace(/_/g, ' ')}</S.FormLabel>
				{fieldConfig.type === 'array' && (
					<Button
						type={'alt3'}
						label={'Add Item'}
						handlePress={() => {
							const arrayValue = Array.isArray(value) ? value : [];
							const newItem = {};
							// Initialize with empty values for each field type
							if (fieldConfig.items) {
								Object.keys(fieldConfig.items).forEach((key) => {
									const itemConfig = fieldConfig.items[key];
									switch (itemConfig.type) {
										case 'string':
											newItem[key] = '';
											break;
										case 'number':
											newItem[key] = 0;
											break;
										default:
											newItem[key] = '';
									}
								});
							}
							handleChange([...arrayValue, newItem]);
						}}
					/>
				)}
			</div>
			<S.FormDescription>{fieldConfig.description}</S.FormDescription>
			{renderField()}
		</S.FormFieldWrapper>
	);
};

const ConfigurationForm = ({
	configuration,
	data,
	setData,
}: {
	configuration: any;
	data: any;
	setData: (data: any) => void;
}) => {
	const handleFieldChange = (path: string, value: any) => {
		const newData = { ...data };
		const keys = path.split('.');
		let current = newData;

		// Navigate to the parent of the target field
		for (let i = 0; i < keys.length - 1; i++) {
			if (!current[keys[i]]) {
				current[keys[i]] = {};
			}
			current = current[keys[i]];
		}

		// Set the value (or remove if empty)
		const fieldKey = keys[keys.length - 1];
		if (
			value === '' ||
			value === null ||
			value === undefined ||
			(typeof value === 'string' && value.trim() === '') ||
			(typeof value === 'number' && value === 0)
		) {
			delete current[fieldKey];
		} else {
			current[fieldKey] = value;
		}

		setData(newData);
	};

	return (
		<S.ConfigurationFormContainer>
			{Object.keys(configuration).map((fieldKey) => (
				<ConfigFormField
					key={fieldKey}
					fieldKey={fieldKey}
					fieldConfig={configuration[fieldKey]}
					value={data?.[fieldKey]}
					onChange={handleFieldChange}
				/>
			))}
		</S.ConfigurationFormContainer>
	);
};

export default function Layout(props: {
	activeTab: number;
	setActiveTab?: (tab: number) => void;
	settings: ISettings;
	setSettings: (settings: ISettings) => void;
}) {
	const [selectedDevice, setSelectedDevice] = useState(props.settings.selectedDevice || devices[0].id);
	const [showJSON, setShowJSON] = useState(false);
	const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
		// Initialize all groups as expanded
		const initialState: Record<string, boolean> = {};
		device_actions.forEach((deviceAction) => {
			initialState[deviceAction.id] = false;
		});
		return initialState;
	});

	// Pipeline state - using settings.actions
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
	const [expandedParams, setExpandedParams] = useState<Record<string, boolean>>({});

	// Get pipeline from settings
	const pipeline = props.settings.actions || [];

	// Update selectedDevice when settings change (e.g., from file import)
	useEffect(() => {
		if (props.settings.selectedDevice && props.settings.selectedDevice !== selectedDevice) {
			setSelectedDevice(props.settings.selectedDevice);
		}
	}, [props.settings.selectedDevice]);

	// Get current server configuration (shared by all devices)
	const getCurrentServerConfig = () => {
		if (props.settings.currentServer) {
			const currentServer = props.settings.servers.find((server) => server.name === props.settings.currentServer);
			return currentServer?.configuration || {};
		}
		return {};
	};

	const [data, setData] = useState(getCurrentServerConfig());

	// Load shared server configuration when server changes or server data updates
	useEffect(() => {
		const serverConfig = getCurrentServerConfig();
		setData(serverConfig);
	}, [props.settings.currentServer, props.settings.servers]);

	// Generate a key for JSONWriter to force re-render when data changes
	const jsonKey = useMemo(() => {
		return JSON.stringify(data);
	}, [data]);

	// Update both local state and settings when data changes
	const updateData = (newData: any) => {
		setData(newData);

		if (props.settings.currentServer) {
			const updatedSettings = { ...props.settings };
			const serverIndex = updatedSettings.servers.findIndex((server) => server.name === props.settings.currentServer);

			if (serverIndex !== -1) {
				// Clean empty values before saving to configuration
				const cleanedData = cleanEmptyValues(newData) || {};
				updatedSettings.servers[serverIndex].configuration = cleanedData;
				props.setSettings(updatedSettings);
			}
		}
	};

	// Toggle expand/collapse for action groups
	const toggleGroupExpanded = (groupId: string) => {
		setExpandedGroups((prev) => ({
			...prev,
			[groupId]: !prev[groupId],
		}));
	};

	// Pipeline functions
	const addToPipeline = (deviceAction: any, actionKey: string, action: any) => {
		// Initialize parameters with default values
		const initialParameters: Record<string, any> = {};
		if (action.params) {
			action.params.forEach((param: any) => {
				switch (param.type) {
					case 'server':
						initialParameters[param.name] = props.settings.currentServer || '';
						break;
					case 'json':
						initialParameters[param.name] = {};
						break;
					default:
						initialParameters[param.name] = '';
				}
			});
		}

		const newItem = {
			id: deviceAction.id,
			deviceId: deviceAction.id,
			deviceLabel: deviceAction.label,
			actionKey,
			action,
			uniqueId: `${deviceAction.id}-${actionKey}-${Date.now()}-${Math.random()}`,
			parameters: initialParameters,
		};
		const updatedSettings = {
			...props.settings,
			actions: [...pipeline, newItem] as IAction[],
		};
		props.setSettings(updatedSettings);
	};

	const removeFromPipeline = (uniqueId: string) => {
		const updatedSettings = {
			...props.settings,
			actions: pipeline.filter((item) => item.uniqueId !== uniqueId),
		};
		props.setSettings(updatedSettings);
	};

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
			...props.settings,
			actions: updatedActions,
		};
		props.setSettings(updatedSettings);
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
			...props.settings,
			actions: newPipeline,
		};
		props.setSettings(updatedSettings);
		setDraggedIndex(null);
		setDragOverIndex(null);
	};

	// Handle drag over container for dropping at end
	const handleContainerDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		const containerRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const mouseY = e.clientY;
		const containerBottom = containerRect.bottom - 16; // Account for padding

		if (mouseY > containerBottom - 20) {
			setDragOverIndex(pipeline.length);
		}
	};

	const handleDragEnd = () => {
		setDraggedIndex(null);
		setDragOverIndex(null);
	};

	// Toggle parameter expansion
	const toggleParameterExpansion = (uniqueId: string) => {
		setExpandedParams((prev) => ({
			...prev,
			[uniqueId]: !prev[uniqueId],
		}));
	};

	const [results, setResults] = useState<
		Array<{
			actionKey: string;
			deviceLabel: string;
			serverName: string;
			result: any;
			success: boolean;
			error?: string;
		}>
	>([]);
	const [expandedResults, setExpandedResults] = useState<Record<number, boolean>>({});

	// Toggle result expansion
	const toggleResultExpansion = (index: number) => {
		setExpandedResults((prev) => ({
			...prev,
			[index]: !prev[index],
		}));
	};

	// Pipeline execution functions
	const executeAction = async (pipelineItem: any): Promise<any> => {
		const { action, parameters, deviceLabel, actionKey } = pipelineItem;
		// Validate basic structure
		if (!action) {
			throw new Error(`Action definition missing for ${actionKey}`);
		}

		if (!action.url) {
			throw new Error(`Action URL missing for ${actionKey}`);
		}

		if (!action.method) {
			throw new Error(`Action method missing for ${actionKey}`);
		}

		// Get server configuration
		const serverName = parameters?.server;
		if (!serverName) {
			console.error('Parameters object:', parameters);
			throw new Error(
				`No server selected for action ${actionKey}. Please select a server in the parameter configuration.`
			);
		}

		const server = props.settings.servers.find((s) => s.name === serverName);
		if (!server) {
			throw new Error(`Server "${serverName}" not found`);
		}

		// Find device action definition
		const deviceAction = device_actions.find((d) => d.label === deviceLabel);
		if (!deviceAction) {
			throw new Error(`Device "${deviceLabel}" not found`);
		}

		if (!deviceAction.baseUrl) {
			throw new Error(`Base URL missing for device ${deviceLabel}`);
		}

		// Construct URL with proper handling
		const baseUrl = server.url.endsWith('/') ? server.url.slice(0, -1) : server.url;

		// Handle baseUrl - ensure it starts with /
		let actionBaseUrl = deviceAction.baseUrl;
		if (!actionBaseUrl.startsWith('/')) {
			actionBaseUrl = '/' + actionBaseUrl;
		}
		// Remove trailing slash if present
		if (actionBaseUrl.endsWith('/')) {
			actionBaseUrl = actionBaseUrl.slice(0, -1);
		}

		// Handle action URL
		let actionUrl = action.url;
		if (!actionUrl.startsWith('/')) {
			actionUrl = '/' + actionUrl;
		}

		const fullUrl = `${baseUrl}${actionBaseUrl}${actionUrl}`;

		// Prepare request body/parameters
		const requestData: any = {};

		// Add all parameters except server (server is used for URL construction)
		if (parameters) {
			Object.keys(parameters).forEach((key) => {
				if (key !== 'server' && parameters[key] !== undefined && parameters[key] !== '') {
					if (key === 'config') {
						// Use server configuration for config parameter
						requestData[key] = server.configuration || {};
					} else {
						requestData[key] = parameters[key];
					}
				}
			});
		}

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
		let result = await response.text();
		return result;
	};

	const executePipeline = async () => {
		if (pipeline.length === 0) {
			return;
		}

		console.log('Starting pipeline execution...');

		// Clear previous results
		setResults([]);
		setExpandedResults({});

		try {
			const pipelineResults = await Promise.all(
				pipeline.map(async (item, index) => {
					console.log(`Executing step ${index + 1}/${pipeline.length}: ${item.deviceLabel} - ${item.actionKey}`);

					try {
						const result = await executeAction(item);
						console.log(`Step ${index + 1} completed successfully`);

						return {
							actionKey: item.actionKey,
							deviceLabel: item.deviceLabel,
							serverName: item.parameters?.server || 'Unknown',
							result: result,
							success: true,
						};
					} catch (error) {
						console.error(`Step ${index + 1} failed:`, error);

						return {
							actionKey: item.actionKey,
							deviceLabel: item.deviceLabel,
							serverName: item.parameters?.server || 'Unknown',
							result: null,
							success: false,
							error: error.message,
						};
					}
				})
			);

			setResults(pipelineResults);
			console.log('Pipeline execution completed!');
		} catch (error) {
			console.error('Pipeline execution failed:', error);
		}
	};

	return (
		<>
			{props.activeTab === 0 && (
				<S.SectionMain>
					<S.Section className={'Small'}>
						<S.Header>Device Configuration</S.Header>
						<S.Content>
							<S.DeviceOptions>
								{devices.map((device) => (
									<S.DeviceOption
										key={device.id}
										onClick={() => {
											setSelectedDevice(device.id);
											props.setSettings({ ...props.settings, selectedDevice: device.id });
											// Both devices use the same shared server configuration
										}}
										className={selectedDevice === device.id ? 'active' : ''}
									>
										{device.label}
									</S.DeviceOption>
								))}
							</S.DeviceOptions>
						</S.Content>
					</S.Section>
					<S.Section className={'Fill'}>
						<S.Header className={'Split'}>
							<span>Configure</span>
							<span className={'Device'}>{devices.find((device) => device.id === selectedDevice)?.label}</span>

							{showJSON && (
								<Button
									type={'alt3'}
									iconLeftAlign
									icon={ASSETS.article}
									label={'Switch to Form'}
									handlePress={() => setShowJSON(!showJSON)}
								/>
							)}
							{!showJSON && (
								<Button
									type={'alt3'}
									iconLeftAlign
									icon={ASSETS.code}
									label={'Switch to Json'}
									handlePress={() => setShowJSON(!showJSON)}
								/>
							)}
						</S.Header>
						<S.Content>
							{showJSON && (
								<JSONWriter
									key={jsonKey}
									alt1={true}
									initialData={cleanEmptyValues(data) || {}}
									handleChange={(jsonData) => updateData(jsonData)}
									loading={false}
									hideButton={true}
									ignoreOnEnter={true}
								/>
							)}
							{!showJSON && (
								<ConfigurationForm
									configuration={devices.find((device) => device.id === selectedDevice)?.configuration || {}}
									data={data}
									setData={updateData}
								/>
							)}
						</S.Content>
					</S.Section>
				</S.SectionMain>
			)}
			{props.activeTab === 1 && (
				<S.SectionMain>
					<S.Section className={'Small'}>
						<S.Header>Actions</S.Header>
						<S.Content>
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
														<S.ActionItem
															key={actionKey}
															onClick={() => addToPipeline(deviceAction, actionKey, action)}
														>
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
						</S.Content>
					</S.Section>
					<S.Section>
						<S.Header className={'Split'}>
							Action Pipeline
							<S.PipelineActions>
								<Button
									type={'alt3'}
									iconLeftAlign
									icon={ASSETS.delete}
									label={'Clear'}
									handlePress={() => {
										props.setSettings({ ...props.settings, actions: [] });
									}}
								/>
								<Button type={'alt3'} iconLeftAlign icon={ASSETS.send} label={'Run'} handlePress={executePipeline} />
							</S.PipelineActions>
						</S.Header>
						<S.Content>
							{pipeline.length === 0 ? (
								<S.PipelinePlaceholder>Click actions from the left to add them to the pipeline</S.PipelinePlaceholder>
							) : (
								<S.PipelineContainer onDragOver={handleContainerDragOver} onDrop={handleDrop}>
									{pipeline.map((item, index) => {
										const isDragging = draggedIndex === index;
										const showDropLineAbove =
											dragOverIndex === index && draggedIndex !== null && draggedIndex !== index;

										return (
											<React.Fragment key={item.uniqueId}>
												{showDropLineAbove && <S.DropIndicator />}
												<S.PipelineItem
													draggable
													onDragStart={(e) => handleDragStart(e, index)}
													onDragEnter={(e) => handleDragEnter(e, index)}
													onDragEnd={handleDragEnd}
													className={isDragging ? 'dragging' : ''}
												>
													<S.PipelineItemHeader
														onClick={
															item.action.params &&
															item.action.params.filter((param: any) => param.name !== 'config').length > 0
																? () => toggleParameterExpansion(item.uniqueId)
																: undefined
														}
														className={
															item.action.params &&
															item.action.params.filter((param: any) => param.name !== 'config').length > 0
																? 'clickable'
																: ''
														}
													>
														<S.DragHandle>⋮⋮</S.DragHandle>
														<S.PipelineItemTitle>
															<span className="device">{item.deviceLabel}</span>
															<div className="action-row">
																<span className="action">{item.actionKey}</span>
																<S.ActionDescription className="inline">{item.action.description}</S.ActionDescription>
															</div>
														</S.PipelineItemTitle>
														<S.PipelineItemActions>
															{item.parameters.server && <S.ServerBadge>{item.parameters.server}</S.ServerBadge>}

															<S.MethodBadge method={item.action.method}>{item.action.method}</S.MethodBadge>
															<IconButton
																type={'primary'}
																src={ASSETS.delete}
																tooltip={'Remove'}
																tooltipPosition={'top'}
																dimensions={{
																	wrapper: 26,
																	icon: 14,
																}}
																handlePress={(e) => {
																	e?.stopPropagation();
																	removeFromPipeline(item.uniqueId);
																}}
															/>
															{item.action.params &&
																item.action.params.filter((param: any) => param.name !== 'config').length > 0 && (
																	<S.ExpandIcon className={expandedParams[item.uniqueId] ? 'expanded' : 'collapsed'}>
																		{expandedParams[item.uniqueId] ? '▼' : '▶'}
																	</S.ExpandIcon>
																)}
														</S.PipelineItemActions>
													</S.PipelineItemHeader>
													{item.action.params &&
														item.action.params.filter((param: any) => param.name !== 'config').length > 0 &&
														expandedParams[item.uniqueId] && (
															<S.ParametersContainer>
																{item.action.params
																	.filter((param: any) => param.name !== 'config')
																	.map((param: any) => (
																		<ParameterField
																			key={param.name}
																			param={param}
																			value={item.parameters?.[param.name]}
																			onChange={(value) => updateActionParameter(item.uniqueId, param.name, value)}
																			servers={props.settings.servers}
																		/>
																	))}
															</S.ParametersContainer>
														)}
												</S.PipelineItem>
											</React.Fragment>
										);
									})}
									{dragOverIndex === pipeline.length && draggedIndex !== null && <S.DropIndicator />}
								</S.PipelineContainer>
							)}
						</S.Content>
					</S.Section>
					<S.Section>
						<S.Header>Results</S.Header>
						<S.Content>
							<S.ResultsContainer>
								{results.length === 0 ? (
									<S.PipelinePlaceholder>No results yet. Run the pipeline to see results here.</S.PipelinePlaceholder>
								) : (
									results.map((resultItem, index) => {
										const isExpanded = expandedResults[index];
										return (
											<S.ResultItem key={index}>
												<S.ResultHeader success={resultItem.success} onClick={() => toggleResultExpansion(index)}>
													<S.ResultInfo>
														<S.ResultTitle>
															<span>{resultItem.deviceLabel}</span>
															<span>→</span>
															<span>{resultItem.actionKey}</span>
														</S.ResultTitle>
														<S.ResultSubtitle>Server: {resultItem.serverName}</S.ResultSubtitle>
													</S.ResultInfo>
													<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
														<S.ResultStatus success={resultItem.success}>
															{resultItem.success ? 'Success' : 'Error'}
														</S.ResultStatus>
														<S.ExpandIcon className={isExpanded ? 'expanded' : 'collapsed'}>
															{isExpanded ? '▼' : '▶'}
														</S.ExpandIcon>
													</div>
												</S.ResultHeader>
												{isExpanded &&
													(resultItem.success ? (
														<S.ResultContent>
															<pre>{resultItem.result}</pre>
														</S.ResultContent>
													) : (
														<S.ErrorContent>
															<strong>Error:</strong> {resultItem.error}
														</S.ErrorContent>
													))}
											</S.ResultItem>
										);
									})
								)}
							</S.ResultsContainer>
						</S.Content>
					</S.Section>
				</S.SectionMain>
			)}
		</>
	);
}
