import { ISettings } from './types';

// Default application settings
export const DEFAULT_SETTINGS: ISettings = {
	servers: [
		{
			name: 'Default',
			url: 'http://localhost:8734',
			configuration: {},
		},
	],
	actions: [],
	currentServer: 'Default',
	selectedDevice: 'snp',
};

// UI Constants
export const TABS = {
	CONFIGURATION: 0,
	ACTIONS: 1,
} as const;

// Storage keys
export const STORAGE_KEYS = {
	OPERATOR_SETTINGS: 'operator_settings',
	OPERATOR_WORKSPACE: 'operator_workspace',
} as const;

// HTTP configuration
export const HTTP_CONFIG = {
	TIMEOUT: 30000,
	RETRY_ATTEMPTS: 3,
	DEFAULT_HEADERS: {
		'Content-Type': 'application/json',
	},
} as const;
