import React, { useState } from 'react';

import { Button } from 'components/atoms/Button';
import { FormField } from 'components/atoms/FormField';
import { Panel } from 'components/atoms/Panel';
import { ASSETS } from 'helpers/config';
import { ValidationType } from 'helpers/types';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from '../styles/index';
import { ISettings } from '../types';
import { ValidationSchema } from '../validation';

interface IServerManagerProps {
	settings: ISettings;
	setSettings: (settings: ISettings) => void;
}

export const ServerManager: React.FC<IServerManagerProps> = ({ settings, setSettings }) => {
	const [serversOpen, setServersOpen] = useState(false);
	const [newServerName, setNewServerName] = useState('');
	const [newServerUrl, setNewServerUrl] = useState('');
	const [showAddForm, setShowAddForm] = useState(false);

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const handleServerSelect = (serverName: string) => {
		const updatedSettings = { ...settings };
		updatedSettings.currentServer = serverName;
		setSettings(updatedSettings);
	};

	const handleAddServer = () => {
		if (newServerName.trim() && newServerUrl.trim()) {
			const updatedSettings = { ...settings };

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

			setSettings(updatedSettings);

			// Reset form
			setNewServerName('');
			setNewServerUrl('');
			setShowAddForm(false);
		}
	};

	const handleRemoveServer = (serverName: string) => {
		if (settings.servers.length <= 1) {
			alert('Cannot remove the last server!');
			return;
		}

		const updatedSettings = { ...settings };
		updatedSettings.servers = updatedSettings.servers.filter((s) => s.name !== serverName);

		// If removing current server, select the first remaining one
		if (updatedSettings.currentServer === serverName) {
			updatedSettings.currentServer = updatedSettings.servers[0]?.name;
		}

		setSettings(updatedSettings);
	};

	const validateServerName = (): ValidationType => {
		if (!newServerName.trim()) {
			return { status: false, message: null };
		}

		const validation = ValidationSchema.validateServerName(
			newServerName,
			settings.servers.map((s) => s.name)
		);

		return validation.isValid ? { status: false, message: null } : { status: true, message: validation.errors[0] };
	};

	const validateServerUrl = (): ValidationType => {
		if (!newServerUrl.trim()) {
			return { status: false, message: null };
		}

		const validation = ValidationSchema.validateServerUrl(newServerUrl);

		return validation.isValid ? { status: false, message: null } : { status: true, message: validation.errors[0] };
	};

	const resetForm = () => {
		setNewServerName('');
		setNewServerUrl('');
		setShowAddForm(false);
	};

	return (
		<>
			<Button
				type={'primary'}
				iconLeftAlign
				icon={ASSETS.filter}
				label={`${language.servers} (${settings.servers.length}): ${settings.currentServer}`}
				disabled={serversOpen}
				handlePress={() => setServersOpen(true)}
			/>

			<Panel open={serversOpen} width={550} header={language.servers} handleClose={() => setServersOpen(false)}>
				<S.Menu>
					<S.Content>
						<S.ServerListContainer>
							<S.ServerListHeader>
								<h3>Available Servers</h3>
								<Button
									type={'alt3'}
									label={showAddForm ? 'Cancel' : 'Add Server'}
									handlePress={() => {
										setShowAddForm(!showAddForm);
										if (showAddForm) {
											resetForm();
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
											sm={true}
											required={true}
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
											required={true}
											sm={true}
										/>
									</S.FormFieldContainer>

									<S.FormButtonContainer>
										<Button type={'alt1'} label={'Cancel'} handlePress={resetForm} />
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
								{settings.servers.map((server) => (
									<S.ServerItem key={server.name} isActive={settings.currentServer === server.name}>
										<S.ServerItemContent onClick={() => handleServerSelect(server.name)}>
											<S.ServerName isActive={settings.currentServer === server.name}>
												{server.name}
												{settings.currentServer === server.name && <span className="current-label">(Current)</span>}
											</S.ServerName>
											<S.ServerUrl>{server.url}</S.ServerUrl>
										</S.ServerItemContent>
										{settings.servers.length > 1 && (
											<Button type={'alt3'} label={'Remove'} handlePress={() => handleRemoveServer(server.name)} />
										)}
									</S.ServerItem>
								))}
							</S.ServerItemsContainer>
						</S.ServerListContainer>
					</S.Content>
				</S.Menu>
			</Panel>
		</>
	);
};
