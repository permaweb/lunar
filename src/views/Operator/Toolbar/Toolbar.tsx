import React from 'react';

import { Button } from 'components/atoms/Button';
import { Dropdown } from 'components/atoms/Dropdown';
import { FormField } from 'components/atoms/FormField';
import { Notification } from 'components/atoms/Notification';
import { Panel } from 'components/atoms/Panel';
import { ASSETS } from 'helpers/config';
import { NotificationType, ValidationType } from 'helpers/types';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { ISettings } from '../index';

import * as S from './styles';

export default function Toolbar(props: {
	activeTab: number;
	setActiveTab?: (tab: number) => void;
	settings: ISettings;
	setSettings: (settings: ISettings) => void;
}) {
	const [serversOpen, setServersOpen] = React.useState(false);
	const [newServerName, setNewServerName] = React.useState('');
	const [newServerUrl, setNewServerUrl] = React.useState('');
	const [showAddForm, setShowAddForm] = React.useState(false);
	const [notification, setNotification] = React.useState<NotificationType | null>(null);

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	// File input ref for loading files
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	const saveFile = () => {
		try {
			const settingsData = {
				version: '1.0',
				exportDate: new Date().toISOString(),
				settings: {
					...props.settings,
					selectedDevice: props.settings.selectedDevice || 'snp', // Default to 'snp' if not set
				},
			};

			const dataStr = JSON.stringify(settingsData, null, 2);
			const dataBlob = new Blob([dataStr], { type: 'application/json' });

			const link = document.createElement('a');
			link.href = URL.createObjectURL(dataBlob);
			link.download = `hb-operator-settings-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(link.href);

			setNotification({
				message: 'Settings exported successfully!',
				status: 'success',
			});
		} catch (error) {
			console.error('Error saving file:', error);
			setNotification({
				message: 'Failed to export settings',
				status: 'warning',
			});
		}
	};

	const openFile = () => {
		fileInputRef.current?.click();
	};

	const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const content = e.target?.result as string;
				const importedData = JSON.parse(content);

				// Validate the imported data structure
				if (!importedData.settings || !importedData.settings.servers || !Array.isArray(importedData.settings.servers)) {
					throw new Error('Invalid settings file format');
				}

				// Ensure selectedDevice is included, default to 'snp' if not present
				const importedSettings = {
					...importedData.settings,
					selectedDevice: importedData.settings.selectedDevice || 'snp',
				};

				// Apply the imported settings
				props.setSettings(importedSettings);

				setNotification({
					message: `Settings imported successfully! Loaded ${importedData.settings.servers.length} server(s).`,
					status: 'success',
				});
			} catch (error) {
				console.error('Error loading file:', error);
				setNotification({
					message: 'Failed to import settings. Please check the file format.',
					status: 'warning',
				});
			}
		};

		reader.readAsText(file);
		event.target.value = ''; // Reset input
	};
	const fileOptions = [
		{ id: 'open', label: 'Import Settings', fn: openFile },
		{ id: 'save', label: 'Export Settings', fn: saveFile },
	];

	const handleServerSelect = (serverName: string) => {
		const updatedSettings = { ...props.settings };
		updatedSettings.currentServer = serverName;
		props.setSettings(updatedSettings);
	};

	const handleAddServer = () => {
		if (newServerName.trim() && newServerUrl.trim()) {
			const updatedSettings = { ...props.settings };

			// Check if server name already exists
			const existingServer = updatedSettings.servers.find((s) => s.name === newServerName);
			if (existingServer) {
				alert('Server name already exists!');
				return;
			}

			// Add new server
			updatedSettings.servers.push({
				name: newServerName.trim(),
				url: newServerUrl.trim(),
				configuration: {},
			});

			// Set as current server
			updatedSettings.currentServer = newServerName.trim();

			props.setSettings(updatedSettings);

			// Reset form
			setNewServerName('');
			setNewServerUrl('');
			setShowAddForm(false);
		}
	};

	const handleRemoveServer = (serverName: string) => {
		if (props.settings.servers.length <= 1) {
			alert('Cannot remove the last server!');
			return;
		}

		const updatedSettings = { ...props.settings };
		updatedSettings.servers = updatedSettings.servers.filter((s) => s.name !== serverName);

		// If removing current server, select the first remaining one
		if (updatedSettings.currentServer === serverName) {
			updatedSettings.currentServer = updatedSettings.servers[0]?.name;
		}

		props.setSettings(updatedSettings);
	};

	const validateServerName = (): ValidationType => {
		if (!newServerName.trim()) {
			return { status: false, message: null };
		}

		const exists = props.settings.servers.some((s) => s.name === newServerName);
		if (exists) {
			return { status: true, message: 'Server name already exists' };
		}

		return { status: false, message: null };
	};

	const validateServerUrl = (): ValidationType => {
		if (!newServerUrl.trim()) {
			return { status: false, message: null };
		}

		try {
			new URL(newServerUrl);
			return { status: false, message: null };
		} catch {
			return { status: true, message: 'Please enter a valid URL' };
		}
	};

	return (
		<>
			<S.Wrapper>
				<S.Left>
					<Dropdown options={fileOptions} label={'File'} disabled={false} />
				</S.Left>

				<S.TabsWrapper>
					<S.Tab active={props.activeTab === 0} onClick={() => props.setActiveTab(0)}>
						Configuration
					</S.Tab>
					<S.Tab active={props.activeTab === 1} onClick={() => props.setActiveTab(1)}>
						Action Pipeline
					</S.Tab>
				</S.TabsWrapper>
				<S.Right>
					<Button
						type={'primary'}
						iconLeftAlign
						icon={ASSETS.filter}
						label={language.servers + ' (' + props.settings.servers.length + ')' + ': ' + props.settings.currentServer}
						disabled={serversOpen}
						handlePress={() => setServersOpen(true)}
					/>
				</S.Right>

				<Panel open={serversOpen} width={550} header={language.servers} handleClose={() => setServersOpen(false)}>
					<S.Menu>
						<S.Content>
							{/* Server List */}
							<S.ServerListContainer>
								<S.ServerListHeader>
									<h3>Available Servers</h3>
									<Button
										type={'alt3'}
										label={showAddForm ? 'Cancel' : 'Add Server'}
										handlePress={() => {
											setShowAddForm(!showAddForm);
											if (showAddForm) {
												setNewServerName('');
												setNewServerUrl('');
											}
										}}
									/>
								</S.ServerListHeader>
								{/* Add Server Form */}
								{showAddForm && (
									<S.AddServerForm>
										<h4>Add New Server</h4>

										<S.FormFieldContainer>
											<FormField
												label="Server Name"
												value={newServerName}
												onChange={(e) => setNewServerName(e.target.value)}
												placeholder="e.g., Production Server"
												invalid={validateServerName()}
												disabled={false}
												required
											/>
										</S.FormFieldContainer>

										<S.FormFieldContainer>
											<FormField
												label="Server URL"
												value={newServerUrl}
												onChange={(e) => setNewServerUrl(e.target.value)}
												placeholder="https://example.com:8734"
												invalid={validateServerUrl()}
												disabled={false}
												required
											/>
										</S.FormFieldContainer>

										<S.FormButtonContainer>
											<Button
												type={'alt1'}
												label={'Cancel'}
												handlePress={() => {
													setShowAddForm(false);
													setNewServerName('');
													setNewServerUrl('');
												}}
											/>
											<Button
												type={'success'}
												label={'Add Server'}
												handlePress={handleAddServer}
												disabled={
													!newServerName.trim() ||
													!newServerUrl.trim() ||
													validateServerName().status ||
													validateServerUrl().status
												}
											/>
										</S.FormButtonContainer>
									</S.AddServerForm>
								)}
								{/* Server List Items */}
								<S.ServerItemsContainer>
									{props.settings.servers.map((server) => (
										<S.ServerItem key={server.name} isActive={props.settings.currentServer === server.name}>
											<S.ServerItemContent onClick={() => handleServerSelect(server.name)}>
												<S.ServerName isActive={props.settings.currentServer === server.name}>
													{server.name}
													{props.settings.currentServer === server.name && (
														<span className="current-label">(Current)</span>
													)}
												</S.ServerName>
												<S.ServerUrl>{server.url}</S.ServerUrl>
											</S.ServerItemContent>
											{props.settings.servers.length > 1 && (
												<Button type={'alt3'} label={'Remove'} handlePress={() => handleRemoveServer(server.name)} />
											)}
										</S.ServerItem>
									))}
								</S.ServerItemsContainer>
							</S.ServerListContainer>
						</S.Content>
					</S.Menu>
				</Panel>

				{/* Hidden file input for importing settings */}
				<input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileLoad} />

				{/* Notification */}
				{notification && (
					<Notification
						message={notification.message}
						type={notification.status}
						callback={() => setNotification(null)}
					/>
				)}
			</S.Wrapper>
		</>
	);
}
