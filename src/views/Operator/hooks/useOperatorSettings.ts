import { useCallback, useEffect, useState } from 'react';

import { DEFAULT_SETTINGS, STORAGE_KEYS, TABS } from '../constants';
import { ISettings } from '../types';

export const useOperatorSettings = () => {
	const [settings, setSettings] = useState<ISettings>(DEFAULT_SETTINGS);
	const [activeTab, setActiveTab] = useState<number>(TABS.CONFIGURATION);

	// Load settings from localStorage on mount
	useEffect(() => {
		try {
			const savedSettings = localStorage.getItem(STORAGE_KEYS.OPERATOR_SETTINGS);
			if (savedSettings) {
				const parsed = JSON.parse(savedSettings);
				setSettings({ ...DEFAULT_SETTINGS, ...parsed });
			}
		} catch (error) {
			console.warn('Failed to load saved settings:', error);
		}
	}, []);

	// Save settings to localStorage whenever they change
	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEYS.OPERATOR_SETTINGS, JSON.stringify(settings));
		} catch (error) {
			console.warn('Failed to save settings:', error);
		}
	}, [settings]);

	// Settings update methods
	const updateSettings = useCallback((newSettings: ISettings) => {
		setSettings(newSettings);
	}, []);

	const updateServer = useCallback((serverName: string, serverData: any) => {
		setSettings((prev) => ({
			...prev,
			servers: prev.servers.map((server) => (server.name === serverName ? { ...server, ...serverData } : server)),
		}));
	}, []);

	const addServer = useCallback((server: { name: string; url: string; configuration: any }) => {
		setSettings((prev) => ({
			...prev,
			servers: [...prev.servers, server],
		}));
	}, []);

	const removeServer = useCallback((serverName: string) => {
		setSettings((prev) => ({
			...prev,
			servers: prev.servers.filter((server) => server.name !== serverName),
			currentServer: prev.currentServer === serverName ? prev.servers[0]?.name : prev.currentServer,
		}));
	}, []);

	const setCurrentServer = useCallback((serverName: string) => {
		setSettings((prev) => ({
			...prev,
			currentServer: serverName,
		}));
	}, []);

	const setSelectedDevice = useCallback((deviceId: string) => {
		setSettings((prev) => ({
			...prev,
			selectedDevice: deviceId,
		}));
	}, []);

	// Workspace import/export
	const exportWorkspace = useCallback(() => {
		const workspace = {
			settings,
			activeTab,
			exportedAt: new Date().toISOString(),
		};
		return JSON.stringify(workspace, null, 2);
	}, [settings, activeTab]);

	const importWorkspace = useCallback((workspaceData: string) => {
		try {
			const workspace = JSON.parse(workspaceData);
			if (workspace.settings) {
				setSettings({ ...DEFAULT_SETTINGS, ...workspace.settings });
			}
			if (workspace.activeTab !== undefined) {
				setActiveTab(workspace.activeTab);
			}
			return true;
		} catch (error) {
			console.error('Failed to import workspace:', error);
			return false;
		}
	}, []);

	const resetSettings = useCallback(() => {
		setSettings(DEFAULT_SETTINGS);
		setActiveTab(TABS.CONFIGURATION);
		localStorage.removeItem(STORAGE_KEYS.OPERATOR_SETTINGS);
	}, []);

	const updateActiveTab = useCallback((tabIndex: number) => {
		setActiveTab(tabIndex);
	}, []);

	return {
		// State
		settings,
		activeTab,

		// Basic setters
		updateSettings,
		setActiveTab: updateActiveTab,

		// Server management
		updateServer,
		addServer,
		removeServer,
		setCurrentServer,

		// Device management
		setSelectedDevice,

		// Workspace management
		exportWorkspace,
		importWorkspace,
		resetSettings,

		// Computed values
		currentServer: settings.servers.find((s) => s.name === settings.currentServer),
		serverCount: settings.servers.length,
	};
};
