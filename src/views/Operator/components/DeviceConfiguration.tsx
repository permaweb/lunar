import React, { useMemo, useState } from 'react';

import { Button } from 'components/atoms/Button';
import JSONWriter from 'components/molecules/JSONWriter/JSONWriter';
import { ASSETS } from 'helpers/config';

import { devices } from '../devices';
import * as S from '../styles/index';
import { ISettings } from '../types';
import { cleanEmptyValues } from '../utils';

import { ConfigurationForm } from './ConfigurationForm';

interface IDeviceConfigurationProps {
	settings: ISettings;
	setSettings: (settings: ISettings) => void;
}

export const DeviceConfiguration: React.FC<IDeviceConfigurationProps> = ({ settings, setSettings }) => {
	const [selectedDevice, setSelectedDevice] = useState(settings.selectedDevice || devices[0].id);
	const [showJSON, setShowJSON] = useState(false);

	// Get current server configuration (shared by all devices)
	const getCurrentServerConfig = () => {
		if (settings.currentServer) {
			const currentServer = settings.servers.find((server) => server.name === settings.currentServer);
			return currentServer?.configuration || {};
		}
		return {};
	};

	const [data, setData] = useState(getCurrentServerConfig());

	// Load shared server configuration when server changes or server data updates
	React.useEffect(() => {
		const serverConfig = getCurrentServerConfig();
		setData(serverConfig);
	}, [settings.currentServer, settings.servers]);

	// Update selectedDevice when settings change (e.g., from file import)
	React.useEffect(() => {
		if (settings.selectedDevice && settings.selectedDevice !== selectedDevice) {
			setSelectedDevice(settings.selectedDevice);
		}
	}, [settings.selectedDevice]);

	// Generate a key for JSONWriter to force re-render when data changes
	const jsonKey = useMemo(() => {
		return JSON.stringify(data);
	}, [data]);

	// Update both local state and settings when data changes
	const updateData = (newData: any) => {
		setData(newData);

		if (settings.currentServer) {
			const updatedSettings = { ...settings };
			const serverIndex = updatedSettings.servers.findIndex((server) => server.name === settings.currentServer);

			if (serverIndex !== -1) {
				// Clean empty values before saving to configuration
				const cleanedData = cleanEmptyValues(newData) || {};
				updatedSettings.servers[serverIndex].configuration = cleanedData;
				setSettings(updatedSettings);
			}
		}
	};

	const handleDeviceChange = (deviceId: string) => {
		setSelectedDevice(deviceId);
		setSettings({ ...settings, selectedDevice: deviceId });
	};

	return (
		<>
			<S.GridSection area={'devices'} className={'Small'}>
				<S.Header>Device Configuration</S.Header>
				<S.LayoutContent>
					<S.DeviceOptions>
						{devices.map((device) => (
							<S.DeviceOption
								key={device.id}
								onClick={() => handleDeviceChange(device.id)}
								className={selectedDevice === device.id ? 'active' : ''}
							>
								{device.label}
							</S.DeviceOption>
						))}
					</S.DeviceOptions>
				</S.LayoutContent>
			</S.GridSection>
			<S.GridSection area={'configure'} className={'Fill'}>
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
				<S.LayoutContent>
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
				</S.LayoutContent>
			</S.GridSection>
		</>
	);
};
