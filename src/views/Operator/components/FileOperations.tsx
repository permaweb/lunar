import React, { useRef } from 'react';

import { Dropdown } from 'components/atoms/Dropdown';
import { NotificationType } from 'helpers/types';

import { ISettings } from '../types';

interface IFileOperationsProps {
	settings: ISettings;
	setSettings: (settings: ISettings) => void;
	onNotification: (notification: NotificationType) => void;
}

export const FileOperations: React.FC<IFileOperationsProps> = ({ settings, setSettings, onNotification }) => {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const saveFile = () => {
		try {
			const settingsData = {
				version: '1.0',
				exportDate: new Date().toISOString(),
				settings: {
					...settings,
					selectedDevice: settings.selectedDevice || 'snp',
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

			onNotification({
				message: 'Settings exported successfully!',
				status: 'success',
			});
		} catch (error) {
			console.error('Error saving file:', error);
			onNotification({
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
				setSettings(importedSettings);

				onNotification({
					message: `Settings imported successfully! Loaded ${importedData.settings.servers.length} server(s).`,
					status: 'success',
				});
			} catch (error) {
				console.error('Error loading file:', error);
				onNotification({
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

	return (
		<>
			<Dropdown options={fileOptions} label={'File'} disabled={false} />
			<input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileLoad} />
		</>
	);
};
